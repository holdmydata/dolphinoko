declare module 'framer-motion' {
  import * as React from 'react';

  // Basic motion component type
  export interface MotionProps {
    initial?: any;
    animate?: any;
    exit?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
    whileDrag?: any;
    whileInView?: any;
    variants?: any;
    style?: React.CSSProperties;
    className?: string;
    [key: string]: any;
  }

  // AnimatePresence component
  export const AnimatePresence: React.FC<{
    children?: React.ReactNode;
    exitBeforeEnter?: boolean;
    initial?: boolean;
    onExitComplete?: () => void;
  }>;

  // Create a type for all DOM elements
  type HTMLMotionComponents = {
    [K in keyof JSX.IntrinsicElements]: React.ForwardRefExoticComponent<
      MotionProps & JSX.IntrinsicElements[K] & React.RefAttributes<Element>
    >;
  };

  // Export the motion namespace containing all DOM element components
  export const motion: HTMLMotionComponents;

  // Animation controls
  export function useAnimation(): {
    start: (animation: any, options?: any) => Promise<any>;
    stop: () => void;
    set: (values: any) => void;
  };

  // Variants
  export function useMotionValue(initialValue: number): {
    get: () => number;
    set: (value: number) => void;
    onChange: (callback: (value: number) => void) => () => void;
  };

  export function useTransform<T>(
    value: { get: () => number },
    inputRange: number[],
    outputRange: T[],
    options?: { clamp?: boolean }
  ): { get: () => T };

  export function useSpring(
    value: { get: () => number },
    config?: { stiffness?: number; damping?: number; mass?: number }
  ): { get: () => number };

  export function useCycle<T>(...items: T[]): [T, (next?: number) => void];
} 