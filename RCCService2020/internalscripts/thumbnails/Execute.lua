
local Players = game:GetService("Players")

local player = Players:FindFirstChild("lx")
if not player then
    return
end

local gui = Instance.new("ScreenGui")
gui.Name = "ServerExecutor"
gui.ResetOnSpawn = false

local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 600, 0, 400)
frame.Position = UDim2.new(0.5, -300, 0.5, -200)
frame.Parent = gui

local box = Instance.new("TextBox")
box.Size = UDim2.new(1, -20, 1, -60)
box.Position = UDim2.new(0, 10, 0, 10)
box.ClearTextOnFocus = false
box.MultiLine = true
box.TextXAlignment = Enum.TextXAlignment.Left
box.TextYAlignment = Enum.TextYAlignment.Top
box.Text = "-- type lua here"
box.Parent = frame

local button = Instance.new("TextButton")
button.Size = UDim2.new(1, -20, 0, 40)
button.Position = UDim2.new(0, 10, 1, -50)
button.Text = "Execute"
button.Parent = frame

gui.Parent = player:WaitForChild("PlayerGui")

button.MouseButton1Click:Connect(function()
    local source = box.Text

    local f, err = loadstring(source)
    if not f then
        warn(err)
        return
    end

    local ok, result = pcall(f)
    if not ok then
        warn(result)
    else
        print(result)
    end
end)
