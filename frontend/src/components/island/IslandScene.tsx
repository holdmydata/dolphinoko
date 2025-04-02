import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useTexture } from '@react-three/drei';
import * as THREE from 'three';

// Island component that represents the main island
function Island() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Simple animation
  useFrame((state) => {
    if (meshRef.current) {
      const mesh = meshRef.current as any; // Type assertion to fix TypeScript error
      mesh.rotation.y = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.05;
    }
  });

  return (
    <mesh ref={meshRef} position={[0, -1, 0]}>
      <cylinderGeometry args={[5, 6, 1, 32]} />
      <meshStandardMaterial color="#8fbc8f" roughness={0.8} />
    </mesh>
  );
}

// Water component that surrounds the island
function Water() {
  const waterRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (waterRef.current) {
      const mesh = waterRef.current as any; // Type assertion to fix TypeScript error
      // Gentle wave motion
      mesh.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.3) * 0.02;
    }
  });

  return (
    <mesh ref={waterRef} position={[0, -1.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[15, 36]} />
      <meshStandardMaterial 
        color="#4a9be8" 
        transparent
        opacity={0.7}
        roughness={0.1}
        metalness={0.3}
      />
    </mesh>
  );
}

// Palm tree component
function PalmTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Tree trunk */}
      <mesh position={[0, 0.5, 0]} rotation={[0, 0, 0.2]}>
        <cylinderGeometry args={[0.2, 0.3, 2, 8]} />
        <meshStandardMaterial color="#8b4513" roughness={0.8} />
      </mesh>
      
      {/* Palm leaves */}
      <group position={[0, 1.5, 0]}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <mesh key={i} position={[0, 0, 0]} rotation={[0.3, (i * Math.PI) / 3, 0]}>
            <boxGeometry args={[0.1, 0.05, 1.2]} />
            <meshStandardMaterial color="#228b22" />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// Cherry blossom tree for Japanese aesthetic
function CherryBlossomTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Tree trunk */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.15, 0.2, 1.8, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.7} />
      </mesh>
      
      {/* Blossom crown */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.8, 16, 16]} />
        <meshStandardMaterial color="#FFD1DC" roughness={0.6} />
      </mesh>
      
      {/* Small falling petals */}
      {[...Array(5)].map((_, i) => (
        <mesh key={i} position={[
          Math.sin(i * 1.2) * 0.8, 
          1.5 - Math.random() * 0.5, 
          Math.cos(i * 1.2) * 0.8
        ]}>
          <boxGeometry args={[0.1, 0.02, 0.1]} />
          <meshStandardMaterial color="#FFAEC9" />
        </mesh>
      ))}
    </group>
  );
}

// Character component that represents a tool
function Character({ position, color, toolId, onClick }: { 
  position: [number, number, number], 
  color: string,
  toolId?: string,
  onClick?: (toolId: string) => void 
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  
  // Determine which animal type based on the first character of the toolId (or color)
  const animalType = toolId ? (
    toolId.charCodeAt(0) % 4 // 4 different animal types for variety
  ) : (
    color.charCodeAt(1) % 4
  );
  
  useFrame((state) => {
    if (groupRef.current) {
      const group = groupRef.current as any; // Type assertion to fix TypeScript error
      // Gentle bobbing motion
      group.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
      
      // Rotate when hovered
      if (hovered) {
        group.rotation.y += 0.02;
      }
    }
  });
  
  const handleClick = () => {
    if (toolId && onClick) {
      onClick(toolId);
    }
  };
  
  return (
    <group 
      ref={groupRef} 
      position={position}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? 1.2 : 1}
    >
      {/* Body - different shape based on animal type */}
      {animalType === 0 && (
        // Cat-like
        <>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial 
              color={color} 
              emissive={hovered ? color : undefined}
              emissiveIntensity={hovered ? 0.5 : 0}
            />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial 
              color={color}
              emissive={hovered ? color : undefined}
              emissiveIntensity={hovered ? 0.5 : 0}
            />
          </mesh>
          {/* Ears */}
          <mesh position={[-0.2, 1.4, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0.2, 1.4, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </>
      )}
      
      {animalType === 1 && (
        // Dog-like
        <>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial 
              color={color} 
              emissive={hovered ? color : undefined}
              emissiveIntensity={hovered ? 0.5 : 0}
            />
          </mesh>
          <mesh position={[0, 1.1, 0.2]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial 
              color={color}
              emissive={hovered ? color : undefined}
              emissiveIntensity={hovered ? 0.5 : 0}
            />
          </mesh>
          {/* Snout */}
          <mesh position={[0, 1, 0.5]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </>
      )}
      
      {animalType === 2 && (
        // Bird-like
        <>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial 
              color={color} 
              emissive={hovered ? color : undefined}
              emissiveIntensity={hovered ? 0.5 : 0}
            />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial 
              color={color}
              emissive={hovered ? color : undefined}
              emissiveIntensity={hovered ? 0.5 : 0}
            />
          </mesh>
          {/* Beak */}
          <mesh position={[0, 1, 0.3]}>
            <cylinderGeometry args={[0.05, 0.1, 0.3, 8]} />
            <meshStandardMaterial color="#FF9900" />
          </mesh>
          {/* Wings */}
          <mesh position={[-0.4, 0.5, 0]} rotation={[0, 0, -0.5]}>
            <boxGeometry args={[0.1, 0.5, 0.3]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0.4, 0.5, 0]} rotation={[0, 0, 0.5]}>
            <boxGeometry args={[0.1, 0.5, 0.3]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </>
      )}
      
      {animalType === 3 && (
        // Rabbit-like
        <>
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[0.4, 16, 16]} />
            <meshStandardMaterial 
              color={color} 
              emissive={hovered ? color : undefined}
              emissiveIntensity={hovered ? 0.5 : 0}
            />
          </mesh>
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.3, 16, 16]} />
            <meshStandardMaterial 
              color={color}
              emissive={hovered ? color : undefined}
              emissiveIntensity={hovered ? 0.5 : 0}
            />
          </mesh>
          {/* Long ears */}
          <mesh position={[-0.15, 1.6, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
          <mesh position={[0.15, 1.6, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.6, 8]} />
            <meshStandardMaterial color={color} />
          </mesh>
        </>
      )}
      
      {/* Eyes for all animal types */}
      <mesh position={[-0.15, 1.25, 0.25]} scale={0.7}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.15, 1.25, 0.25]} scale={0.7}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.15, 1.25, 0.29]} scale={0.7}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="black" />
      </mesh>
      <mesh position={[0.15, 1.25, 0.29]} scale={0.7}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="black" />
      </mesh>
      
      {/* Anime style - add blush marks or small sparkle near the eyes */}
      <mesh position={[-0.25, 1.15, 0.3]} scale={0.7}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#FF9999" opacity={0.7} transparent />
      </mesh>
      <mesh position={[0.25, 1.15, 0.3]} scale={0.7}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#FF9999" opacity={0.7} transparent />
      </mesh>
      
      {/* Add a tiny sparkle */}
      {hovered && (
        <mesh position={[0.25, 1.4, 0.2]} scale={0.5}>
          <octahedronGeometry args={[0.1, 0]} />
          <meshStandardMaterial color="white" emissive="white" emissiveIntensity={1} />
        </mesh>
      )}
    </group>
  );
}

// Kawaii-style clouds
function KawaiiCloud({ position }: { position: [number, number, number] }) {
  const cloudRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (cloudRef.current) {
      const group = cloudRef.current as any;
      // Gentle floating motion
      group.position.x = position[0] + Math.sin(state.clock.getElapsedTime() * 0.2 + position[1]) * 0.3;
    }
  });

  return (
    <group ref={cloudRef} position={position}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.7, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.6, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.6, 0, 0]}>
        <sphereGeometry args={[0.5, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[0.3, 0.3, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
      <mesh position={[-0.3, 0.3, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color="white" />
      </mesh>
    </group>
  );
}

interface IslandSceneProps {
  className?: string;
  characterPositions?: Array<{
    position: [number, number, number];
    color: string;
    toolId?: string;
  }>;
  onCharacterClick?: (toolId: string) => void;
}

const IslandScene: React.FC<IslandSceneProps> = ({
  className = "",
  characterPositions = [
    { position: [2, 0, 1], color: "#FF6347" },
    { position: [-2, 0, 1], color: "#4682B4" },
    { position: [0, 0, 2], color: "#9370DB" },
  ],
  onCharacterClick,
}) => {
  return (
    <div className={`w-full h-full ${className}`}>
      <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.8} />
        <directionalLight position={[0, 10, 5]} intensity={0.5} castShadow />
        
        {/* Enhanced scene with anime-style elements */}
        <Island />
        <Water />
        
        {/* Add palm trees */}
        <PalmTree position={[3, -0.5, 0]} />
        <PalmTree position={[-3, -0.5, 1]} />
        <PalmTree position={[0, -0.5, -3]} />
        
        {/* Add cherry blossom trees for Japanese aesthetic */}
        <CherryBlossomTree position={[2.5, -0.5, 2]} />
        <CherryBlossomTree position={[-2.5, -0.5, -1.5]} />
        
        {/* Add kawaii clouds */}
        <KawaiiCloud position={[5, 4, -3]} />
        <KawaiiCloud position={[-4, 3.5, -2]} />
        <KawaiiCloud position={[0, 4.5, -5]} />
        
        {/* Add characters */}
        {characterPositions.map((char, index) => (
          <Character 
            key={index} 
            position={char.position} 
            color={char.color} 
            toolId={char.toolId}
            onClick={onCharacterClick}
          />
        ))}
        
        <OrbitControls 
          enablePan={false} 
          maxPolarAngle={Math.PI / 2.2}
          minPolarAngle={Math.PI / 6}
          maxDistance={15}
          minDistance={5}
        />
      </Canvas>
    </div>
  );
};

export default IslandScene; 