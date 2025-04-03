# 🐬 Dolphinoko: Friendly Farm of AI Tools

Dolphinoko is a delightful farm-themed user interface for building and using LLM-powered agents via the Dolphin Model Context Protocol (MCP). Create and deploy character-based AI helpers with different specialties, organize them visually, and enjoy interacting with them through an accessible, warm interface. The tooling is built on local models with Ollama, with optional cloud model integration.

## 🚀 Features

- 🐱 Character-based AI agents with different specialties and personalities
- 🧰 Powerful tool creation and categorization system 
- 🌾 Farm-themed, accessible UI with improved usability
- 🏠 Run everything locally with Ollama models
- ☁️ Optional integration with cloud models like Claude
- 🔄 Seamless character-tool integration for intelligent responses

## 🌟 What's New in v2.0

### 🌾 Farm-Themed Interface
- Complete UI redesign with a cozy farm aesthetic
- Improved accessibility and readability
- Better mobile responsiveness

### 🐱 Character-Based Agent System
- Create and customize animal characters as AI assistants
- Each character specializes in different tool categories
- Visual character creator with customization options

### 🧰 Enhanced Tool Management
- Improved tool categorization and organization
- Better tool search and discovery
- Seamless integration between tools and characters

### 💬 Improved Chat Experience
- Fixed scrolling and display issues in chat interface
- Enhanced tool execution directly within chat
- Better message rendering and formatting

## 📋 Prerequisites

- [Python](https://www.python.org/) 3.8 or higher
- [Node.js](https://nodejs.org/) 16.x or higher
- [Ollama](https://ollama.ai/) for local model inference
- [dolphin-mcp](https://github.com/cognitivecomputations/dolphin-mcp) (installed automatically)

## ⚠️ NOTICE:
This is an experimental project provided AS IS. Use at your own risk. There may still be bugs and issues, but we're actively working to improve it!

Current development priorities:
- Finishing Anthropic integration
- Adding more character types and customization options
- Improving tool categories and persistence
- Enhanced context handling between characters and tools

## 🔧 Installation

1. Clone the repository:

```bash
git clone https://github.com/holdmydata/dolphinoko.git
cd dolphinoko
```

2. Set up the Python backend:

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

3. Set up the React frontend:

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

## 🔄 Using with Ollama

1. [Install Ollama](https://ollama.ai/download) if you haven't already
2. Pull a model, e.g.: `ollama pull dolphin-llama3` or `ollama pull gemma:7b`
3. Make sure Ollama is running when you use Dolphinoko

## 🐱 Working with Character Agents

1. Navigate to the Character Creator page
2. Design your character:
   - Choose an animal type (cat, dog, bird, etc.)
   - Select a color and give them a name
   - Assign a role and toolCategory that fits their specialty
3. Save your character
4. Visit the Island or Chat page to interact with your new assistant!

## 🛠️ Building Your First Tool

1. Navigate to the Tool Builder page
2. Click "Create New Tool"
3. Fill in the tool details:
   - Name: A descriptive name for your tool
   - Provider: Choose "Ollama" for local models
   - Model: Select a model you've pulled to Ollama
   - Category: Select a category that matches a character's toolCategory
   - Prompt Template: Create a template using `{input}` as placeholder for user input
4. Save your tool
5. Use the Tool Organizer to properly categorize your tools
6. Interact with the appropriate character to utilize your tool!

## 📦 Project Structure

The project is organized with a clear separation between backend and frontend:

```
dolphinoko/
├── backend/              # FastAPI Python backend
├── frontend/             # React/TypeScript frontend
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── context/      # Context providers
│   │   ├── pages/        # Application pages
│   │   └── utils/        # Utility functions
└── README.md
```

## 📝 Customization

- **UI Theme**: The farm theme can be customized in `frontend/src/styles/theme.ts`
- **Characters**: Modify available character types in `frontend/src/context/CharacterContext.tsx`
- **Tool Categories**: Edit categories in `frontend/src/types/categories.ts`
- **Adding more providers**: Extend the providers in `backend/services/mcp_service.py`

## 👥 Contributing

Contributions are welcome! Feel free to submit a Pull Request or open an Issue for bugs and feature requests.

## 📄 License

MIT License (for our code). Models and third-party libraries maintain their own licensing.

## 🙏 Acknowledgments

- [Eric's Dolphin MCP](https://github.com/cognitivecomputations/dolphin-mcp) for the underlying MCP implementation
- [Ollama](https://ollama.ai/) for the local model inference
- The farming and kawaii aesthetics that inspired our new UI
