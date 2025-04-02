/**
 * Pixel Art Sprite Generator Utility
 * 
 * This utility generates simple placeholder sprite sheets for different character types
 * until we have proper artist-created pixel art. It creates colored character silhouettes
 * with basic animations.
 */

// Canvas for generating sprites
let canvas: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;

// Initialize canvas once
const initCanvas = () => {
  if (!canvas) {
    canvas = document.createElement('canvas');
    canvas.width = 128; // 4 frames x 32px
    canvas.height = 128; // 4 directions x 32px
    ctx = canvas.getContext('2d');
  }
  return ctx;
};

// Character types with their distinct features
const characterTypes = {
  farmer: { color: '#FF7777', hat: true, tool: 'hoe' },
  shopkeeper: { color: '#77AAFF', hat: true, tool: 'bag' },
  gardener: { color: '#FFAA77', hat: true, tool: 'watering' },
  fisherman: { color: '#BB77FF', hat: true, tool: 'rod' },
  rancher: { color: '#FF9944', hat: false, tool: 'brush' },
  miner: { color: '#AA8866', hat: true, tool: 'pickaxe' },
  cook: { color: '#EEEEEE', hat: true, tool: 'pan' },
  carpenter: { color: '#AABBCC', hat: true, tool: 'hammer' },
};

type CharacterType = keyof typeof characterTypes;

/**
 * Generates a simple character sprite and returns a data URL
 * @param type Character type from character types object
 * @returns Data URL for the sprite sheet
 */
export const generateCharacterSprite = (type: CharacterType): string => {
  const context = initCanvas();
  if (!context || !canvas) return '';

  const character = characterTypes[type];
  
  // Clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw walking animation frames (down, left, right, up)
  for (let direction = 0; direction < 4; direction++) {
    for (let frame = 0; frame < 4; frame++) {
      const x = frame * 32;
      const y = direction * 32;
      
      // Draw base character (different for each direction)
      drawCharacterBase(context, x, y, character.color, direction, frame);
      
      // Draw hat if the character has one
      if (character.hat) {
        drawHat(context, x, y, character.color, direction);
      }
      
      // Draw character-specific tool
      drawTool(context, x, y, character.tool, direction, frame);
    }
  }
  
  return canvas.toDataURL('image/png');
};

/**
 * Draw the base character
 */
const drawCharacterBase = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  color: string, 
  direction: number, 
  frame: number
) => {
  // Save context
  ctx.save();
  
  // Base color
  ctx.fillStyle = color;
  
  // Body bounce based on frame
  const bounce = frame % 2 === 0 ? 0 : 1;
  
  // Head (common to all directions)
  ctx.fillRect(x + 12, y + 8, 8, 8);
  ctx.fillStyle = '#000000';
  ctx.fillRect(x + 14, y + 10, 2, 2); // left eye
  ctx.fillRect(x + 18, y + 10, 2, 2); // right eye
  
  // Restore the main color
  ctx.fillStyle = color;
  
  // Different body shapes based on direction
  if (direction === 0) { // down
    // Body
    ctx.fillRect(x + 10, y + 16 - bounce, 12, 10);
    // Legs
    ctx.fillRect(x + 10, y + 26 - bounce, 4, 4);
    ctx.fillRect(x + 18, y + 26 - bounce, 4, 4);
    // Arms
    ctx.fillRect(x + 8, y + 18 - bounce, 4, 6);
    ctx.fillRect(x + 20, y + 18 - bounce, 4, 6);
  } else if (direction === 1) { // left
    // Body
    ctx.fillRect(x + 10, y + 16 - bounce, 10, 10);
    // Legs
    ctx.fillRect(x + 10, y + 26 - bounce, 4, 4);
    ctx.fillRect(x + 16, y + 26 - bounce, 4, 4);
    // Arm (only one visible from side)
    ctx.fillRect(x + 8, y + 18 - bounce, 4, 6);
  } else if (direction === 2) { // right
    // Body
    ctx.fillRect(x + 12, y + 16 - bounce, 10, 10);
    // Legs
    ctx.fillRect(x + 12, y + 26 - bounce, 4, 4);
    ctx.fillRect(x + 18, y + 26 - bounce, 4, 4);
    // Arm (only one visible from side)
    ctx.fillRect(x + 20, y + 18 - bounce, 4, 6);
  } else { // up
    // Body
    ctx.fillRect(x + 10, y + 16 - bounce, 12, 10);
    // Legs
    ctx.fillRect(x + 10, y + 26 - bounce, 4, 4);
    ctx.fillRect(x + 18, y + 26 - bounce, 4, 4);
    // Arms
    ctx.fillRect(x + 8, y + 18 - bounce, 4, 6);
    ctx.fillRect(x + 20, y + 18 - bounce, 4, 6);
  }
  
  ctx.restore();
};

/**
 * Draw character hat
 */
const drawHat = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  color: string, 
  direction: number
) => {
  ctx.save();
  
  // Darker shade for hat
  const colorParts = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  if (colorParts) {
    const r = parseInt(colorParts[1], 16);
    const g = parseInt(colorParts[2], 16);
    const b = parseInt(colorParts[3], 16);
    ctx.fillStyle = `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
  } else {
    ctx.fillStyle = '#885544'; // Default hat color
  }
  
  if (direction === 0) { // down
    ctx.fillRect(x + 10, y + 6, 12, 3);
    ctx.fillRect(x + 12, y + 3, 8, 3);
  } else if (direction === 1) { // left
    ctx.fillRect(x + 10, y + 6, 10, 3);
    ctx.fillRect(x + 12, y + 3, 6, 3);
  } else if (direction === 2) { // right
    ctx.fillRect(x + 12, y + 6, 10, 3);
    ctx.fillRect(x + 14, y + 3, 6, 3);
  } else { // up
    ctx.fillRect(x + 10, y + 6, 12, 3);
    ctx.fillRect(x + 12, y + 3, 8, 3);
  }
  
  ctx.restore();
};

/**
 * Draw character tool
 */
const drawTool = (
  ctx: CanvasRenderingContext2D, 
  x: number, 
  y: number, 
  tool: string, 
  direction: number, 
  frame: number
) => {
  ctx.save();
  
  // Tool properties
  ctx.fillStyle = '#8B4513'; // Brown tool handles
  
  const toolSwing = frame % 4; // Tool animation
  
  // Draw different tools based on character and direction
  if (direction === 0) { // down
    if (tool === 'hoe' || tool === 'pickaxe') {
      ctx.fillRect(x + 20, y + 20, 2, 8); // Handle
      ctx.fillStyle = '#AAA';
      ctx.fillRect(x + 18, y + 28, 6, 2); // Blade
    } else if (tool === 'rod') {
      ctx.fillRect(x + 20, y + 20, 2, 10); // Rod
      ctx.fillStyle = '#0077AA';
      ctx.fillRect(x + 20, y + 30, 2, 2); // Line
    }
  } else if (direction === 1) { // left
    if (tool === 'hammer') {
      ctx.fillRect(x + 4, y + 18, 8, 2); // Handle
      ctx.fillStyle = '#AAA';
      ctx.fillRect(x + 2, y + 16, 4, 6); // Head
    } else if (tool === 'watering') {
      ctx.fillRect(x + 4, y + 18, 6, 2); // Handle
      ctx.fillStyle = '#33AAFF';
      ctx.fillRect(x + 2, y + 16, 4, 6); // Water can
    }
  }
  
  // Add more tool drawing logic based on your needs
  
  ctx.restore();
};

/**
 * Generates all character sprites and returns them as an object with data URLs
 */
export const generateAllSprites = (): Record<CharacterType, string> => {
  return {
    farmer: generateCharacterSprite('farmer'),
    shopkeeper: generateCharacterSprite('shopkeeper'),
    gardener: generateCharacterSprite('gardener'),
    fisherman: generateCharacterSprite('fisherman'),
    rancher: generateCharacterSprite('rancher'),
    miner: generateCharacterSprite('miner'),
    cook: generateCharacterSprite('cook'),
    carpenter: generateCharacterSprite('carpenter'),
  };
};

// Preload sprites when module is imported
let sprites: Record<string, string> = {};

// Function to preload sprites in browser environment
export const preloadSprites = (): void => {
  if (typeof window !== 'undefined') {
    sprites = generateAllSprites();
  }
};

// Get a specific sprite
export const getSprite = (type: CharacterType): string => {
  if (Object.keys(sprites).length === 0) {
    preloadSprites();
  }
  return sprites[type] || '';
}; 