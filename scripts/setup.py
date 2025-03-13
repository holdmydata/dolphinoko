#!/usr/bin/env python3
"""
Setup script for Dolphin MCP Toolbox
Creates the project structure and basic files
"""

import os
import shutil
import subprocess
import sys
from pathlib import Path

# Project root directory
ROOT_DIR = Path(__file__).resolve().parent

def create_directory(path):
    """Create directory if it doesn't exist"""
    if not os.path.exists(path):
        os.makedirs(path)
        print(f"Created directory: {path}")

def create_file(path, content=""):
    """Create file with optional content"""
    with open(path, 'w') as f:
        f.write(content)
    print(f"Created file: {path}")

def create_backend_structure():
    """Create the backend directory structure"""
    print("\n=== Setting up Backend Structure ===")
    
    # Create main directories
    backend_dir = os.path.join(ROOT_DIR, "backend")
    create_directory(backend_dir)
    
    # Create backend subdirectories
    subdirs = [
        "models",
        "routes",
        "services",
        "utils",
    ]
    
    for subdir in subdirs:
        create_directory(os.path.join(backend_dir, subdir))
    
    # Create __init__.py files
    for subdir in ["", "models", "routes", "services", "utils"]:
        init_path = os.path.join(backend_dir, subdir, "__init__.py")
        create_file(init_path)
    
    # Create basic config file
    config_content = '''"""
Configuration settings for the application
"""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# API settings
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))
API_RELOAD = os.getenv("API_RELOAD", "True").lower() in ("true", "1", "t")

# CORS settings
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
'''
    create_file(os.path.join(backend_dir, "config.py"), config_content)

def create_frontend_structure():
    """Create the frontend directory structure"""
    print("\n=== Setting up Frontend Structure ===")
    
    # Create main directories
    frontend_dir = os.path.join(ROOT_DIR, "frontend")
    create_directory(frontend_dir)
    
    # Create frontend subdirectories
    create_directory(os.path.join(frontend_dir, "public"))
    create_directory(os.path.join(frontend_dir, "src"))
    
    # Create src subdirectories
    src_subdirs = [
        "components",
        "components/layout",
        "components/tools",
        "components/common",
        "pages",
        "hooks",
        "utils",
        "context",
        "types",
    ]
    
    for subdir in src_subdirs:
        create_directory(os.path.join(frontend_dir, "src", subdir))
    
    # Create basic package.json
    pkg_json_content = '''{
  "name": "dolphin-mcp-toolbox",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "@vitejs/plugin-react": "^4.0.3",
    "autoprefixer": "^10.4.14",
    "eslint": "^8.45.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.3",
    "postcss": "^8.4.27",
    "tailwindcss": "^3.3.3",
    "typescript": "^5.0.2",
    "vite": "^4.4.5"
  }
}'''
    create_file(os.path.join(frontend_dir, "package.json"), pkg_json_content)
    
    # Create vite.config.ts
    vite_config_content = '''import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  }
})'''
    create_file(os.path.join(frontend_dir, "vite.config.ts"), vite_config_content)
    
    # Create tailwind.config.js
    tailwind_config_content = '''/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}'''
    create_file(os.path.join(frontend_dir, "tailwind.config.js"), tailwind_config_content)
    
    # Create postcss.config.js
    postcss_config_content = '''export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}'''
    create_file(os.path.join(frontend_dir, "postcss.config.js"), postcss_config_content)
    
    # Create index.html
    index_html_content = '''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dolphin MCP Toolbox</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>'''
    create_file(os.path.join(frontend_dir, "index.html"), index_html_content)
    
    # Create main.tsx
    main_tsx_content = '''import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)'''
    create_file(os.path.join(frontend_dir, "src", "main.tsx"), main_tsx_content)
    
    # Create index.css
    index_css_content = '''@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}'''
    create_file(os.path.join(frontend_dir, "src", "index.css"), index_css_content)
    
    # Create .env.example
    env_content = '''# API URL
VITE_API_URL=http://localhost:8000'''
    create_file(os.path.join(frontend_dir, ".env.example"), env_content)

def create_scripts_directory():
    """Create scripts directory and files"""
    print("\n=== Setting up Scripts Directory ===")
    
    scripts_dir = os.path.join(ROOT_DIR, "scripts")
    create_directory(scripts_dir)
    
    # Create build script
    build_script_content = '''#!/usr/bin/env python3
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
'''
    create_file(os.path.join(scripts_dir, "build.py"), build_script_content)
    
    # Make it executable
    os.chmod(os.path.join(scripts_dir, "build.py"), 0o755)

def create_venv():
    """Create virtual environment"""
    print("\n=== Setting up Virtual Environment ===")
    
    venv_dir = os.path.join(ROOT_DIR, "venv")
    
    if os.path.exists(venv_dir):
        print(f"Virtual environment already exists at {venv_dir}")
        return
    
    try:
        print("Creating virtual environment...")
        subprocess.run([sys.executable, "-m", "venv", "venv"], cwd=ROOT_DIR, check=True)
        print(f"Virtual environment created at {venv_dir}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to create virtual environment: {str(e)}")

def create_requirements_file():
    """Create requirements.txt file"""
    print("\n=== Creating Requirements File ===")
    
    requirements_content = '''# API Framework
fastapi>=0.103.1
uvicorn>=0.23.2

# Dolphin MCP
git+https://github.com/cognitivecomputations/dolphin-mcp.git

# Utilities
pydantic>=2.4.2
python-dotenv>=1.0.0
requests>=2.31.0
aiohttp>=3.8.5

# For production deployment (optional)
gunicorn>=21.2.0
'''
    create_file(os.path.join(ROOT_DIR, "requirements.txt"), requirements_content)

def create_readme():
    """Create README.md file"""
    print("\n=== Creating README ===")
    
    readme_content = '''# 🐬 Dolphin MCP Toolbox

A user-friendly UI for building and using LLM-powered tools via the Model Context Protocol (MCP).

## 🚀 Features

- 🛠️ Create and manage AI tools powered by local models
- 🏠 Run everything locally with Ollama
- ☁️ Optional integration with cloud models like Claude
- 📱 Clean, intuitive UI inspired by classic software design
- 🔧 Use MCP protocol for flexible model interaction

## 📋 Prerequisites

- [Python](https://www.python.org/) 3.8 or higher
- [Node.js](https://nodejs.org/) 16.x or higher
- [Ollama](https://ollama.ai/) for local model inference

## 🔧 Installation

1. Set up the Python backend:

```bash
# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

2. Set up the React frontend:

```bash
cd frontend
npm install
```

## 🚀 Running the Application

1. Start the backend:

```bash
# From the root directory with virtual environment activated
cd backend
python main.py
```

2. Start the frontend:

```bash
# In another terminal, from the root directory
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:3000`
'''
    create_file(os.path.join(ROOT_DIR, "README.md"), readme_content)

def create_gitignore():
    """Create .gitignore file"""
    print("\n=== Creating .gitignore ===")
    
    gitignore_content = '''# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual Environment
venv/
env/
ENV/

# Node.js
node_modules/
npm-debug.log
yarn-debug.log
yarn-error.log

# Frontend build
frontend/dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
'''
    create_file(os.path.join(ROOT_DIR, ".gitignore"), gitignore_content)

def create_main_py():
    """Create main.py in backend directory"""
    print("\n=== Creating main.py ===")
    
    main_content = '''"""
Main FastAPI application
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from pydantic import BaseModel
from typing import List, Optional
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Dolphin MCP Toolbox",
    description="A flexible toolbox for interacting with LLMs via MCP",
    version="0.1.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class ToolConfig(BaseModel):
    id: Optional[str] = None
    name: str
    description: str
    provider: str  # "ollama", "claude", etc.
    model: str
    prompt_template: str
    parameters: dict = {}
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class LLMRequest(BaseModel):
    tool_id: str
    input: str
    parameters: Optional[dict] = None

class LLMResponse(BaseModel):
    tool_id: str
    input: str
    output: str
    metadata: dict = {}

# In-memory storage (would be replaced with proper DB)
tools_db = []

# Routes
@app.get("/")
async def root():
    return {"message": "Welcome to Dolphin MCP Toolbox API"}

@app.get("/tools", response_model=List[ToolConfig])
async def get_tools():
    return tools_db

@app.post("/tools", response_model=ToolConfig)
async def create_tool(tool: ToolConfig):
    # Simple validation
    if any(t.name == tool.name for t in tools_db):
        raise HTTPException(status_code=400, detail="Tool with this name already exists")
    
    # Generate ID and timestamps (simplified)
    import time
    import uuid
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    
    tool.id = str(uuid.uuid4())
    tool.created_at = timestamp
    tool.updated_at = timestamp
    
    tools_db.append(tool)
    return tool

@app.get("/tools/{tool_id}", response_model=ToolConfig)
async def get_tool(tool_id: str):
    for tool in tools_db:
        if tool.id == tool_id:
            return tool
    raise HTTPException(status_code=404, detail="Tool not found")

@app.post("/llm/generate", response_model=LLMResponse)
async def generate_llm_response(request: LLMRequest):
    # Find the tool
    tool = next((t for t in tools_db if t.id == request.tool_id), None)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    try:
        # This is where we'd integrate with the dolphin-mcp library
        # For now, we'll just return a mock response
        logger.info(f"Processing request with tool: {tool.name}")
        
        response = LLMResponse(
            tool_id=request.tool_id,
            input=request.input,
            output=f"This is a mock response from {tool.provider} using {tool.model}.\n\nYour query was: {request.input}",
            metadata={
                "provider": tool.provider,
                "model": tool.model,
                "processing_time": 0.5,  # Mock value
            }
        )
        return response
    except Exception as e:
        logger.error(f"Error processing LLM request: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

# Add a sample tool for development
sample_tool = ToolConfig(
    name="Text Summarizer",
    description="Summarizes long text into key points",
    provider="ollama",
    model="llama3",
    prompt_template="Summarize the following text:\n\n{input}\n\nSummary:",
    parameters={"temperature": 0.7, "max_tokens": 250}
)
tools_db.append(sample_tool)

# Main entry point
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
'''
    create_file(os.path.join(ROOT_DIR, "backend", "main.py"), main_content)

def create_app_tsx():
    """Create App.tsx in frontend/src directory"""
    print("\n=== Creating App.tsx ===")
    
    app_content = '''import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <h1 className="text-lg font-semibold text-gray-900">Dolphin MCP Toolbox</h1>
          </div>
        </header>
        <main>
          <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4 flex items-center justify-center">
                <p className="text-center text-gray-500">
                  Welcome to Dolphin MCP Toolbox!<br />
                  Edit <code className="font-mono bg-gray-100 px-1">src/App.tsx</code> to get started.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Router>
  );
};

export default App;
'''
    create_file(os.path.join(ROOT_DIR, "frontend", "src", "App.tsx"), app_content)

def activate_venv():
    """Print instructions for activating venv"""
    print("\n=== Virtual Environment Activation ===")
    
    if os.name == 'nt':  # Windows
        print("To activate the virtual environment, run:")
        print(f"    {os.path.join('venv', 'Scripts', 'activate')}")
    else:  # macOS/Linux
        print("To activate the virtual environment, run:")
        print("    source venv/bin/activate")

def main():
    """Main setup function"""
    print("Setting up Dolphin MCP Toolbox project structure...\n")
    
    # Create project structure
    create_backend_structure()
    create_frontend_structure()
    create_scripts_directory()
    create_requirements_file()
    create_readme()
    create_gitignore()
    create_main_py()
    create_app_tsx()
    create_venv()
    
    # Print activation instructions
    activate_venv()
    
    print("\n=== Setup Complete ===")
    print("Next steps:")
    print("1. Activate the virtual environment")
    print("2. Install dependencies: pip install -r requirements.txt")
    print("3. Set up frontend: cd frontend && npm install")
    print("4. Start the backend: cd backend && python main.py")
    print("5. Start the frontend: cd frontend && npm run dev")

if __name__ == "__main__":
    main()