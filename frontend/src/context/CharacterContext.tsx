import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define character types
export interface Character {
  id: string;
  name: string;
  type: 'cat' | 'dog' | 'bird' | 'rabbit' | 'fox' | 'bear';
  color: string;
  role: string;
  expression?: string;
  description: string;
  toolCategory?: string;
  toolId?: string;
  animalType?: string;
  position?: {
    x: number;
    y: number;
  };
  isSelected?: boolean;
}

// Pre-defined characters
export const availableCharacters: Character[] = [
  {
    id: 'neko',
    name: 'Neko-san',
    type: 'cat',
    color: '#FFA07A',
    role: 'Assistant',
    description: 'A helpful and energetic cat who helps with daily tasks',
    toolCategory: 'assistant'
  },
  {
    id: 'tanuki',
    name: 'Tanuki-chan',
    type: 'dog',
    color: '#8B4513',
    role: 'Shopkeeper',
    description: 'A wise tanuki who searches the web for information',
    toolCategory: 'web'
  },
  {
    id: 'kitsune',
    name: 'Kitsune-sama',
    type: 'fox',
    color: '#FF6347',
    role: 'Scholar',
    description: 'A mystical fox who analyzes documents',
    toolCategory: 'document'
  },
  {
    id: 'tori',
    name: 'Tori-kun',
    type: 'bird',
    color: '#4682B4',
    role: 'Messenger',
    description: 'A quick bird who helps with email and messaging',
    toolCategory: 'communication'
  },
  {
    id: 'usagi',
    name: 'Usagi-chan',
    type: 'rabbit',
    color: '#9370DB',
    role: 'Creator',
    description: 'A creative rabbit who assists with content creation',
    toolCategory: 'creative'
  },
  {
    id: 'kuma',
    name: 'Kuma-san',
    type: 'bear',
    color: '#8B8878',
    role: 'Guardian',
    description: 'A protective bear who manages security and privacy',
    toolCategory: 'security'
  },
  {
    id: 'blender',
    name: 'Blender-san',
    type: 'fox',
    color: '#5C8374',
    role: '3D Specialist',
    description: 'A technical fox who helps with 3D modeling and Blender operations',
    toolCategory: 'blender'
  }
];

// Random cute anime expressions
export const animeExpressions = [
  '(◕‿◕)',
  '(✿◠‿◠)',
  '(◕ᴗ◕✿)',
  '(。◕‿◕。)',
  '(„ᵕᴗᵕ„)',
  '(≧◡≦)',
  '(◠‿◠✿)',
  '(◕‿◕✿)',
  '(◕ω◕)',
  '(｡◕‿◕｡)',
  '(●´ω｀●)',
  '(✧ω✧)'
];

export const getRandomExpression = (): string => {
  return animeExpressions[Math.floor(Math.random() * animeExpressions.length)];
};

// Define context type
interface CharacterContextType {
  characters: Character[];
  selectedCharacter: Character | null;
  setSelectedCharacter: (character: Character | null) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  getCharactersByCategory: (category: string) => Character[];
}

// Create context with default values
const CharacterContext = createContext<CharacterContextType>({
  characters: availableCharacters,
  selectedCharacter: null,
  setSelectedCharacter: () => {},
  addCharacter: () => {},
  updateCharacter: () => {},
  deleteCharacter: () => {},
  getCharactersByCategory: () => [],
});

// Provider component
interface CharacterProviderProps {
  children: ReactNode;
}

export const CharacterProvider = ({ children }: CharacterProviderProps) => {
  const [characters, setCharacters] = useState<Character[]>(
    availableCharacters.map(char => ({
      ...char,
      expression: getRandomExpression()
    }))
  );
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(characters[0]);

  const addCharacter = (character: Character) => {
    setCharacters(prevCharacters => [...prevCharacters, character]);
  };

  const updateCharacter = (id: string, updates: Partial<Character>) => {
    setCharacters(prevCharacters => 
      prevCharacters.map(char => 
        char.id === id ? { ...char, ...updates } : char
      )
    );
    
    // Also update selected character if it's the one being updated
    if (selectedCharacter?.id === id) {
      setSelectedCharacter(prev => prev ? { ...prev, ...updates } : prev);
    }
  };

  const deleteCharacter = (id: string) => {
    setCharacters(prevCharacters => 
      prevCharacters.filter(char => char.id !== id)
    );
    
    // Clear selected character if it's the one being deleted
    if (selectedCharacter?.id === id) {
      setSelectedCharacter(null);
    }
  };

  const getCharactersByCategory = (category: string) => {
    return characters.filter(char => char.toolCategory === category);
  };

  return (
    <CharacterContext.Provider 
      value={{ 
        characters, 
        selectedCharacter, 
        setSelectedCharacter,
        addCharacter,
        updateCharacter,
        deleteCharacter,
        getCharactersByCategory
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
};

// Custom hook for using the character context
export const useCharacter = () => useContext(CharacterContext);

export default CharacterContext; 