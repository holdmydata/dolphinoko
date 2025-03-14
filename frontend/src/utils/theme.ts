// Theme style tokens for consistent styling across the application
export const styles = {
    // Background colors
    bg: {
      primary: 'bg-white dark:bg-gray-900',
      secondary: 'bg-gray-50 dark:bg-gray-800',
      tertiary: 'bg-gray-100 dark:bg-gray-700',
      accent: 'bg-blue-50 dark:bg-blue-900/30',
      danger: 'bg-red-50 dark:bg-red-900/30',
      success: 'bg-green-50 dark:bg-green-900/30',
      warning: 'bg-yellow-50 dark:bg-yellow-900/30',
    },
    
    // Text colors
    text: {
      primary: 'text-gray-900 dark:text-white',
      secondary: 'text-gray-700 dark:text-gray-300',
      tertiary: 'text-gray-500 dark:text-gray-400',
      accent: 'text-blue-700 dark:text-blue-300',
      danger: 'text-red-600 dark:text-red-400',
      success: 'text-green-600 dark:text-green-400',
      warning: 'text-yellow-600 dark:text-yellow-400',
    },
    
    // Border colors
    border: {
      primary: 'border-gray-200 dark:border-gray-700',
      secondary: 'border-gray-300 dark:border-gray-600',
      accent: 'border-blue-500 dark:border-blue-600',
      danger: 'border-red-300 dark:border-red-700',
      success: 'border-green-300 dark:border-green-700',
      warning: 'border-yellow-300 dark:border-yellow-700',
    },
    
    // Form elements
    form: {
      input: 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 rounded-md shadow-sm',
      label: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1',
      helperText: 'mt-1 text-sm text-gray-500 dark:text-gray-400',
      error: 'mt-1 text-sm text-red-600 dark:text-red-400',
    },
    
    // Buttons
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900',
      secondary: 'bg-gray-600 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-800 text-white focus:ring-gray-500',
      outline: 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 focus:ring-blue-500',
      danger: 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-white focus:ring-red-500',
      success: 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white focus:ring-green-500',
      ghost: 'bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-gray-500',
      disabled: 'opacity-60 cursor-not-allowed',
    },
    
    // Common UI elements
    card: {
      container: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md overflow-hidden',
      header: 'px-6 py-4 border-b border-gray-200 dark:border-gray-700',
      body: 'p-6',
      footer: 'px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700',
    },
    
    // Badges
    badge: {
      default: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      primary: 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300',
      success: 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300',
      warning: 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-300',
      danger: 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300',
      info: 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-300',
    },
  };
  
  // Helper function for conditional class merging
  export function cx(...classes: (string | boolean | undefined)[]) {
    return classes.filter(Boolean).join(' ');
  }