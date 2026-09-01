local Lighting = game:GetService("Lighting")
local assetId = {1234}
local baseURL = "http://localhost"
local jobId = "InsertJobIdHere"
local uploadURL = "UPLOAD_URL_HERE";
local ThumbnailGenerator = game:GetService("ThumbnailGenerator")
local HttpService = game:GetService("HttpService")
game:GetService("ContentProvider"):SetBaseUrl(baseURL)
game:GetService("InsertService"):SetAssetUrl(baseURL .. "/asset/?id=%d")
game:GetService("ScriptContext").ScriptsDisabled = true
HttpService.HttpEnabled = true
ThumbnailGenerator.GraphicsMode = 2 

function rendermesh(id)
    print('rendering mesh ' .. id)
    local meshPart = Instance.new("Part", workspace)
    meshPart.Anchored = true
    
    local mesh = Instance.new("SpecialMesh", meshPart)
    mesh.MeshType = "FileMesh"
    mesh.MeshId = ("%s/asset?id=%d"):format(baseURL, id)
    meshPart.Size = Vector3.new(2, 2, 2)

    local encoded = ThumbnailGenerator:Click('PNG', _X_RES_, _Y_RES_, true, true)
    print('rendered mesh ' .. id)
    return encoded
end

local function main()
    for _, id in pairs(assetId) do
        print("starting render for mesh", id)
        local thumb = rendermesh(id)
		print(thumb)
        
        print("[debug] sending post request containing mesh thumb")
        local ok, data = pcall(function()
            return HttpService:PostAsync(uploadURL, HttpService:JSONEncode({
                ['type'] = 'Asset',
                ['assetId'] = id,
                ['thumbnail'] = thumb,
                ['accessKey'] = "AccessKey",
                ['jobId'] = jobId,
            }), Enum.HttpContentType.TextPlain)
        end)
        
        print("[debug] post result:", ok, data)
    end
    
    print("[debug] exit game")
end

local success, err = pcall(main)
if not success then
    print("Error:", err)
end