local ReplicatedStorage = game:GetService("ReplicatedStorage")
local VerifiedUsersFolder = ReplicatedStorage:WaitForChild("VerifiedUsers", 10)
local VerifiedUsers = {}
setmetatable(VerifiedUsers, {
	__index = function(self, key)
		if typeof(key) == "number" then
			key = tostring(key)
		end
		if VerifiedUsersFolder and VerifiedUsersFolder:FindFirstChild(key) then
			return true
		end
		return false
	end
})
return VerifiedUsers
