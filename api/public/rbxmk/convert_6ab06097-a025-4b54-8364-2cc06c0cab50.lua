
			local input = './6ab06097-a025-4b54-8364-2cc06c0cab50.rbxm'
			local output = './6ab06097-a025-4b54-8364-2cc06c0cab50.rbxmx'
			local file = fs.read(input)
			fs.write(output, file, 'rbxmx')
		