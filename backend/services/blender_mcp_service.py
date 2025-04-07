"""
Blender MCP Service - Interface for communicating with the Blender addon through MCP
"""
import logging
import socket
import json
import os
import threading
import time
from typing import Dict, Any, Optional, List, Union

# Set up logging
logger = logging.getLogger(__name__)

class BlenderMCPService:
    """Service for handling communication with the Blender addon"""
    
    def __init__(self, host="localhost", port=9334):
        """Initialize the Blender MCP service"""
        self.host = host
        self.port = port
        self.socket = None
        self.connected = False
        
    def connect(self) -> bool:
        """Connect to the Blender addon socket server"""
        try:
            self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.socket.connect((self.host, self.port))
            self.connected = True
            logger.info(f"Connected to Blender MCP server at {self.host}:{self.port}")
            return True
        except Exception as e:
            logger.error(f"Failed to connect to Blender MCP server: {str(e)}")
            self.connected = False
            return False
    
    def disconnect(self) -> bool:
        """Disconnect from the Blender addon socket server"""
        if self.socket:
            try:
                self.socket.close()
                self.connected = False
                logger.info("Disconnected from Blender MCP server")
                return True
            except Exception as e:
                logger.error(f"Error disconnecting from Blender MCP server: {str(e)}")
                return False
        return True
    
    def send_command(self, command_type: str, params: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Send a command to the Blender addon and get the response"""
        if not self.connected:
            if not self.connect():
                return {"status": "error", "message": "Not connected to Blender"}
        
        try:
            # Create command JSON
            command = {
                "type": command_type
            }
            if params:
                command["params"] = params
            
            # Send command
            command_str = json.dumps(command) + "\n"
            self.socket.sendall(command_str.encode('utf-8'))
            
            # Receive response
            response_data = b""
            while True:
                chunk = self.socket.recv(4096)
                if not chunk:
                    break
                response_data += chunk
                if b"\n" in chunk:
                    break
            
            response_str = response_data.decode('utf-8').strip()
            response = json.loads(response_str)
            
            return response
        except Exception as e:
            logger.error(f"Error sending command to Blender MCP server: {str(e)}")
            self.connected = False
            return {"status": "error", "message": str(e)}
    
    # Blender MCP specific commands
    
    def get_scene_info(self) -> Dict[str, Any]:
        """Get information about the current Blender scene"""
        return self.send_command("get_scene_info")
    
    def create_object(self, object_type: str, name: Optional[str] = None, location: Optional[List[float]] = None,
                     size: Optional[List[float]] = None, color: Optional[List[float]] = None) -> Dict[str, Any]:
        """Create a new object in the Blender scene"""
        params = {"object_type": object_type}
        if name:
            params["name"] = name
        if location:
            params["location"] = location
        if size:
            params["size"] = size
        if color:
            params["color"] = color
        
        return self.send_command("create_object", params)
    
    def delete_object(self, name: str) -> Dict[str, Any]:
        """Delete an object from the Blender scene"""
        return self.send_command("delete_object", {"name": name})
    
    def modify_object(self, name: str, location: Optional[List[float]] = None,
                     size: Optional[List[float]] = None, rotation: Optional[List[float]] = None,
                     color: Optional[List[float]] = None) -> Dict[str, Any]:
        """Modify an existing object in the Blender scene"""
        params = {"name": name}
        if location:
            params["location"] = location
        if size:
            params["size"] = size
        if rotation:
            params["rotation"] = rotation
        if color:
            params["color"] = color
        
        return self.send_command("modify_object", params)
    
    def create_material(self, name: str, color: Optional[List[float]] = None,
                       metallic: Optional[float] = None, roughness: Optional[float] = None) -> Dict[str, Any]:
        """Create a new material in Blender"""
        params = {"name": name}
        if color:
            params["color"] = color
        if metallic is not None:
            params["metallic"] = metallic
        if roughness is not None:
            params["roughness"] = roughness
        
        return self.send_command("create_material", params)
    
    def assign_material(self, object_name: str, material_name: str) -> Dict[str, Any]:
        """Assign a material to an object"""
        return self.send_command("assign_material", {"object_name": object_name, "material_name": material_name})
    
    def execute_code(self, code: str) -> Dict[str, Any]:
        """Execute arbitrary Python code in Blender"""
        return self.send_command("execute_blender_code", {"code": code})
    
    def get_objects(self) -> Dict[str, Any]:
        """Get a list of all objects in the scene"""
        return self.send_command("get_objects")
    
    def get_materials(self) -> Dict[str, Any]:
        """Get a list of all materials in the scene"""
        return self.send_command("get_materials")
    
    def poly_haven_asset(self, asset_type: str, search_query: str) -> Dict[str, Any]:
        """Import an asset from Poly Haven"""
        return self.send_command("poly_haven", {"asset_type": asset_type, "search_query": search_query})
    
    def hyper3d_model(self, prompt: str) -> Dict[str, Any]:
        """Generate a 3D model using Hyper3D Rodin"""
        return self.send_command("hyper3d", {"prompt": prompt})
    
    def set_camera(self, location: Optional[List[float]] = None, rotation: Optional[List[float]] = None,
                  target: Optional[str] = None, camera_type: Optional[str] = None) -> Dict[str, Any]:
        """Set the camera position and parameters"""
        params = {}
        if location:
            params["location"] = location
        if rotation:
            params["rotation"] = rotation
        if target:
            params["target"] = target
        if camera_type:
            params["camera_type"] = camera_type
        
        return self.send_command("set_camera", params)
    
    def set_scene_lighting(self, lighting_type: str, intensity: Optional[float] = None,
                          color: Optional[List[float]] = None) -> Dict[str, Any]:
        """Set the scene lighting"""
        params = {"lighting_type": lighting_type}
        if intensity is not None:
            params["intensity"] = intensity
        if color:
            params["color"] = color
        
        return self.send_command("set_lighting", params) 