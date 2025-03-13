#!/usr/bin/env python3
"""
Build script for Dolphin MCP Toolbox
"""
import os
import subprocess
import sys

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def build_frontend():
    """Build the frontend"""
    print("Building frontend...")
    frontend_dir = os.path.join(ROOT_DIR, "frontend")
    
    # Run npm install if node_modules doesn't exist
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        subprocess.run(["npm", "install"], cwd=frontend_dir, check=True)
    
    # Build the frontend
    subprocess.run(["npm", "run", "build"], cwd=frontend_dir, check=True)
    
    print("Frontend build complete!")

def main():
    """Main build function"""
    try:
        build_frontend()
        print("Build completed successfully!")
        return 0
    except Exception as e:
        print(f"Build failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
