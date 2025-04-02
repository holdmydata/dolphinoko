import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCharacter, Character } from '../../context/CharacterContext';

interface IslandViewProps {
  className?: string;
  onCharacterSelect: (characterId: string) => void;
  selectedCharacterId?: string;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  speed: number;
}

const IslandView: React.FC<IslandViewProps> = ({
  className = '',
  onCharacterSelect,
  selectedCharacterId
}) => {
  const { characters, updateCharacter } = useCharacter();
  const [hoveredCharacter, setHoveredCharacter] = useState<string | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'day' | 'evening' | 'night'>('day');
  const [particles, setParticles] = useState<Particle[]>([]);
  
  // Initialize particles for ambient effects (cherry blossoms, fireflies, etc.)
  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        speed: Math.random() * 2 + 1
      });
    }
    setParticles(newParticles);
    
    // Day-night cycle
    const interval = setInterval(() => {
      setTimeOfDay(prev => {
        if (prev === 'morning') return 'day';
        if (prev === 'day') return 'evening';
        if (prev === 'evening') return 'night';
        return 'morning';
      });
    }, 60000); // Change every minute for demo purposes
    
    return () => clearInterval(interval);
  }, []);
  
  // Update particles position
  useEffect(() => {
    const animateParticles = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => ({
          ...particle,
          y: particle.y + particle.speed * 0.1,
          x: particle.x + Math.sin(particle.y * 0.1) * 0.2,
          ...(particle.y > 100 ? { y: -10, x: Math.random() * 100 } : {})
        }))
      );
    };
    
    const intervalId = setInterval(animateParticles, 50);
    return () => clearInterval(intervalId);
  }, []);

  // Farm objects for decoration
  const farmObjects = [
    { type: 'barn', position: { left: '15%', top: '25%' } },
    { type: 'tree', position: { left: '75%', top: '35%' } },
    { type: 'tree', position: { left: '80%', top: '40%' } },
    { type: 'pond', position: { left: '60%', top: '65%' } },
    { type: 'field', position: { left: '40%', top: '55%' } },
    { type: 'fence', position: { left: '25%', top: '65%' } },
    { type: 'fence', position: { left: '35%', top: '65%' } },
    { type: 'fence', position: { left: '45%', top: '65%' } }
  ];

  // Character positions on the farm
  const characterPositions = [
    { left: '20%', top: '40%' },  // near barn
    { left: '50%', top: '30%' },  // central
    { left: '70%', top: '50%' },  // near trees
    { left: '30%', top: '60%' },  // near fields
    { left: '55%', top: '70%' },  // near pond
    { left: '80%', top: '70%' }   // corner
  ];

  // Generate random wave animation with slightly different timing for each wave
  const getWaveAnimation = (index: number) => {
    const delay = index * 0.2;
    return {
      y: ['0%', '5%', '0%'],
      transition: {
        y: {
          repeat: Infinity,
          duration: 3,
          ease: 'easeInOut',
          delay
        }
      }
    };
  };

  // Handle hovering over a character
  const handleCharacterHover = (characterId: string) => {
    if (characterId) {
      setHoveredCharacter(characterId);
      updateCharacterExpression(characterId);
    }
  };
  
  // Helper function to update character expression
  const updateCharacterExpression = (characterId: string) => {
    const expressions = ['(◕‿◕)', '(✿◠‿◠)', '(◕ᴗ◕✿)', '(。◕‿◕。)', '(„ᵕᴗᵕ„)', '(≧◡≦)'];
    const newExpression = expressions[Math.floor(Math.random() * expressions.length)];
    updateCharacter(characterId, { expression: newExpression });
  };
  
  // Get background colors based on time of day
  const getSkyGradient = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'from-pink-300 to-blue-200';
      case 'day':
        return 'from-blue-300 to-blue-100';
      case 'evening':
        return 'from-orange-300 to-purple-200';
      case 'night':
        return 'from-indigo-900 to-purple-800';
    }
  };
  
  // Get water color based on time of day
  const getWaterColor = (alpha: number) => {
    switch (timeOfDay) {
      case 'morning':
        return `rgba(100, 180, 255, ${alpha})`;
      case 'day':
        return `rgba(66, 133, 244, ${alpha})`;
      case 'evening':
        return `rgba(130, 100, 200, ${alpha})`;
      case 'night':
        return `rgba(30, 30, 100, ${alpha})`;
    }
  };
  
  // Get light effect for characters based on time of day
  const getCharacterLighting = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'drop-shadow(0 0 8px rgba(255, 200, 150, 0.5))';
      case 'day':
        return 'drop-shadow(0 0 5px rgba(255, 255, 255, 0.3))';
      case 'evening':
        return 'drop-shadow(0 0 8px rgba(255, 150, 100, 0.5))';
      case 'night':
        return 'drop-shadow(0 0 10px rgba(100, 150, 255, 0.6))';
    }
  };

  return (
    <div className={`w-full h-full relative overflow-hidden rounded-xl shadow-lg ${className}`}>
      {/* Sky gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${getSkyGradient()} transition-colors duration-1000`}></div>
      
      {/* Sun/Moon */}
      <motion.div 
        className={`absolute w-16 h-16 rounded-full ${
          timeOfDay === 'night' 
            ? 'bg-gray-100 shadow-lg shadow-blue-200/50' 
            : 'bg-yellow-300 shadow-lg shadow-yellow-500/50'
        } transition-colors duration-1000`}
        style={{ 
          right: '10%', 
          top: timeOfDay === 'night' || timeOfDay === 'evening' ? '20%' : '10%' 
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.9, 1, 0.9]
        }}
        transition={{
          repeat: Infinity,
          duration: 5
        }}
      >
        {timeOfDay === 'night' && (
          <div className="absolute inset-1 opacity-50">
            <div className="absolute w-3 h-3 bg-gray-300 rounded-full left-2 top-3"></div>
            <div className="absolute w-2 h-2 bg-gray-300 rounded-full left-8 top-2"></div>
            <div className="absolute w-4 h-4 bg-gray-300 rounded-full left-6 top-6"></div>
          </div>
        )}
      </motion.div>
      
      {/* Ambient particles (cherry blossoms in day, fireflies at night) */}
      {particles.map((particle, index) => (
        <motion.div
          key={`particle-${index}`}
          className={`absolute rounded-full ${
            timeOfDay === 'night' 
              ? 'bg-yellow-200 mix-blend-lighten' 
              : 'bg-pink-200'
          }`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            opacity: timeOfDay === 'night' ? 0.7 : 0.5,
            filter: timeOfDay === 'night' ? 'blur(1px)' : 'none'
          }}
          animate={timeOfDay === 'night' ? {
            opacity: [0.2, 0.7, 0.2],
            scale: [0.8, 1.2, 0.8]
          } : {}}
          transition={timeOfDay === 'night' ? {
            repeat: Infinity,
            duration: 2 + Math.random() * 2
          } : {}}
        />
      ))}
      
      {/* Ocean waves */}
      <div className="absolute left-0 right-0 bottom-0 h-1/4">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={`wave-${i}`}
            className="absolute left-0 right-0 backdrop-blur-sm"
            style={{ 
              height: `${5 + i * 2}%`, 
              bottom: `${i * 5}%`, 
              backgroundColor: getWaterColor(0.2 + i * 0.15),
              borderRadius: '50% 50% 0 0'
            }}
            animate={getWaveAnimation(i)}
          />
        ))}
      </div>
      
      {/* Grass ground */}
      <div className="absolute left-0 right-0 bottom-0 h-3/4 bg-gradient-to-b from-green-300 to-green-500"></div>
      
      {/* Farm decorations with lighting effects */}
      {farmObjects.map((obj, index) => (
        <div
          key={`farm-object-${index}`}
          className="absolute"
          style={{
            left: obj.position.left,
            top: obj.position.top,
            zIndex: 2,
            filter: timeOfDay === 'night' ? 'brightness(0.6) saturate(0.8)' : 'none',
            transition: 'filter 1s ease'
          }}
        >
          {obj.type === 'barn' && (
            <div className="w-32 h-28 bg-red-600 relative rounded-t-lg">
              <div className="absolute w-full h-8 bg-gray-700 bottom-full"></div>
              <div className="absolute w-10 h-14 bg-yellow-700 bottom-0 left-1/2 transform -translate-x-1/2 rounded-t-lg"></div>
              <div className="absolute w-4 h-4 bg-gray-200 rounded-full top-8 right-6"></div>
              
              {/* Light from window at night */}
              {(timeOfDay === 'night' || timeOfDay === 'evening') && (
                <div className="absolute w-4 h-4 bg-yellow-200 rounded-sm opacity-80 animate-pulse" 
                  style={{top: '15px', left: '10px', boxShadow: '0 0 10px rgba(255, 255, 200, 0.8)'}}
                ></div>
              )}
            </div>
          )}
          
          {obj.type === 'tree' && (
            <div className="relative">
              <div className="w-8 h-16 bg-yellow-800 rounded-sm mx-auto"></div>
              <div className="w-24 h-24 bg-green-600 rounded-full absolute -top-16 left-1/2 transform -translate-x-1/2"></div>
              <div className="w-20 h-20 bg-green-700 rounded-full absolute -top-12 left-1/2 transform -translate-x-1/2"></div>
            </div>
          )}
          
          {obj.type === 'pond' && (
            <div className="w-24 h-16 bg-blue-400 rounded-full">
              {/* Reflection on pond */}
              {(timeOfDay === 'night' || timeOfDay === 'evening') && (
                <div className="absolute inset-3 bg-white opacity-20 rounded-full animate-pulse"></div>
              )}
            </div>
          )}
          
          {obj.type === 'field' && (
            <div className="w-32 h-24 grid grid-cols-4 grid-rows-3 gap-1">
              {[...Array(12)].map((_, i) => (
                <div key={`crop-${i}`} className="bg-yellow-800 rounded-sm relative">
                  <div className="absolute w-full h-3/4 bottom-full left-0 bg-green-400"></div>
                </div>
              ))}
            </div>
          )}
          
          {obj.type === 'fence' && (
            <div className="w-16 h-8 flex items-end">
              <div className="w-2 h-8 bg-yellow-800 mx-1"></div>
              <div className="w-2 h-8 bg-yellow-800 mx-1"></div>
              <div className="w-2 h-8 bg-yellow-800 mx-1"></div>
              <div className="w-full h-2 bg-yellow-700 absolute top-3"></div>
            </div>
          )}
        </div>
      ))}
      
      {/* Character selection bar - glass morphism style */}
      <motion.div 
        className="absolute left-0 right-0 bottom-4 flex justify-center z-20"
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="bg-white/70 backdrop-blur-md p-3 rounded-full shadow-lg flex gap-3 border border-white/30">
          {characters && characters.map((character) => (
            <motion.button
              key={character.id}
              className={`w-12 h-12 rounded-full flex items-center justify-center p-1 cursor-pointer
                ${selectedCharacterId === character.id 
                  ? 'bg-gradient-to-br from-kawaii-pink-300 to-kawaii-purple-400 shadow-inner text-white' 
                  : 'bg-white/80 hover:bg-white'}
                transition-all duration-300 ease-in-out
              `}
              onClick={() => onCharacterSelect(character.id)}
              onMouseEnter={() => handleCharacterHover(character.id)}
              onMouseLeave={() => setHoveredCharacter(null)}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <span className="text-xl">{getAnimalEmoji(character.type)}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>
      
      {/* Characters on the farm with dynamic lighting */}
      {characters && characters.map((character, index) => {
        // Only show first 6 characters max
        if (index >= 6) return null;
        
        const position = characterPositions[index % characterPositions.length];
        const isSelected = selectedCharacterId === character.id;
        const isHovered = hoveredCharacter === character.id;
        
        return (
          <motion.div
            key={character.id}
            className={`absolute cursor-pointer`}
            style={{
              left: position.left,
              top: position.top,
              zIndex: isSelected ? 10 : 5,
              filter: getCharacterLighting(),
              transition: 'filter 1s ease'
            }}
            animate={{
              y: [0, -5, 0],
            }}
            transition={{
              y: {
                repeat: Infinity,
                duration: 2 + index * 0.2,
                ease: "easeInOut"
              }
            }}
            onClick={() => onCharacterSelect(character.id)}
            onMouseEnter={() => handleCharacterHover(character.id)}
            onMouseLeave={() => setHoveredCharacter(null)}
            whileHover={{ scale: 1.1 }}
          >
            {/* Character sprite with anime style */}
            <div className="relative">
              {/* Animal body */}
              <div 
                className="w-16 h-16 rounded-full shadow-md flex items-center justify-center"
                style={{ 
                  backgroundColor: character.color,
                  filter: isSelected ? 'brightness(1.2)' : 'brightness(1)'
                }}
              >
                <span className="text-3xl">{getAnimalEmoji(character.type)}</span>
                
                {/* Light glow at night */}
                {(timeOfDay === 'night' || timeOfDay === 'evening') && (
                  <div className="absolute inset-0 bg-yellow-200 rounded-full opacity-20 animate-pulse"></div>
                )}
              </div>
              
              {/* Expression bubble - glass morphism style */}
              <AnimatePresence>
                {(isSelected || isHovered) && (
                  <motion.div
                    className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md whitespace-nowrap text-sm border border-white/30"
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, y: 5 }}
                  >
                    <span className="font-bold mr-2 text-kawaii-purple-800">{character.name}</span>
                    <span>{character.expression}</span>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Name tag - glass morphism style */}
              <motion.div
                className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-white/70 backdrop-blur-md px-2 py-0.5 rounded-full shadow-sm text-xs font-medium text-kawaii-purple-800 border border-white/30"
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
                {character.role}
              </motion.div>
            </div>
          </motion.div>
        );
      })}
      
      {/* Time of day indicator - for debug/demo purposes */}
      <div className="absolute top-2 left-2 bg-white/50 backdrop-blur-sm rounded-full px-2 py-1 text-xs text-gray-700 font-medium">
        {timeOfDay === 'morning' && '🌅 Morning'}
        {timeOfDay === 'day' && '☀️ Day'}
        {timeOfDay === 'evening' && '🌇 Evening'}
        {timeOfDay === 'night' && '🌙 Night'}
      </div>
      
      {/* ThreeJS-inspired post-processing overlay */}
      <div className={`absolute inset-0 pointer-events-none ${
        timeOfDay === 'night' 
          ? 'bg-blue-900/10 mix-blend-multiply' 
          : timeOfDay === 'evening' 
            ? 'bg-orange-300/10 mix-blend-soft-light' 
            : timeOfDay === 'morning'
              ? 'bg-pink-200/10 mix-blend-soft-light'
              : ''
      }`}></div>
      
      {/* Vignette effect */}
      <div className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.3)',
          opacity: timeOfDay === 'night' ? 0.7 : 0.3
        }}
      ></div>
    </div>
  );
};

// Helper function to get emoji based on animal type
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

export default IslandView; 