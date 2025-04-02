// Theme style tokens for consistent styling across the application
export const styles = {
    // Background colors
    bg: {
      primary: 'bg-white bg-opacity-90',
      secondary: 'bg-farm-earth-light bg-opacity-50',
      tertiary: 'bg-farm-earth-light bg-opacity-80',
      accent: 'bg-farm-green-light bg-opacity-60',
      danger: 'bg-farm-orange bg-opacity-20',
      success: 'bg-farm-green-light bg-opacity-30',
      warning: 'bg-farm-orange bg-opacity-20',
    },
    
    // Text colors
    text: {
      primary: 'text-farm-brown-dark',
      secondary: 'text-farm-brown',
      tertiary: 'text-farm-brown-dark/70',
      accent: 'text-farm-green',
      danger: 'text-farm-orange',
      success: 'text-farm-green-dark',
      warning: 'text-farm-orange',
    },
    
    // Border colors
    border: {
      primary: 'border-farm-brown/20',
      secondary: 'border-farm-brown/30',
      accent: 'border-farm-green',
      danger: 'border-farm-orange/50',
      success: 'border-farm-green/50',
      warning: 'border-farm-orange/30',
    },
    
    // Form elements
    form: {
      input: 'bg-white bg-opacity-90 border border-farm-brown/20 focus:ring-2 focus:ring-farm-green focus:border-farm-green text-farm-brown-dark rounded-md shadow-sm',
      label: 'block text-sm font-medium text-farm-brown mb-1',
      helperText: 'mt-1 text-sm text-farm-brown/70',
      error: 'mt-1 text-sm text-farm-orange',
    },
    
    // Buttons
    button: {
      primary: 'bg-farm-green hover:bg-farm-green-dark text-white focus:ring-2 focus:ring-farm-green focus:ring-offset-2',
      secondary: 'bg-farm-brown hover:bg-farm-brown-dark text-white focus:ring-farm-brown',
      outline: 'border border-farm-brown/20 bg-white hover:bg-farm-earth-light/30 text-farm-brown focus:ring-farm-green',
      danger: 'bg-farm-orange hover:bg-farm-orange/80 text-white focus:ring-farm-orange',
      success: 'bg-farm-green hover:bg-farm-green-dark text-white focus:ring-farm-green',
      ghost: 'bg-transparent hover:bg-farm-earth-light/30 text-farm-brown focus:ring-farm-earth',
      disabled: 'opacity-60 cursor-not-allowed',
    },
    
    // Common UI elements
    card: {
      container: 'bg-white border border-farm-brown/20 rounded-lg shadow-md overflow-hidden',
      header: 'px-6 py-4 border-b border-farm-brown/20 bg-farm-earth-light/50',
      body: 'p-6',
      footer: 'px-6 py-4 bg-farm-earth-light/30 border-t border-farm-brown/20',
    },
    
    // Badges
    badge: {
      default: 'bg-farm-earth-light/50 text-farm-brown',
      primary: 'bg-farm-green-light/50 text-farm-green-dark',
      success: 'bg-farm-green-light/70 text-farm-green-dark',
      warning: 'bg-farm-orange/20 text-farm-orange',
      danger: 'bg-farm-orange/30 text-farm-orange',
      info: 'bg-farm-blue-light/50 text-farm-blue-dark',
    },
  };
  
  // Helper function for conditional class merging
  export function cx(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
  }