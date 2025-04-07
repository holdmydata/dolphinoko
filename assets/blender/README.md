# Dolphinoko Blender Integration

This integration allows Dolphinoko to connect to Blender, enabling AI-assisted 3D modeling, scene creation, and manipulation directly within Blender.

## Features

* **AI-Assisted 3D Creation**: Ask the AI to create and modify 3D objects in Blender
* **Object Manipulation**: Create, modify, and delete objects
* **Material Creation**: Create and modify materials with AI assistance
* **Scene Control**: Change lighting, camera angles, and more
* **Code Execution**: Run arbitrary Python code in Blender for advanced operations

## Installation

### Step 1: Install the Blender Addon

1. Download the `addon.py` file from this directory
2. Open Blender
3. Go to Edit > Preferences > Add-ons
4. Click "Install..." and select the `addon.py` file
5. Enable the addon by checking the box next to "Interface: Dolphinoko Blender Integration"

### Step 2: Connect to Dolphinoko

1. In Blender, go to the 3D View sidebar (press N if not visible)
2. Find the "Dolphinoko" tab
3. Make sure the port is set to 9334 (this should be the default)
4. Click "Connect to Dolphinoko"
5. You should see "Server Status: Running on port 9334"

### Step 3: Use Dolphinoko with Blender

There are two ways to use the Blender integration:

#### Option 1: Through the Dolphinoko UI
1. Navigate to the Dolphinoko web interface
2. Go to Dashboard > Tools > Blender Integration
3. Click "Connect to Blender"
4. Once connected, you can send commands directly through the Blender tool interface

#### Option 2: Through Chat
1. Start a conversation with the AI
2. Make sure you're using a model that supports Blender commands
3. Ask the AI to perform actions in Blender, such as:
   - "Create a cube in Blender"
   - "Make the cube red and metallic"
   - "Add a sphere above the cube"

## Troubleshooting

* **Connection Issues**: Make sure the Blender addon is installed and the server is running on port 9334.
* **Command Failures**: Check the Blender System Console (Window > Toggle System Console) for error messages.
* **Addon Not Found**: Verify that the addon is enabled in Blender preferences.
* **Port Conflict**: If port 9334 is in use, you can change it in Blender settings, but make sure you update the Dolphinoko backend settings as well.

## Example Commands

Here are some examples of what you can ask Dolphinoko to do in Blender:

* "Create a low-poly mountain scene in Blender"
* "Add a red metallic sphere to the scene"
* "Position the camera to view the entire scene"
* "Apply studio lighting to the scene"
* "Generate a 3D model of a castle"
* "Make the cube twice as large and rotate it 45 degrees"

## Security Note

The execution of arbitrary Python code in Blender can potentially be dangerous. Only use this integration with trusted sources and never run code you don't understand. Always save your work before executing AI-generated code.

## Support

If you encounter any issues with the Blender integration, please report them on our GitHub repository. 