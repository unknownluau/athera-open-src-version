local Players = game:GetService("Players")
local HttpService = game:GetService("HttpService")
pcall(function()
	HttpService.HttpEnabled = true
end)
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local API_URL = "https://athera.sbs/apisite/users/v1/users/%d"
return function(ChatService)
	local VerifiedUsersFolder = ReplicatedStorage:FindFirstChild("VerifiedUsers")
	if not VerifiedUsersFolder then
		VerifiedUsersFolder = Instance.new("Folder")
		VerifiedUsersFolder.Name = "VerifiedUsers"
		VerifiedUsersFolder.Parent = ReplicatedStorage
	end
	local function onPlayerAdded(player)
		print("[verification] checking verification for player: " .. player.Name .. " (" .. tostring(player.UserId) .. ")")
		
		local ServerStorage = game:GetService("ServerStorage")
		local fetchStatus = ServerStorage:WaitForChild("FetchVerifiedStatus", 10)
		
		if not fetchStatus then
			warn("[verification] FetchVerifiedStatus BindableFunction not found!")
			return
		end

		local success, result = fetchStatus:Invoke(player.UserId)
		
		if not success then
			warn("[verification] error fetching verification status via Bindable: " .. tostring(result))
			return
		end
		
		print("[verification] raw response: " .. tostring(result))
		
		local decodeSuccess, decoded = pcall(function()
			return HttpService:JSONDecode(result)
		end)

		if not decodeSuccess then
			warn("[verification] failed to decode JSON: " .. tostring(decoded))
			return
		end
		
		print("[verification] decoded JSON. isVerified: " .. tostring(decoded.isVerified))
		if decoded.isVerified == true then
			local val = Instance.new("BoolValue")
			val.Name = tostring(player.UserId)
			val.Value = true
			val.Parent = VerifiedUsersFolder
			print("[verification] successfully granted Verified Badge to " .. player.Name)
		end
	end
	Players.PlayerAdded:Connect(onPlayerAdded)
	for _, player in ipairs(Players:GetPlayers()) do
		spawn(function()
			onPlayerAdded(player)
		end)
	end
end
