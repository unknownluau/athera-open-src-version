local jobId = "InsertJobIdHere";
local userId = 65789275746246;
local mode = "R6";
local baseURL = "http://localhost";
local uploadURL = "UPLOAD_URL_HERE";

-- services
local ScriptContext = game:GetService("ScriptContext");
local Lighting = game:GetService('Lighting');
local RunService = game:GetService('RunService');
local ContentProvider = game:GetService('ContentProvider');
local HttpService = game:GetService("HttpService");
local ThumbnailGenerator = game:GetService('ThumbnailGenerator');
local Players = game:GetService("Players");
local Insert = game:GetService("InsertService");

-- config
game:GetService('StarterGui'):SetCoreGuiEnabled(Enum.CoreGuiType.All, false);
game:GetService('ThumbnailGenerator').GraphicsMode = 2;
HttpService.HttpEnabled = true;
ScriptContext.ScriptsDisabled = true;
Lighting.Outlines = false;
ContentProvider:SetBaseUrl("http://localhost/");

Insert:SetAssetUrl("http://localhost/asset/?id=%d");
Insert:SetAssetVersionUrl("http://localhost/Asset/?assetversionid=%d");

local function applyMesh(Player, children, limb)
    print("[DEBUG] applying mesh to:", limb);
    local ok, msg = pcall(function() 
        local specialMesh = children[1]
        local head = Player.Character[limb]
        local m = head:FindFirstChild("Mesh") or Instance.new("SpecialMesh", head)

        m.Scale = specialMesh.Scale
        m.TextureId = specialMesh.TextureId
        m.MeshId = specialMesh.MeshId
        m.MeshType = specialMesh.MeshType
        m.VertexColor = specialMesh.VertexColor
    end)
    if not ok then
        print("[ERROR] error loading mesh:", msg)
    end
end

local function applyPackage(Player, children)
    print("[DEBUG] applying package with", #children, "items");
    local ok, msg = pcall(function() 
        for _, asset in pairs(children) do
            print("[DEBUG] adding package item:", asset.Name);
            asset.Parent = Player.Character
        end
    end)
    if not ok then
        print("[ERROR] error loading package:", msg)
    end
end

local function render(id)
    print("[DEBUG] starting render:", id);
    local Player = Players:CreateLocalPlayer(id)
    Player:LoadCharacter()
    print("[DEBUG] loaded");

    local av = HttpService:JSONDecode('JSON_AVATAR')

    local test = false
    local testasset = 17

    local done = 0
    for _, asset in pairs(av.assets) do
        print("[DEBUG] loading asset:", asset.name, "ID:", asset.id);
        coroutine.wrap(function()
            local ok, Asset = pcall(function()
                if test then
                    return Insert:LoadAsset(testasset)
                else
                    return Insert:LoadAsset(asset.id)
                end
            end)

            if not ok then
                print("[ERROR] failed to load:", asset.id, "error:", Asset);
                done = done + 1
                return
            end

            local children = Asset:GetChildren()
            print("[DEBUG] asset loaded", #children, "children");

            if asset.assetType.id == 17 then
                applyMesh(Player, children, "Head")
            elseif asset.assetType.id == 27 or asset.assetType.id == 28 or asset.assetType.id == 29 or asset.assetType.id == 30 or asset.assetType.id == 31 then
                applyPackage(Player, children)
            else
                for _, item in pairs(children) do
                    print("[DEBUG] adding item:", item.Name, "Type:", asset.assetType.id);
                    if asset.assetType.id == 18 then
                        local head = Player.Character.Head
                        if head:FindFirstChild("face") then
                            head.face:Destroy()
                        end
                        item.Name = "face"
                        item.Parent = head
                    else
                        item.Parent = Player.Character
                    end
                end
            end
            done = done + 1
        end)()
    end

    repeat wait() until done == #av.assets
    print("[DEBUG] assets applied to char");

    -- Set body colors
    print("[DEBUG] applying body colors");
    local bc = av.bodyColors
    local colors = {
        ['Head'] = bc.headColorId,
        ['Torso'] = bc.torsoColorId,
        ['Left Arm'] = bc.leftArmColorId,
        ['Right Arm'] = bc.rightArmColorId,
        ['Left Leg'] = bc.leftLegColorId,
        ['Right Leg'] = bc.rightLegColorId
    }

    for part, color in pairs(colors) do
        if Player.Character:FindFirstChild(part) then
            Player.Character[part].BrickColor = BrickColor.new(color)
            print("[DEBUG] applied colours to", part);
        else
            print("[WARNING] could not find", part, "in character");
        end
    end

    for _, object in pairs(Player.Character:GetChildren()) do
        if object:IsA('Tool') then
            print("[DEBUG] gear found, raising right arm");
            Player.Character.Torso['Right Shoulder'].CurrentAngle = math.rad(90)
        end
    end

	-- render
    local hasCam = game.Workspace:GetChildren()[1]
    if hasCam and hasCam:FindFirstChild("ThumbnailCamera") then
        print("[DEBUG] rendering...");
    else
        print("[WARNING] no ThumbnailCamera found, using default");
    end

    local avatarEncoded = ThumbnailGenerator:Click('_FORMAT_', _X_RES_, _Y_RES_, true, false)
    print("[DEBUG] thumb rendered");

    print("[DEBUG] destroying");
    Player.Character:Destroy()

    print("[DEBUG] sending thumb");
    local ok, data = pcall(function()
        return HttpService:PostAsync(uploadURL, HttpService:JSONEncode({
            ['thumbnail'] = avatarEncoded,
            ['userId'] = userId,
            ['accessKey'] = "AccessKey",
            ['type'] = "PlayerThumbnail",
            ['jobId'] = jobId,
        }), Enum.HttpContentType.TextPlain)
    end)

    print("[DEBUG] thumb sent - Success:", ok, "Response:", data);
end

coroutine.wrap(function()
    local ok, data = pcall(function()
        render(1)
    end)
end)()
