/**
 * A utility for slightly more secure storage of sensitive information
 * Note: This is still client-side storage and not fully secure
 */

// Basic encryption/decryption for localStorage values
// This provides minimal obfuscation but isn't truly secure
const encryptValue = (value: string): string => {
    return btoa(value); // Simple base64 encoding
  };
  
  const decryptValue = (encryptedValue: string): string => {
    try {
      return atob(encryptedValue); // Simple base64 decoding
    } catch (e) {
      return ''; // Return empty string if decoding fails
    }
  };
  
  export const secureStorage = {
    // Store a sensitive value with minimal encryption
    setItem: (key: string, value: string): void => {
      const encryptedValue = encryptValue(value);
      localStorage.setItem(key, encryptedValue);
    },
  
    // Get and decrypt a sensitive value
    getItem: (key: string): string => {
      const encryptedValue = localStorage.getItem(key);
      if (!encryptedValue) return '';
      return decryptValue(encryptedValue);
    },
  
    // Remove a sensitive value
    removeItem: (key: string): void => {
      localStorage.removeItem(key);
    }
  };