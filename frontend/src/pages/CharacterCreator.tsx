import React, { useState } from 'react';
import { motion } from 'framer-motion';
import MainLayout from '../components/layout/MainLayout';
import { useCharacter, Character } from '../context/CharacterContext';

const ANIMAL_TYPES = ['cat', 'dog', 'bird', 'rabbit', 'fox', 'bear'] as const;
const COLOR_PRESETS = [
  { name: 'Sakura Pink', value: '#FFA8C9' },
  { name: 'Sky Blue', value: '#A8D8FF' },
  { name: 'Mint Green', value: '#A8FFDA' },
  { name: 'Lavender', value: '#D5A8FF' },
  { name: 'Sunset Orange', value: '#FFC8A8' },
  { name: 'Lemon Yellow', value: '#FFF3A8' },
];

const ROLES = [
  'Assistant',
  'Shopkeeper',
  'Scholar',
  'Messenger',
  'Creator',
  'Guardian',
  'Farmer',
  'Chef',
  'Healer',
  'Explorer'
];

const CharacterCreator: React.FC = () => {
  const { characters } = useCharacter();
  const [newCharacter, setNewCharacter] = useState<Partial<Character>>({
    type: 'cat',
    color: COLOR_PRESETS[0].value,
    name: '',
    role: 'Assistant',
    description: ''
  });
  const [showPreview, setShowPreview] = useState(false);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCharacter(prev => ({ ...prev, [name]: value }));
  };
  
  const handleColorSelect = (color: string) => {
    setNewCharacter(prev => ({ ...prev, color }));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save the character
    console.log('New character created:', newCharacter);
    
    // Show preview
    setShowPreview(true);
  };
  
  const getAnimalEmoji = (type: string): string => {
    switch (type) {
      case 'cat': return '🐱';
      case 'dog': return '🐶';
      case 'bird': return '🐦';
      case 'rabbit': return '🐰';
      case 'fox': return '🦊';
      case 'bear': return '🐻';
      default: return '🐾';
    }
  };
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-6 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-kawaii-purple-800 mb-2 font-pixel">Character Creator</h1>
          <p className="text-kawaii-purple-600">Design your own kawaii farm character!</p>
        </motion.div>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form section */}
          <motion.div 
            className="flex-1 bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-md border border-white/30"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic info */}
              <div>
                <label className="block text-kawaii-purple-700 font-medium mb-2">Character Name</label>
                <input
                  type="text"
                  name="name"
                  value={newCharacter.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-white/70 border border-kawaii-purple-100 focus:ring-2 focus:ring-kawaii-pink-300 focus:outline-none transition"
                  placeholder="Enter a cute name..."
                  required
                />
              </div>
              
              {/* Type selection */}
              <div>
                <label className="block text-kawaii-purple-700 font-medium mb-2">Animal Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {ANIMAL_TYPES.map(type => (
                    <motion.button
                      key={type}
                      type="button"
                      className={`p-3 rounded-lg flex flex-col items-center ${
                        newCharacter.type === type 
                          ? 'bg-kawaii-purple-100 border-2 border-kawaii-purple-300' 
                          : 'bg-white/70 border border-kawaii-purple-100 hover:bg-kawaii-purple-50'
                      }`}
                      onClick={() => setNewCharacter(prev => ({ ...prev, type }))}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="text-3xl mb-1">{getAnimalEmoji(type)}</span>
                      <span className="text-sm capitalize">{type}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
              
              {/* Color selection */}
              <div>
                <label className="block text-kawaii-purple-700 font-medium mb-2">Color</label>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_PRESETS.map(color => (
                    <motion.button
                      key={color.name}
                      type="button"
                      className={`w-full aspect-square rounded-full ${
                        newCharacter.color === color.value ? 'ring-2 ring-offset-2 ring-kawaii-purple-500' : ''
                      }`}
                      style={{ backgroundColor: color.value }}
                      onClick={() => handleColorSelect(color.value)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      title={color.name}
                    />
                  ))}
                </div>
                <div className="mt-2">
                  <label className="text-xs text-kawaii-purple-600 mb-1 block">Custom Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={newCharacter.color}
                      onChange={(e) => handleColorSelect(e.target.value)}
                      className="w-10 h-10 rounded-full"
                    />
                    <input
                      type="text"
                      value={newCharacter.color}
                      onChange={(e) => handleColorSelect(e.target.value)}
                      className="flex-grow px-3 py-1 rounded-lg bg-white/70 border border-kawaii-purple-100 focus:ring-2 focus:ring-kawaii-pink-300 focus:outline-none text-sm"
                      placeholder="#RRGGBB"
                    />
                  </div>
                </div>
              </div>
              
              {/* Role selection */}
              <div>
                <label className="block text-kawaii-purple-700 font-medium mb-2">Role</label>
                <select
                  name="role"
                  value={newCharacter.role}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-white/70 border border-kawaii-purple-100 focus:ring-2 focus:ring-kawaii-pink-300 focus:outline-none transition"
                >
                  {ROLES.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>
              
              {/* Description */}
              <div>
                <label className="block text-kawaii-purple-700 font-medium mb-2">Description</label>
                <textarea
                  name="description"
                  value={newCharacter.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 rounded-lg bg-white/70 border border-kawaii-purple-100 focus:ring-2 focus:ring-kawaii-pink-300 focus:outline-none transition"
                  placeholder="Describe your character's personality..."
                  rows={3}
                />
              </div>
              
              <motion.button
                type="submit"
                className="w-full py-3 rounded-lg bg-gradient-to-r from-kawaii-purple-500 to-kawaii-pink-500 text-white font-medium shadow-md"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Create Character
              </motion.button>
            </form>
          </motion.div>
          
          {/* Preview section */}
          <motion.div
            className="flex-1 bg-gradient-to-br from-kawaii-purple-50 to-kawaii-pink-50 p-6 rounded-xl shadow-md overflow-hidden relative"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-xl font-bold text-kawaii-purple-800 mb-4 font-pixel">Character Preview</h2>
            
            {/* Character display */}
            <div className="flex justify-center mb-6">
              <motion.div 
                className="relative"
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              >
                <div 
                  className="w-32 h-32 rounded-full shadow-lg flex items-center justify-center"
                  style={{ backgroundColor: newCharacter.color }}
                >
                  <span className="text-6xl">{getAnimalEmoji(newCharacter.type || 'cat')}</span>
                </div>
                
                {/* Expression bubble */}
                <motion.div
                  className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md whitespace-nowrap text-sm border border-white/30"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <span className="text-kawaii-purple-800">
                    {showPreview ? `Hi, I'm ${newCharacter.name}!` : '(◕‿◕)'}
                  </span>
                </motion.div>
                
                {/* Name tag */}
                <motion.div
                  className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-white/70 backdrop-blur-md px-3 py-1 rounded-full shadow-sm text-sm font-medium text-kawaii-purple-800 border border-white/30"
                  animate={{
                    y: [0, 2, 0],
                  }}
                  transition={{
                    y: {
                      repeat: Infinity,
                      duration: 3,
                      ease: "easeInOut"
                    }
                  }}
                >
                  {newCharacter.name || '???'} • {newCharacter.role}
                </motion.div>
              </motion.div>
            </div>
            
            {/* Stats cards */}
            {showPreview && (
              <div className="space-y-4">
                <motion.div 
                  className="bg-white/70 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-white/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <h3 className="font-medium text-kawaii-purple-800 mb-2">About Me</h3>
                  <p className="text-sm text-kawaii-purple-700">
                    {newCharacter.description || "This character doesn't have a description yet."}
                  </p>
                </motion.div>
                
                <motion.div 
                  className="bg-white/70 backdrop-blur-sm p-4 rounded-lg shadow-sm border border-white/30"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h3 className="font-medium text-kawaii-purple-800 mb-2">Character Stats</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-kawaii-purple-600">Type</div>
                      <div className="font-medium capitalize">{newCharacter.type}</div>
                    </div>
                    <div>
                      <div className="text-kawaii-purple-600">Role</div>
                      <div className="font-medium">{newCharacter.role}</div>
                    </div>
                    <div>
                      <div className="text-kawaii-purple-600">Color</div>
                      <div className="font-medium flex items-center">
                        <div className="w-3 h-3 rounded-full mr-1" style={{ backgroundColor: newCharacter.color }}></div>
                        {newCharacter.color}
                      </div>
                    </div>
                    <div>
                      <div className="text-kawaii-purple-600">Friends</div>
                      <div className="font-medium">{characters.length} animals</div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
            
            {/* Decorative elements */}
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-kawaii-pink-200/20 rounded-full"></div>
            <div className="absolute -top-10 -left-10 w-20 h-20 bg-kawaii-purple-200/20 rounded-full"></div>
          </motion.div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CharacterCreator; 