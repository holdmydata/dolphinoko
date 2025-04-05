#!/usr/bin/env python3
"""
Script to fix imports by removing 'backend.' prefixes
"""
import os
import re
import sys

def fix_imports_in_file(file_path):
    """Fix imports in a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace all 'from backend.' with 'from '
        new_content = re.sub(r'from backend\.', 'from ', content)
        
        # Replace all 'import backend.' with 'import '
        new_content = re.sub(r'import backend\.', 'import ', new_content)
        
        # Only write file if changes were made
        if new_content != content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Fixed imports in: {file_path}")
            return True
        return False
    except Exception as e:
        print(f"Error processing {file_path}: {str(e)}")
        return False

def find_python_files(directory):
    """Find all Python files in directory and subdirectories"""
    python_files = []
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.py'):
                python_files.append(os.path.join(root, file))
    return python_files

def fix_neo4j_service():
    """Specifically fix neo4j_service.py which has a comment with backend prefix"""
    neo4j_file = os.path.join(os.getcwd(), 'backend', 'services', 'neo4j_service.py')
    if os.path.exists(neo4j_file):
        try:
            with open(neo4j_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace the first line comment if it has 'backend/' prefix
            new_content = re.sub(r'# backend/services/neo4j_service\.py', '# services/neo4j_service.py', content)
            
            if new_content != content:
                with open(neo4j_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed comment in: {neo4j_file}")
        except Exception as e:
            print(f"Error fixing neo4j_service.py: {str(e)}")

def fix_sqlite_storage():
    """Specifically fix sqlite_storage.py since it was mentioned in the error"""
    sqlite_file = os.path.join(os.getcwd(), 'backend', 'services', 'sqlite_storage.py')
    if os.path.exists(sqlite_file):
        try:
            with open(sqlite_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace storage_interface import
            new_content = content.replace(
                'from backend.services.storage_interface import StorageInterface',
                'from services.storage_interface import StorageInterface'
            )
            
            if new_content != content:
                with open(sqlite_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed imports in: {sqlite_file}")
        except Exception as e:
            print(f"Error fixing sqlite_storage.py: {str(e)}")

def fix_dependencies():
    """Fix dependencies.py which might have absolute imports"""
    dep_file = os.path.join(os.getcwd(), 'backend', 'dependencies.py')
    if os.path.exists(dep_file):
        try:
            with open(dep_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Replace the first line comment
            new_content = re.sub(r'# backend/dependencies\.py', '# dependencies.py', content)
            
            # Fix specific imports
            new_content = new_content.replace(
                'from backend.services.neo4j_service import Neo4jService',
                'from services.neo4j_service import Neo4jService'
            )
            new_content = new_content.replace(
                'from backend.services.sqlite_storage import SQLiteStorage',
                'from services.sqlite_storage import SQLiteStorage'
            )
            new_content = new_content.replace(
                'from backend.services.storage_interface import StorageInterface',
                'from services.storage_interface import StorageInterface'
            )
            
            if new_content != content:
                with open(dep_file, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Fixed imports in: {dep_file}")
        except Exception as e:
            print(f"Error fixing dependencies.py: {str(e)}")

def main():
    """Main function"""
    backend_dir = os.path.join(os.getcwd(), 'backend')
    
    # Check if backend directory exists
    if not os.path.isdir(backend_dir):
        print(f"Error: {backend_dir} is not a directory")
        return 1
    
    # Find all Python files
    python_files = find_python_files(backend_dir)
    print(f"Found {len(python_files)} Python files to process")
    
    # Fix specific files first
    fix_neo4j_service()
    fix_sqlite_storage()
    fix_dependencies()
    
    # Fix imports in all files
    fixed_count = 0
    for file_path in python_files:
        if fix_imports_in_file(file_path):
            fixed_count += 1
    
    print(f"Successfully fixed imports in {fixed_count} files")
    
    # Empty the __init__.py file to make sure it's clean
    init_file = os.path.join(backend_dir, '__init__.py')
    if os.path.exists(init_file):
        with open(init_file, 'w', encoding='utf-8') as f:
            f.write('')
        print(f"Reset {init_file} to be empty")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 