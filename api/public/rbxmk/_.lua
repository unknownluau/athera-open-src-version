local input = "./AssetGoesHereRBXM.rbxm"
local output = "./TheNewAssetHolyCrap.rbxmx"

local file = fs.read(input)
fs.write(output, file, "rbxmx")