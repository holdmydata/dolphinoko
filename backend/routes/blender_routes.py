"""
Blender MCP Routes - API endpoints for interacting with Blender
"""
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import logging
import json
import traceback
from services.blender_mcp_service import BlenderMCPService

# Set up logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/blender", tags=["blender"])

# Initialize Blender MCP service (singleton)
blender_service = BlenderMCPService()

# Models
class ObjectCreate(BaseModel):
    object_type: str
    name: Optional[str] = None
    location: Optional[List[float]] = None
    size: Optional[List[float]] = None
    color: Optional[List[float]] = None

class ObjectModify(BaseModel):
    name: str
    location: Optional[List[float]] = None
    size: Optional[List[float]] = None
    rotation: Optional[List[float]] = None
    color: Optional[List[float]] = None

class MaterialCreate(BaseModel):
    name: str
    color: Optional[List[float]] = None
    metallic: Optional[float] = None
    roughness: Optional[float] = None

class MaterialAssign(BaseModel):
    object_name: str
    material_name: str

class CodeExecute(BaseModel):
    code: str

class PolyHavenAsset(BaseModel):
    asset_type: str  # "model", "texture", or "hdri"
    search_query: str

class Hyper3DModel(BaseModel):
    prompt: str

class CameraSettings(BaseModel):
    location: Optional[List[float]] = None
    rotation: Optional[List[float]] = None
    target: Optional[str] = None  # Object to point at
    camera_type: Optional[str] = None  # e.g., "PERSP", "ORTHO"

class LightingSettings(BaseModel):
    lighting_type: str  # e.g., "STUDIO", "OUTDOORS", "NIGHT"
    intensity: Optional[float] = None
    color: Optional[List[float]] = None

# Connection endpoints
@router.get("/connect")
async def connect_to_blender():
    """Connect to the Blender addon"""
    logger.info("Attempting to connect to Blender")
    result = blender_service.connect()
    if result:
        return {"status": "success", "message": "Connected to Blender"}
    else:
        return {"status": "error", "message": "Failed to connect to Blender"}

@router.get("/disconnect")
async def disconnect_from_blender():
    """Disconnect from the Blender addon"""
    logger.info("Disconnecting from Blender")
    result = blender_service.disconnect()
    if result:
        return {"status": "success", "message": "Disconnected from Blender"}
    else:
        return {"status": "error", "message": "Failed to disconnect from Blender"}

@router.get("/status")
async def get_connection_status():
    """Get the current connection status"""
    return {"connected": blender_service.connected}

# Scene endpoints
@router.get("/scene")
async def get_scene_info():
    """Get information about the current Blender scene"""
    logger.info("Getting scene info from Blender")
    result = blender_service.get_scene_info()
    return result

@router.get("/objects")
async def get_objects():
    """Get a list of all objects in the scene"""
    logger.info("Getting objects from Blender")
    result = blender_service.get_objects()
    return result

@router.get("/materials")
async def get_materials():
    """Get a list of all materials in the scene"""
    logger.info("Getting materials from Blender")
    result = blender_service.get_materials()
    return result

# Object endpoints
@router.post("/objects")
async def create_object(object_data: ObjectCreate):
    """Create a new object in the Blender scene"""
    logger.info(f"Creating object of type {object_data.object_type}")
    result = blender_service.create_object(
        object_type=object_data.object_type,
        name=object_data.name,
        location=object_data.location,
        size=object_data.size,
        color=object_data.color
    )
    return result

@router.delete("/objects/{name}")
async def delete_object(name: str):
    """Delete an object from the Blender scene"""
    logger.info(f"Deleting object {name}")
    result = blender_service.delete_object(name=name)
    return result

@router.put("/objects/{name}")
async def modify_object(name: str, object_data: ObjectModify):
    """Modify an existing object in the Blender scene"""
    logger.info(f"Modifying object {name}")
    result = blender_service.modify_object(
        name=name,
        location=object_data.location,
        size=object_data.size,
        rotation=object_data.rotation,
        color=object_data.color
    )
    return result

# Material endpoints
@router.post("/materials")
async def create_material(material_data: MaterialCreate):
    """Create a new material in Blender"""
    logger.info(f"Creating material {material_data.name}")
    result = blender_service.create_material(
        name=material_data.name,
        color=material_data.color,
        metallic=material_data.metallic,
        roughness=material_data.roughness
    )
    return result

@router.post("/materials/assign")
async def assign_material(assign_data: MaterialAssign):
    """Assign a material to an object"""
    logger.info(f"Assigning material {assign_data.material_name} to {assign_data.object_name}")
    result = blender_service.assign_material(
        object_name=assign_data.object_name,
        material_name=assign_data.material_name
    )
    return result

# Code execution endpoint
@router.post("/execute")
async def execute_blender_code(code_data: CodeExecute):
    """Execute arbitrary Python code in Blender"""
    logger.info("Executing Python code in Blender")
    result = blender_service.execute_code(code=code_data.code)
    return result

# Asset endpoints
@router.post("/assets/polyhaven")
async def import_poly_haven_asset(asset_data: PolyHavenAsset):
    """Import an asset from Poly Haven"""
    logger.info(f"Importing Poly Haven {asset_data.asset_type}: {asset_data.search_query}")
    result = blender_service.poly_haven_asset(
        asset_type=asset_data.asset_type,
        search_query=asset_data.search_query
    )
    return result

@router.post("/assets/hyper3d")
async def generate_hyper3d_model(model_data: Hyper3DModel):
    """Generate a 3D model using Hyper3D Rodin"""
    logger.info(f"Generating Hyper3D model with prompt: {model_data.prompt}")
    result = blender_service.hyper3d_model(prompt=model_data.prompt)
    return result

# Camera endpoint
@router.post("/camera")
async def set_camera(camera_data: CameraSettings):
    """Set the camera position and parameters"""
    logger.info("Setting camera parameters")
    result = blender_service.set_camera(
        location=camera_data.location,
        rotation=camera_data.rotation,
        target=camera_data.target,
        camera_type=camera_data.camera_type
    )
    return result

# Lighting endpoint
@router.post("/lighting")
async def set_lighting(lighting_data: LightingSettings):
    """Set the scene lighting"""
    logger.info(f"Setting lighting to {lighting_data.lighting_type}")
    result = blender_service.set_scene_lighting(
        lighting_type=lighting_data.lighting_type,
        intensity=lighting_data.intensity,
        color=lighting_data.color
    )
    return result

# MCP direct protocol endpoint - allows passing raw MCP commands
@router.post("/command")
async def send_command(request: Request):
    """Send a raw command to the Blender MCP"""
    try:
        data = await request.json()
        command_type = data.get("type")
        params = data.get("params")
        
        if not command_type:
            return JSONResponse(
                status_code=400,
                content={"status": "error", "message": "Command type is required"}
            )
        
        logger.info(f"Sending raw command to Blender: {command_type}")
        result = blender_service.send_command(command_type=command_type, params=params)
        return result
    except Exception as e:
        logger.error(f"Error sending command to Blender: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "error", "message": str(e)}
        )

# Test endpoints for diagnostics
@router.get("/test")
async def blender_test():
    """Test endpoint to verify the Blender router is working"""
    logger.info("Blender test endpoint accessed")
    return {
        "status": "success", 
        "message": "Blender router is working correctly"
    }

@router.get("/socket_test")
async def test_blender_socket():
    """Test direct socket connection to Blender"""
    import socket
    
    logger.info("Testing direct socket connection to Blender")
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(1)  # 1 second timeout
    
    try:
        # Try to connect to the Blender addon socket
        sock.connect(("localhost", 9334))
        sock.close()
        logger.info("Successfully connected to Blender socket")
        return {
            "status": "success",
            "connected": True,
            "message": "Direct socket connection to Blender successful"
        }
    except Exception as e:
        logger.warning(f"Failed to connect to Blender socket: {str(e)}")
        return {
            "status": "error",
            "connected": False,
            "message": f"Failed to connect to Blender socket: {str(e)}"
        }
    finally:
        try:
            sock.close()
        except:
            pass 