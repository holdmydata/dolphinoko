"""
Dolphinoko Blender MCP Addon

This Blender addon creates a socket server to allow Dolphinoko to control Blender through the MCP protocol.
Based on the BlenderMCP project by Siddharth Ahuja (https://github.com/ahujasid/blender-mcp)
"""

import bpy
import socket
import threading
import json
import time
import os
import tempfile
import random
from mathutils import Vector
from bpy.props import BoolProperty, StringProperty, IntProperty

bl_info = {
    "name": "Dolphinoko Blender Integration",
    "author": "Dolphinoko Team",
    "version": (1, 0, 0),
    "blender": (3, 0, 0),
    "location": "View3D > Sidebar > Dolphinoko",
    "description": "Connect Blender to Dolphinoko through MCP",
    "warning": "Experimental",
    "category": "Interface",
}

# Global socket server variables
server_socket = None
server_thread = None
client_socket = None
is_server_running = False
port = 9334
host = 'localhost'

# Debug variables
command_history = []
MAX_HISTORY_ITEMS = 10  # Limit history items to avoid performance issues

# Add a global variable to store the last error
last_error = {
    "timestamp": "",
    "command": "",
    "error": "",
    "details": ""
}

# Add these helper functions at the top of your addon
def get_active_object_safe():
    """Safely get the active object even when context doesn't have one"""
    for obj in bpy.context.selected_objects:
        return obj
    return None

def set_active_object(obj_name):
    """Safely set an object as active"""
    obj = bpy.data.objects.get(obj_name)
    if not obj:
        return False
    
    # Deselect all
    bpy.ops.object.select_all(action='DESELECT')
    
    # Select and make active
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    return True

# Server command handlers
def add_to_command_history(command_type, params, description):
    """Add a command to the history for debugging purposes"""
    global command_history
    
    # Add timestamp to history
    timestamp = time.strftime("%H:%M:%S", time.localtime())
    history_item = {
        "timestamp": timestamp,
        "command": command_type,
        "params": params,
        "description": description
    }
    
    # Add to history and limit size
    command_history.insert(0, history_item)  # Insert at beginning for reverse chronological order
    if len(command_history) > MAX_HISTORY_ITEMS:
        command_history = command_history[:MAX_HISTORY_ITEMS]

def save_error(command_type, error_msg, details=""):
    """Save error information for debugging"""
    global last_error
    
    timestamp = time.strftime("%H:%M:%S", time.localtime())
    last_error = {
        "timestamp": timestamp,
        "command": command_type,
        "error": error_msg,
        "details": details
    }

def clear_command_history():
    """Clear the command history"""
    global command_history, last_error
    command_history = []
    last_error = {
        "timestamp": "",
        "command": "",
        "error": "",
        "details": ""
    }

def handle_get_scene_info(params=None):
    """Get information about the current Blender scene"""
    add_to_command_history("get_scene_info", params, "Retrieving scene info")
    
    scene = bpy.context.scene
    
    # Get basic scene info
    scene_info = {
        "scene_name": scene.name,
        "frame_current": scene.frame_current,
        "frame_start": scene.frame_start,
        "frame_end": scene.frame_end,
        "render_engine": scene.render.engine,
        "dimensions": {
            "width": scene.render.resolution_x,
            "height": scene.render.resolution_y,
            "percentage": scene.render.resolution_percentage
        }
    }
    
    # Get camera info
    if scene.camera:
        scene_info["camera"] = {
            "name": scene.camera.name,
            "location": [scene.camera.location.x, scene.camera.location.y, scene.camera.location.z],
            "rotation": [scene.camera.rotation_euler.x, scene.camera.rotation_euler.y, scene.camera.rotation_euler.z]
        }
    
    # Get object count
    scene_info["object_count"] = len(bpy.data.objects)
    
    # Get material count
    scene_info["material_count"] = len(bpy.data.materials)
    
    return {"status": "success", "result": scene_info}

def handle_get_objects(params=None):
    """Get a list of all objects in the scene"""
    add_to_command_history("get_objects", params, "Retrieving all objects")
    
    objects = []
    
    for obj in bpy.data.objects:
        obj_data = {
            "name": obj.name,
            "type": obj.type,
            "location": [obj.location.x, obj.location.y, obj.location.z],
            "rotation": [obj.rotation_euler.x, obj.rotation_euler.y, obj.rotation_euler.z],
            "scale": [obj.scale.x, obj.scale.y, obj.scale.z],
            "visible": obj.visible_get()
        }
        
        # If object has materials, include them
        if obj.material_slots:
            obj_data["materials"] = [slot.material.name if slot.material else None for slot in obj.material_slots]
        
        objects.append(obj_data)
    
    return {"status": "success", "result": objects}

def handle_get_materials(params=None):
    """Get a list of all materials in the scene"""
    add_to_command_history("get_materials", params, "Retrieving all materials")
    
    materials = []
    
    for mat in bpy.data.materials:
        mat_data = {
            "name": mat.name,
            "used": mat.users > 0
        }
        
        # If material uses nodes, get basic properties
        if mat.use_nodes:
            try:
                principled = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
                if principled:
                    mat_data["color"] = [principled.inputs['Base Color'].default_value[0],
                                       principled.inputs['Base Color'].default_value[1],
                                       principled.inputs['Base Color'].default_value[2]]
                    mat_data["metallic"] = principled.inputs['Metallic'].default_value
                    mat_data["roughness"] = principled.inputs['Roughness'].default_value
            except:
                pass
        
        materials.append(mat_data)
    
    return {"status": "success", "result": materials}

def handle_create_object(params):
    """Create a new object in the scene"""
    add_to_command_history("create_object", params, f"Creating {params.get('object_type', 'CUBE')} object")
    
    # Store parameters for the operator
    bpy.types.Scene.temp_object_params = params
    
    # Use an operator to run in the correct context
    bpy.ops.dolphinoko.create_object()
    
    # Get the result and clear temp data
    result = getattr(bpy.types.Scene, "temp_object_result", {"status": "error", "message": "Operation failed"})
    if hasattr(bpy.types.Scene, "temp_object_result"):
        del bpy.types.Scene.temp_object_result
    
    return result

def handle_delete_object(params):
    """Delete an object from the scene"""
    add_to_command_history("delete_object", params, f"Deleting object: {params.get('name', 'unknown')}")
    
    name = params.get("name")
    
    if not name:
        return {"status": "error", "message": "Object name is required"}
    
    try:
        obj = bpy.data.objects.get(name)
        if not obj:
            return {"status": "error", "message": f"Object '{name}' not found"}
        
        # Delete the object
        bpy.data.objects.remove(obj, do_unlink=True)
        
        return {"status": "success", "result": {"name": name, "deleted": True}}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

def handle_modify_object(params):
    """Modify an existing object in the scene"""
    add_to_command_history("modify_object", params, f"Modifying object: {params.get('name', 'unknown')}")
    
    name = params.get("name")
    location = params.get("location", None)
    size = params.get("size", None)
    rotation = params.get("rotation", None)
    color = params.get("color", None)
    
    if not name:
        return {"status": "error", "message": "Object name is required"}
    
    try:
        obj = bpy.data.objects.get(name)
        if not obj:
            return {"status": "error", "message": f"Object '{name}' not found"}
        
        # Update location if provided
        if location and len(location) >= 3:
            obj.location = (location[0], location[1], location[2])
        
        # Update scale if provided
        if size and len(size) >= 3:
            obj.scale = (size[0], size[1], size[2])
        
        # Update rotation if provided
        if rotation and len(rotation) >= 3:
            obj.rotation_euler = (rotation[0], rotation[1], rotation[2])
        
        # Update color if provided
        if color and len(color) >= 3:
            # Ensure the object has a material
            if len(obj.material_slots) == 0:
                mat = bpy.data.materials.new(name=f"{obj.name}_Mat")
                mat.use_nodes = True
                if obj.data:
                    obj.data.materials.append(mat)
            else:
                mat = obj.material_slots[0].material
                
            # Set color
            if mat and mat.use_nodes:
                if len(color) == 3:
                    color = [color[0], color[1], color[2], 1.0]
                    
                principled = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
                if principled:
                    principled.inputs['Base Color'].default_value = color
        
        return {"status": "success", "result": {"name": obj.name, "modified": True}}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

def handle_create_material(params):
    """Create a new material in Blender"""
    add_to_command_history("create_material", params, f"Creating material: {params.get('name', 'unknown')}")
    
    name = params.get("name")
    color = params.get("color", [0.8, 0.8, 0.8, 1.0])
    metallic = params.get("metallic", 0.0)
    roughness = params.get("roughness", 0.5)
    
    if not name:
        return {"status": "error", "message": "Material name is required"}
    
    try:
        # Create new material
        mat = bpy.data.materials.new(name=name)
        mat.use_nodes = True
        
        # Set properties if using nodes
        if mat.use_nodes:
            principled = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
            if principled:
                # Set color
                if color and len(color) >= 3:
                    if len(color) == 3:
                        color = [color[0], color[1], color[2], 1.0]
                    principled.inputs['Base Color'].default_value = color
                
                # Set metallic
                if metallic is not None:
                    principled.inputs['Metallic'].default_value = metallic
                
                # Set roughness
                if roughness is not None:
                    principled.inputs['Roughness'].default_value = roughness
        
        return {"status": "success", "result": {"name": mat.name, "created": True}}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

def handle_assign_material(params):
    """Assign a material to an object"""
    add_to_command_history("assign_material", params, 
                         f"Assigning material {params.get('material_name', 'unknown')} to {params.get('object_name', 'unknown')}")
    
    object_name = params.get("object_name")
    material_name = params.get("material_name")
    
    if not object_name:
        return {"status": "error", "message": "Object name is required"}
    
    if not material_name:
        return {"status": "error", "message": "Material name is required"}
    
    try:
        # Get the object and material
        obj = bpy.data.objects.get(object_name)
        mat = bpy.data.materials.get(material_name)
        
        if not obj:
            return {"status": "error", "message": f"Object '{object_name}' not found"}
        
        if not mat:
            return {"status": "error", "message": f"Material '{material_name}' not found"}
        
        # Clear existing materials if needed
        if obj.data and hasattr(obj.data, "materials"):
            obj.data.materials.clear()
            
            # Assign the material
            obj.data.materials.append(mat)
            
            return {"status": "success", "result": {"object": object_name, "material": material_name, "assigned": True}}
        else:
            return {"status": "error", "message": f"Object '{object_name}' cannot have materials"}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

def handle_set_camera(params):
    """Set the camera position and parameters"""
    add_to_command_history("set_camera", params, "Setting camera parameters")
    
    location = params.get("location")
    rotation = params.get("rotation")
    target = params.get("target")
    camera_type = params.get("camera_type", "PERSP")
    
    try:
        # Get the active camera or create one if it doesn't exist
        if not bpy.context.scene.camera:
            bpy.ops.object.camera_add()
            cam = bpy.context.active_object
            bpy.context.scene.camera = cam
        else:
            cam = bpy.context.scene.camera
        
        # Set location if provided
        if location and len(location) >= 3:
            cam.location = (location[0], location[1], location[2])
        
        # Set rotation if provided
        if rotation and len(rotation) >= 3:
            cam.rotation_euler = (rotation[0], rotation[1], rotation[2])
        
        # Look at target if provided
        if target:
            target_obj = bpy.data.objects.get(target)
            if target_obj:
                # Create a track to constraint
                constraint = cam.constraints.new(type='TRACK_TO')
                constraint.target = target_obj
                constraint.track_axis = 'TRACK_NEGATIVE_Z'
                constraint.up_axis = 'UP_Y'
        
        # Set camera type
        if camera_type:
            if camera_type.upper() == "PERSP" or camera_type.upper() == "PERSPECTIVE":
                cam.data.type = 'PERSP'
            elif camera_type.upper() == "ORTHO" or camera_type.upper() == "ORTHOGRAPHIC":
                cam.data.type = 'ORTHO'
                cam.data.ortho_scale = 10.0  # Default orthographic scale
            elif camera_type.upper() == "PANO" or camera_type.upper() == "PANORAMIC":
                cam.data.type = 'PANO'
        
        return {"status": "success", "result": {"camera": cam.name, "updated": True}}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

def handle_set_lighting(params):
    """Set the scene lighting"""
    add_to_command_history("set_lighting", params, f"Setting lighting to {params.get('lighting_type', 'default')}")
    
    lighting_type = params.get("lighting_type", "STUDIO")
    intensity = params.get("intensity", 1.0)
    color = params.get("color", [1.0, 1.0, 1.0])
    
    try:
        # Clear existing lights
        for obj in bpy.data.objects:
            if obj.type == 'LIGHT':
                bpy.data.objects.remove(obj, do_unlink=True)
        
        if lighting_type.upper() == "STUDIO":
            # Create a 3-point lighting setup
            # Key light
            bpy.ops.object.light_add(type='AREA', location=(4, -4, 5))
            key_light = bpy.context.active_object
            key_light.name = "Key_Light"
            key_light.data.energy = 100 * intensity
            key_light.data.size = 5
            
            # Fill light
            bpy.ops.object.light_add(type='AREA', location=(-4, -2, 3))
            fill_light = bpy.context.active_object
            fill_light.name = "Fill_Light"
            fill_light.data.energy = 50 * intensity
            fill_light.data.size = 3
            
            # Back light
            bpy.ops.object.light_add(type='AREA', location=(0, 6, 4))
            back_light = bpy.context.active_object
            back_light.name = "Back_Light"
            back_light.data.energy = 75 * intensity
            back_light.data.size = 4
            
        elif lighting_type.upper() == "OUTDOORS" or lighting_type.upper() == "OUTDOOR":
            # Create sun light
            bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))
            sun = bpy.context.active_object
            sun.name = "Sun"
            sun.rotation_euler = (0.5, 0.2, 0.3)
            sun.data.energy = 2 * intensity
            
            # Set world background color to blue for sky
            if bpy.context.scene.world is None:
                bpy.context.scene.world = bpy.data.worlds.new("World")
            bpy.context.scene.world.use_nodes = True
            bg_node = bpy.context.scene.world.node_tree.nodes.get("Background")
            if bg_node:
                bg_node.inputs[0].default_value = (0.5, 0.7, 1.0, 1.0)
                bg_node.inputs[1].default_value = 1.0 * intensity
                
        elif lighting_type.upper() == "NIGHT":
            # Create a moon light
            bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))
            moon = bpy.context.active_object
            moon.name = "Moon"
            moon.rotation_euler = (0.5, 0.2, 0.3)
            moon.data.energy = 0.5 * intensity
            if len(color) >= 3:
                moon.data.color = (color[0], color[1], color[2])
            else:
                moon.data.color = (0.8, 0.8, 1.0)
            
            # Set world background color to dark blue
            if bpy.context.scene.world is None:
                bpy.context.scene.world = bpy.data.worlds.new("World")
            bpy.context.scene.world.use_nodes = True
            bg_node = bpy.context.scene.world.node_tree.nodes.get("Background")
            if bg_node:
                bg_node.inputs[0].default_value = (0.01, 0.01, 0.05, 1.0)
                bg_node.inputs[1].default_value = 1.0
                
            # Add a few small lights for accent
            for i in range(3):
                bpy.ops.object.light_add(type='POINT', 
                                         location=(random.uniform(-5, 5), 
                                                   random.uniform(-5, 5), 
                                                   random.uniform(0.5, 3)))
                point = bpy.context.active_object
                point.name = f"Accent_Light_{i}"
                point.data.energy = random.uniform(5, 15) * intensity
                point.data.color = (random.uniform(0.5, 1.0), 
                                    random.uniform(0.5, 1.0), 
                                    random.uniform(0.5, 1.0))
                
        else:
            # Default to a simple point light
            bpy.ops.object.light_add(type='POINT', location=(0, 0, 5))
            light = bpy.context.active_object
            light.name = "Light"
            light.data.energy = 1000 * intensity
            if len(color) >= 3:
                light.data.color = (color[0], color[1], color[2])
        
        return {"status": "success", "result": {"lighting": lighting_type, "updated": True}}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

def handle_execute_blender_code(params):
    """Execute arbitrary Python code in Blender"""
    code = params.get("code", "")
    
    # Instead of embedding a try-except in the code string, we'll create a simpler code string
    # and handle exceptions in the operator
    simple_code = """
import bpy
# Store context reference for easier access
ctx = bpy.context

# Execute user code
""" + code

    # Truncate code for readability in history
    code_preview = code[:50] + "..." if len(code) > 50 else code
    add_to_command_history("execute_blender_code", params, f"Executing code: {code_preview}")
    
    # Store the code for the operator
    bpy.types.Scene.temp_exec_code = simple_code
    
    # Execute in the correct context
    bpy.ops.dolphinoko.execute_code()
    
    # Get the result
    result = getattr(bpy.types.Scene, "temp_exec_result", {"status": "error", "message": "Code execution failed"})
    if hasattr(bpy.types.Scene, "temp_exec_result"):
        del bpy.types.Scene.temp_exec_result
    
    return result

def handle_natural_language(params):
    """Process natural language commands by converting to Blender code"""
    text = params.get("text", "")
    add_to_command_history("natural_language", params, f"Processing: {text[:50]}...")
    
    try:
        # Basic object creation parsing
        text_lower = text.lower().strip()
        
        # Special case for red sphere in the middle - direct implementation
        if "red" in text_lower and ("sphere" in text_lower or "ball" in text_lower) and ("middle" in text_lower or "center" in text_lower):
            code = """
import bpy

# Create a sphere
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(0, 0, 0))
obj = bpy.context.active_object
obj.name = "RedSphere"

# Add a material
mat = bpy.data.materials.new(name="RedSphere_Mat")
mat.use_nodes = True
if obj.data:
    obj.data.materials.append(mat)

# Set color to red
principled = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
if principled:
    principled.inputs['Base Color'].default_value = (1.0, 0.0, 0.0, 1.0)

result = "Created a red sphere in the middle"
"""
            return handle_execute_blender_code({"code": code})
            
        # For other common shapes
        elif any(x in text_lower for x in ["create", "make", "add"]):
            # Determine shape type
            shape_type = None
            color = None
            location = [0, 0, 0]
            
            # Handle basic shapes
            if "cube" in text_lower:
                shape_type = "cube"
            elif "sphere" in text_lower or "ball" in text_lower:
                shape_type = "sphere"
            elif "cylinder" in text_lower:
                shape_type = "cylinder"
            elif "cone" in text_lower:
                shape_type = "cone"
            elif "plane" in text_lower:
                shape_type = "plane"
                
            # Handle colors
            if "red" in text_lower:
                color = "red"
            elif "green" in text_lower:
                color = "green"
            elif "blue" in text_lower:
                color = "blue"
            elif "yellow" in text_lower:
                color = "yellow"
            elif "white" in text_lower:
                color = "white"
            elif "black" in text_lower:
                color = "black"
                
            # Handle location
            if "middle" in text_lower or "center" in text_lower:
                location = [0, 0, 0]
                
            # Build code based on shape type
            if shape_type == "sphere":
                code = """
import bpy

# Create a sphere
bpy.ops.mesh.primitive_uv_sphere_add(radius=1.0, location=(""" + str(location[0]) + "," + str(location[1]) + "," + str(location[2]) + """))
obj = bpy.context.active_object
"""
            elif shape_type == "cube":
                code = """
import bpy

# Create a cube
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(""" + str(location[0]) + "," + str(location[1]) + "," + str(location[2]) + """))
obj = bpy.context.active_object
"""
            elif shape_type == "cylinder":
                code = """
import bpy

# Create a cylinder
bpy.ops.mesh.primitive_cylinder_add(radius=1.0, depth=2.0, location=(""" + str(location[0]) + "," + str(location[1]) + "," + str(location[2]) + """))
obj = bpy.context.active_object
"""
            elif shape_type == "cone":
                code = """
import bpy

# Create a cone
bpy.ops.mesh.primitive_cone_add(radius1=1.0, depth=2.0, location=(""" + str(location[0]) + "," + str(location[1]) + "," + str(location[2]) + """))
obj = bpy.context.active_object
"""
            elif shape_type == "plane":
                code = """
import bpy

# Create a plane
bpy.ops.mesh.primitive_plane_add(size=2.0, location=(""" + str(location[0]) + "," + str(location[1]) + "," + str(location[2]) + """))
obj = bpy.context.active_object
"""
            else:
                # Default: create a cube
                code = """
import bpy

# Create a default cube
bpy.ops.mesh.primitive_cube_add(size=1.0, location=(0, 0, 0))
obj = bpy.context.active_object
"""
            
            # Add color handling
            if color:
                name = color.capitalize() + shape_type.capitalize() if shape_type else "Object"
                
                # Color values dictionary
                color_values = {
                    "red": "(1.0, 0.0, 0.0, 1.0)",
                    "green": "(0.0, 1.0, 0.0, 1.0)",
                    "blue": "(0.0, 0.0, 1.0, 1.0)",
                    "yellow": "(1.0, 1.0, 0.0, 1.0)",
                    "white": "(1.0, 1.0, 1.0, 1.0)",
                    "black": "(0.0, 0.0, 0.0, 1.0)"
                }
                
                color_value = color_values.get(color, "(0.8, 0.8, 0.8, 1.0)")
                
                code += """
obj.name = \"""" + name + """\"

# Add a material
mat = bpy.data.materials.new(name=\"""" + name + """_Mat\")
mat.use_nodes = True
if obj.data:
    obj.data.materials.append(mat)

# Set color
principled = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
if principled:
    principled.inputs['Base Color'].default_value = """ + color_value + """

result = \"Created a """ + color + " " + (shape_type if shape_type else "object") + " at location " + str(location) + """\"
"""
            else:
                # No color specified
                code += """
obj.name = \"""" + (shape_type.capitalize() if shape_type else "Object") + """\"
result = \"Created a """ + (shape_type if shape_type else "object") + " at location " + str(location) + """\"
"""
            
            return handle_execute_blender_code({"code": code})
            
        # Generic default response
        else:
            code = """
import bpy
result = "I couldn't understand that command. Try saying 'create a red sphere in the middle' or similar."
"""
            return handle_execute_blender_code({"code": code})
            
    except Exception as e:
        return {"status": "error", "message": f"Error processing natural language: {str(e)}"}

def handle_modify_active_object(params):
    """Special handler that selects an object first, then modifies it"""
    object_name = params.get("name")
    code = params.get("code", "")
    
    if not object_name:
        return {"status": "error", "message": "Object name is required"}
    
    # Create code that selects the object first
    selection_code = f"""
import bpy

# Deselect all
bpy.ops.object.select_all(action='DESELECT')

# Get and select the object
obj = bpy.data.objects.get("{object_name}")
if not obj:
    result = f"Object '{object_name}' not found"
else:
    # Select and make active
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    
    # Now run the user code
    {code}
"""
    
    # Store the code for the operator
    bpy.types.Scene.temp_exec_code = selection_code
    
    # Execute in the correct context
    bpy.ops.dolphinoko.execute_code()
    
    # Get the result
    result = getattr(bpy.types.Scene, "temp_exec_result", {"status": "error", "message": "Code execution failed"})
    if hasattr(bpy.types.Scene, "temp_exec_result"):
        del bpy.types.Scene.temp_exec_result
    
    return result

# Command handler mapping
command_handlers = {
    "get_scene_info": handle_get_scene_info,
    "get_objects": handle_get_objects,
    "get_materials": handle_get_materials,
    "create_object": handle_create_object,
    "delete_object": handle_delete_object,
    "modify_object": handle_modify_object,
    "create_material": handle_create_material,
    "assign_material": handle_assign_material,
    "execute_blender_code": handle_execute_blender_code,
    "set_camera": handle_set_camera,
    "set_lighting": handle_set_lighting,
    "modify_active_object": handle_modify_active_object,
    "natural_language": handle_natural_language,
}

# Socket server function
def socket_server_function():
    """Run the socket server to receive commands from Dolphinoko"""
    global server_socket, client_socket, is_server_running
    
    try:
        server_socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        server_socket.bind((host, port))
        server_socket.listen(1)
        
        print(f"[Dolphinoko] Socket server listening on {host}:{port}")
        add_to_command_history("server_start", {}, f"Server started on {host}:{port}")
        is_server_running = True
        
        while is_server_running:
            try:
                # Accept connection
                client_socket, addr = server_socket.accept()
                print(f"[Dolphinoko] Connection from {addr}")
                add_to_command_history("client_connect", {}, f"Client connected from {addr}")
                
                # Handle commands from this client
                while is_server_running:
                    try:
                        # Receive data
                        data = b""
                        while not data.endswith(b"\n"):
                            chunk = client_socket.recv(4096)
                            if not chunk:
                                break
                            data += chunk
                        
                        if not data:
                            break
                        
                        # Parse the command
                        command_str = data.decode('utf-8').strip()
                        command = json.loads(command_str)
                        
                        # Get command type and params
                        command_type = command.get("type")
                        params = command.get("params", {})
                        
                        print(f"[Dolphinoko] Received command: {command_type}")
                        
                        # Handle the command
                        if command_type in command_handlers:
                            response = command_handlers[command_type](params)
                        else:
                            error_msg = f"Unknown command: {command_type}"
                            response = {"status": "error", "message": error_msg}
                            add_to_command_history("unknown_command", {"command": command_type}, error_msg)
                            save_error("unknown_command", error_msg, f"Command type '{command_type}' not found in handlers")
                        
                        # Send response
                        response_str = json.dumps(response) + "\n"
                        client_socket.sendall(response_str.encode('utf-8'))
                        
                        # Log the response
                        status = response.get("status", "unknown")
                        add_to_command_history("response", {"status": status}, f"Response sent: {status}")
                        
                        # Save error if response indicates failure
                        if status == "error" and "message" in response:
                            save_error(command_type, response["message"], f"Command failed: {command_type}")
                        
                    except socket.error as e:
                        error_msg = f"Socket error: {str(e)}"
                        add_to_command_history("socket_error", {}, error_msg)
                        save_error("socket_error", error_msg)
                        break
                    except json.JSONDecodeError as e:
                        error_msg = f"Invalid JSON: {str(e)}"
                        add_to_command_history("json_error", {}, error_msg)
                        save_error("json_error", error_msg, command_str if 'command_str' in locals() else "No data")
                        response = {"status": "error", "message": "Invalid JSON format"}
                        client_socket.sendall((json.dumps(response) + "\n").encode('utf-8'))
                    except Exception as e:
                        error_msg = f"Error: {str(e)}"
                        print(f"[Dolphinoko] Error handling command: {error_msg}")
                        add_to_command_history("command_error", {}, error_msg)
                        save_error(command_type if 'command_type' in locals() else "unknown", error_msg, "")
                        response = {"status": "error", "message": str(e)}
                        try:
                            client_socket.sendall((json.dumps(response) + "\n").encode('utf-8'))
                        except:
                            pass
                
                # Close client connection
                try:
                    client_socket.close()
                    add_to_command_history("client_disconnect", {}, "Client disconnected")
                except:
                    pass
                client_socket = None
                
            except socket.error as e:
                error_msg = f"Socket accept error: {str(e)}"
                save_error("socket_accept", error_msg)
                time.sleep(0.1)
            except Exception as e:
                error_msg = f"Connection error: {str(e)}"
                print(f"[Dolphinoko] Error in connection handling: {error_msg}")
                add_to_command_history("connection_error", {}, error_msg)
                save_error("connection", error_msg)
                time.sleep(0.1)
        
    except Exception as e:
        error_msg = f"Server error: {str(e)}"
        print(f"[Dolphinoko] Error starting server: {error_msg}")
        add_to_command_history("server_error", {}, error_msg)
        save_error("server_start", error_msg)
    finally:
        is_server_running = False
        if client_socket:
            try:
                client_socket.close()
            except:
                pass
        if server_socket:
            try:
                server_socket.close()
            except:
                pass
        print("[Dolphinoko] Socket server stopped")
        add_to_command_history("server_stop", {}, "Server stopped")

# Start the socket server
def start_server():
    """Start the socket server in a new thread"""
    global server_thread, is_server_running
    
    if server_thread and server_thread.is_alive():
        return {"status": "info", "message": "Server is already running"}
    
    server_thread = threading.Thread(target=socket_server_function)
    server_thread.daemon = True
    server_thread.start()
    
    return {"status": "success", "message": f"Server started on {host}:{port}"}

# Stop the socket server
def stop_server():
    """Stop the socket server"""
    global is_server_running, server_thread, server_socket, client_socket
    
    is_server_running = False
    
    # Close client connection
    if client_socket:
        try:
            client_socket.close()
        except:
            pass
    
    # Close server socket
    if server_socket:
        try:
            server_socket.close()
        except:
            pass
    
    # Wait for thread to end
    if server_thread and server_thread.is_alive():
        server_thread.join(2.0)
    
    return {"status": "success", "message": "Server stopped"}

# Blender UI Panels
class DOLPHINOKO_PT_panel(bpy.types.Panel):
    """Dolphinoko Blender Integration Panel"""
    bl_label = "Dolphinoko"
    bl_idname = "DOLPHINOKO_PT_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Dolphinoko'
    
    def draw(self, context):
        layout = self.layout
        scene = context.scene
        
        # Server status
        if is_server_running:
            layout.label(text=f"Server Status: Running on port {port}")
            layout.operator("dolphinoko.stop_server", text="Disconnect", icon='CANCEL')
        else:
            layout.label(text="Server Status: Stopped")
            layout.operator("dolphinoko.start_server", text="Connect to Dolphinoko", icon='PLAY')
        
        # Settings
        box = layout.box()
        box.label(text="Settings")
        box.prop(scene, "dolphinoko_port", text="Port")
        
        # Debug Panel Toggle
        box = layout.box()
        box.prop(scene, "dolphinoko_show_debug", text="Show Debug Panel")

# Debug panel to show command history
class DOLPHINOKO_PT_debug_panel(bpy.types.Panel):
    """Dolphinoko Debug Panel"""
    bl_label = "Dolphinoko Debug"
    bl_idname = "DOLPHINOKO_PT_debug_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Dolphinoko'
    bl_options = {'DEFAULT_CLOSED'}
    
    @classmethod
    def poll(cls, context):
        # Only show debug panel if enabled in settings
        return context.scene.dolphinoko_show_debug
    
    def draw(self, context):
        layout = self.layout
        scene = context.scene
        
        # Connection details
        box = layout.box()
        box.label(text="Connection Info:")
        box.label(text=f"Host: {host}")
        box.label(text=f"Port: {port}")
        box.label(text=f"Status: {'Connected' if is_server_running else 'Disconnected'}")
        if client_socket and is_server_running:
            try:
                box.label(text=f"Client: {client_socket.getpeername()}")
            except:
                box.label(text="Client: Connection lost")
        
        # Error information
        error_box = layout.box()
        error_box.label(text="Last Error:")
        
        if last_error["timestamp"]:
            error_box.label(text=f"Time: {last_error['timestamp']}")
            error_box.label(text=f"Command: {last_error['command']}")
            error_box.label(text=f"Error: {last_error['error']}")
            if last_error["details"]:
                error_box.label(text="Details:")
                # Split details into multiple lines if needed
                if len(last_error["details"]) > 40:
                    parts = [last_error["details"][i:i+40] for i in range(0, len(last_error["details"]), 40)]
                    for part in parts:
                        error_box.label(text=f"  {part}")
                else:
                    error_box.label(text=f"  {last_error['details']}")
        else:
            error_box.label(text="No errors recorded")
        
        # Action buttons
        row = layout.row(align=True)
        row.operator("dolphinoko.clear_history", text="Clear History", icon='TRASH')
        row.operator("dolphinoko.export_logs", text="Export Logs", icon='FILE_TICK')
        
        # Command history
        box = layout.box()
        box.label(text="Command History:")
        
        if not command_history:
            box.label(text="No commands received yet.")
        else:
            for item in command_history:
                row = box.row()
                row.label(text=f"[{item['timestamp']}] {item['command']}")
                subrow = box.row()
                subrow.label(text=f"    {item['description']}")
                box.separator(factor=0.5)

# Test command operator
class DOLPHINOKO_OT_test_command(bpy.types.Operator):
    """Execute a test command manually"""
    bl_idname = "dolphinoko.test_command"
    bl_label = "Test Command"
    
    command_type: bpy.props.StringProperty(
        name="Command Type",
        default="get_scene_info",
        description="Type of command to execute"
    )
    
    params_json: bpy.props.StringProperty(
        name="Parameters (JSON)",
        default="{}",
        description="JSON string of parameters for the command"
    )
    
    def execute(self, context):
        try:
            # Parse parameters
            params = json.loads(self.params_json)
            
            # Execute command if it exists
            if self.command_type in command_handlers:
                result = command_handlers[self.command_type](params)
                
                # Display result in info region
                self.report({'INFO'}, f"Command executed. Result: {result.get('status', 'unknown')}")
                
                # Also save in the scene property to display in the UI
                context.scene.dolphinoko_last_result = json.dumps(result, indent=2)
            else:
                self.report({'ERROR'}, f"Command type '{self.command_type}' not found")
                context.scene.dolphinoko_last_result = f"Error: Command type '{self.command_type}' not found"
            
            return {'FINISHED'}
        except json.JSONDecodeError:
            self.report({'ERROR'}, "Invalid JSON format for parameters")
            context.scene.dolphinoko_last_result = "Error: Invalid JSON format for parameters"
            return {'CANCELLED'}
        except Exception as e:
            self.report({'ERROR'}, f"Error executing command: {str(e)}")
            context.scene.dolphinoko_last_result = f"Error: {str(e)}"
            return {'CANCELLED'}

# Test commands panel
class DOLPHINOKO_PT_test_panel(bpy.types.Panel):
    """Dolphinoko Test Commands Panel"""
    bl_label = "Test Commands"
    bl_idname = "DOLPHINOKO_PT_test_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = 'Dolphinoko'
    bl_options = {'DEFAULT_CLOSED'}
    bl_parent_id = "DOLPHINOKO_PT_debug_panel"
    
    @classmethod
    def poll(cls, context):
        # Only show test panel if debug panel is enabled
        return context.scene.dolphinoko_show_debug
    
    def draw(self, context):
        layout = self.layout
        scene = context.scene
        
        # Command input
        box = layout.box()
        box.label(text="Test Command:")
        
        # Available commands dropdown
        box.prop(scene, "dolphinoko_test_command", text="Command")
        
        # Parameters input
        box.label(text="Parameters (JSON):")
        box.prop(scene, "dolphinoko_test_params", text="")
        
        # Execute button
        op = box.operator("dolphinoko.test_command", text="Execute Command", icon='PLAY')
        op.command_type = scene.dolphinoko_test_command
        op.params_json = scene.dolphinoko_test_params
        
        # Natural language test section
        nl_box = layout.box()
        nl_box.label(text="Natural Language Test:")
        nl_box.prop(scene, "dolphinoko_nl_text", text="")
        nl_box.operator("dolphinoko.test_nl", text="Execute Natural Language", icon='PLAY')
        
        # Result display
        box = layout.box()
        box.label(text="Result:")
        
        if scene.dolphinoko_last_result:
            # Split the result into multiple lines for display
            result_lines = scene.dolphinoko_last_result.split('\n')
            for line in result_lines:
                box.label(text=line)
        else:
            box.label(text="No result yet")

# Natural language test operator
class DOLPHINOKO_OT_test_nl(bpy.types.Operator):
    """Execute a natural language command"""
    bl_idname = "dolphinoko.test_nl"
    bl_label = "Test Natural Language"
    
    def execute(self, context):
        text = context.scene.dolphinoko_nl_text
        if not text:
            self.report({'ERROR'}, "Please enter a natural language command")
            return {'CANCELLED'}
        
        try:
            # Execute the natural language command
            result = handle_natural_language({"text": text})
            
            # Display result in info region
            self.report({'INFO'}, f"Command executed. Result: {result.get('status', 'unknown')}")
            
            # Also save in the scene property to display in the UI
            context.scene.dolphinoko_last_result = json.dumps(result, indent=2)
            
            return {'FINISHED'}
        except Exception as e:
            self.report({'ERROR'}, f"Error executing command: {str(e)}")
            context.scene.dolphinoko_last_result = f"Error: {str(e)}"
            return {'CANCELLED'}

# Clear history operator
class DOLPHINOKO_OT_clear_history(bpy.types.Operator):
    """Clear the command history"""
    bl_idname = "dolphinoko.clear_history"
    bl_label = "Clear Command History"
    
    def execute(self, context):
        clear_command_history()
        self.report({'INFO'}, "Command history cleared")
        return {'FINISHED'}

# Server operators
class DOLPHINOKO_OT_start_server(bpy.types.Operator):
    """Start the Dolphinoko connection server"""
    bl_idname = "dolphinoko.start_server"
    bl_label = "Start Server"
    
    def execute(self, context):
        global port
        # Get port from scene settings
        port = context.scene.dolphinoko_port
        # Start the server
        result = start_server()
        self.report({'INFO'}, result["message"])
        return {'FINISHED'}

class DOLPHINOKO_OT_stop_server(bpy.types.Operator):
    """Stop the Dolphinoko connection server"""
    bl_idname = "dolphinoko.stop_server"
    bl_label = "Stop Server"
    
    def execute(self, context):
        result = stop_server()
        self.report({'INFO'}, result["message"])
        return {'FINISHED'}

# Define an operator to run in the correct context
class DOLPHINOKO_OT_create_object(bpy.types.Operator):
    bl_idname = "dolphinoko.create_object"
    bl_label = "Create Object"
    
    def execute(self, context):
        params = getattr(bpy.types.Scene, "temp_object_params", {})
        
        # Extract parameters
        object_type = params.get("object_type", "CUBE").upper()
        name = params.get("name", None)
        location = params.get("location", [0, 0, 0])
        size = params.get("size", [1, 1, 1])
        color = params.get("color", [0.8, 0.8, 0.8, 1.0])
        
        try:
            # Create the object based on type
            if object_type == "CUBE":
                bpy.ops.mesh.primitive_cube_add(size=1, location=location)
                obj = context.active_object
                if len(size) >= 3:
                    obj.scale = (size[0], size[1], size[2])
                    
            elif object_type == "SPHERE":
                radius = size[0] / 2 if len(size) > 0 else 0.5
                bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, location=location)
                obj = context.active_object
                
            elif object_type == "CYLINDER":
                radius = size[0] / 2 if len(size) > 0 else 0.5
                depth = size[2] if len(size) > 2 else 1
                bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, location=location)
                obj = context.active_object
                
            elif object_type == "PLANE":
                bpy.ops.mesh.primitive_plane_add(size=1, location=location)
                obj = context.active_object
                if len(size) >= 2:
                    obj.scale = (size[0], size[1], 1)
                    
            elif object_type == "EMPTY":
                obj = bpy.data.objects.new(name or "Empty", None)
                obj.location = location
                context.collection.objects.link(obj)
                
            else:
                bpy.types.Scene.temp_object_result = {"status": "error", "message": f"Unsupported object type: {object_type}"}
                return {'CANCELLED'}
            
            # Set name if provided
            if name:
                obj.name = name
            
            # Create and assign a material
            mat = bpy.data.materials.new(name=f"{obj.name}_Mat")
            mat.use_nodes = True
            
            # Set material color if provided
            if color and len(color) >= 3:
                if len(color) == 3:
                    color = [color[0], color[1], color[2], 1.0]
                    
                principled = next((n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
                if principled:
                    principled.inputs['Base Color'].default_value = color
            
            # Assign material to object
            if obj.data:
                obj.data.materials.append(mat)
            
            bpy.types.Scene.temp_object_result = {"status": "success", "result": {"name": obj.name, "type": object_type}}
            
        except Exception as e:
            bpy.types.Scene.temp_object_result = {"status": "error", "message": str(e)}
            return {'CANCELLED'}
            
        return {'FINISHED'}

# Operator for executing code
class DOLPHINOKO_OT_execute_code(bpy.types.Operator):
    bl_idname = "dolphinoko.execute_code"
    bl_label = "Execute Code"
    
    def execute(self, context):
        code = getattr(bpy.types.Scene, "temp_exec_code", "")
        try:
            # Create a modified globals dictionary that includes the context
            globals_dict = globals().copy()
            globals_dict["C"] = context  # Add context as C
            
            # Create a locals dict to capture output
            locals_dict = {"result": None, "context": context}
            
            # Execute with the right context
            exec(code, globals_dict, locals_dict)
            bpy.types.Scene.temp_exec_result = {"status": "success", "result": str(locals_dict.get("result", "Code executed"))}
        except Exception as e:
            bpy.types.Scene.temp_exec_result = {"status": "error", "message": str(e)}
        return {'FINISHED'}

def execute_in_main_thread(callback):
    """Schedule a function to be executed in the main thread"""
    bpy.app.timers.register(callback, first_interval=0.01)

# Export logs operator
class DOLPHINOKO_OT_export_logs(bpy.types.Operator):
    """Export debug logs to a file"""
    bl_idname = "dolphinoko.export_logs"
    bl_label = "Export Debug Logs"
    
    filename: bpy.props.StringProperty(
        name="Filename",
        default="dolphinoko_debug.json",
        description="Name of the file to export logs to"
    )
    
    def execute(self, context):
        try:
            # Create log data
            log_data = {
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S", time.localtime()),
                "connection": {
                    "host": host,
                    "port": port,
                    "is_running": is_server_running
                },
                "last_error": last_error,
                "history": command_history
            }
            
            # Get path in blender temp directory
            temp_dir = tempfile.gettempdir()
            file_path = os.path.join(temp_dir, self.filename)
            
            # Write to file
            with open(file_path, 'w') as f:
                json.dump(log_data, f, indent=2)
            
            self.report({'INFO'}, f"Debug logs exported to: {file_path}")
            return {'FINISHED'}
        except Exception as e:
            self.report({'ERROR'}, f"Failed to export logs: {str(e)}")
            return {'CANCELLED'}

# Register/unregister functions
def register():
    # Register properties
    bpy.types.Scene.dolphinoko_port = bpy.props.IntProperty(
        name="Port",
        description="Port for the Dolphinoko connection server",
        default=9334,
        min=1024,
        max=65535
    )
    
    # Debug panel toggle
    bpy.types.Scene.dolphinoko_show_debug = bpy.props.BoolProperty(
        name="Show Debug Info",
        description="Toggle visibility of the debug panel",
        default=False
    )
    
    # Test command properties
    bpy.types.Scene.dolphinoko_test_command = bpy.props.EnumProperty(
        name="Test Command",
        description="Command to test",
        items=[
            ("get_scene_info", "Get Scene Info", "Get information about the current scene"),
            ("get_objects", "Get Objects", "Get a list of all objects in the scene"),
            ("get_materials", "Get Materials", "Get a list of all materials in the scene"),
            ("create_object", "Create Object", "Create a new object (requires parameters)"),
            ("execute_blender_code", "Execute Code", "Execute arbitrary Python code"),
            ("natural_language", "Natural Language", "Process natural language commands")
        ],
        default="get_scene_info"
    )
    
    bpy.types.Scene.dolphinoko_test_params = bpy.props.StringProperty(
        name="Test Parameters",
        description="JSON parameters for the test command",
        default="{}"
    )
    
    # Natural language test property
    bpy.types.Scene.dolphinoko_nl_text = bpy.props.StringProperty(
        name="Natural Language Command",
        description="Enter a natural language command to execute",
        default=""
    )
    
    bpy.types.Scene.dolphinoko_last_result = bpy.props.StringProperty(
        name="Last Result",
        description="Result of the last test command",
        default=""
    )
    
    # Register classes
    bpy.utils.register_class(DOLPHINOKO_PT_panel)
    bpy.utils.register_class(DOLPHINOKO_OT_start_server)
    bpy.utils.register_class(DOLPHINOKO_OT_stop_server)
    bpy.utils.register_class(DOLPHINOKO_OT_create_object)
    bpy.utils.register_class(DOLPHINOKO_OT_execute_code)
    bpy.utils.register_class(DOLPHINOKO_PT_debug_panel)
    bpy.utils.register_class(DOLPHINOKO_OT_clear_history)
    bpy.utils.register_class(DOLPHINOKO_OT_export_logs)
    bpy.utils.register_class(DOLPHINOKO_OT_test_command)
    bpy.utils.register_class(DOLPHINOKO_OT_test_nl)
    bpy.utils.register_class(DOLPHINOKO_PT_test_panel)
    
    print("[Dolphinoko] Addon registered")

def unregister():
    # Stop server if running
    if is_server_running:
        stop_server()
    
    # Unregister classes
    bpy.utils.unregister_class(DOLPHINOKO_OT_stop_server)
    bpy.utils.unregister_class(DOLPHINOKO_OT_start_server)
    bpy.utils.unregister_class(DOLPHINOKO_PT_panel)
    bpy.utils.unregister_class(DOLPHINOKO_OT_create_object)
    bpy.utils.unregister_class(DOLPHINOKO_OT_execute_code)
    bpy.utils.unregister_class(DOLPHINOKO_PT_debug_panel)
    bpy.utils.unregister_class(DOLPHINOKO_OT_clear_history)
    bpy.utils.unregister_class(DOLPHINOKO_OT_export_logs)
    bpy.utils.unregister_class(DOLPHINOKO_OT_test_command)
    bpy.utils.unregister_class(DOLPHINOKO_OT_test_nl)
    bpy.utils.unregister_class(DOLPHINOKO_PT_test_panel)
    
    # Unregister properties
    del bpy.types.Scene.dolphinoko_port
    del bpy.types.Scene.dolphinoko_show_debug
    del bpy.types.Scene.dolphinoko_test_command
    del bpy.types.Scene.dolphinoko_test_params
    del bpy.types.Scene.dolphinoko_nl_text
    del bpy.types.Scene.dolphinoko_last_result
    
    print("[Dolphinoko] Addon unregistered")

if __name__ == "__main__":
    register() 