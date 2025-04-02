/// <reference types="react" />

declare namespace JSX {
  interface IntrinsicElements {
    mesh: any;
    group: any;
    pointLight: any;
    ambientLight: any;
    sphereGeometry: any;
    boxGeometry: any;
    cylinderGeometry: any;
    circleGeometry: any;
    meshStandardMaterial: any;
    directionalLight: any;
  }
}

declare module '@react-three/fiber' {
  export type Canvas = React.FC<any>;
  export const Canvas: Canvas;
  export function useFrame(callback: (state: any) => void): void;
}

declare module '@react-three/drei' {
  export const OrbitControls: React.FC<any>;
  export function useTexture(url: string): any;
}

declare module 'three' {
  export class Mesh {}
  export class Group {}
  export class Clock {
    getElapsedTime(): number;
  }
} 