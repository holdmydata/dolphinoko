/**
 * API client utility for making requests to the backend
 */

// API base URL - configurable from environment
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Error class for API errors
class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface Message {
  id: string;
  content: string;
  role: string;
  timestamp: Date;
  tool_id?: string;
  metadata?: any;
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  messages: Message[];
}

export interface MessageCreate {
  content: string;
  role: string;
  tool_id?: string;
  metadata?: any;
}

// Conversation API functions
export const conversations = {
  // Create a new conversation
  create: (): Promise<Conversation> => 
    api.post<Conversation>('/api/conversations', {}),
  
  // Get a conversation by ID
  get: (id: string): Promise<Conversation> => 
    api.get<Conversation>(`/api/conversations/${id}`),
  
  // Add a message to a conversation
  addMessage: (conversationId: string, message: MessageCreate): Promise<Message> => 
    api.post<Message>(`/api/conversations/${conversationId}/messages`, message),
};

// Generic request handler
async function request<T>(
  endpoint: string, 
  method: string = 'GET', 
  data?: any
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication if needed
  };

  // Add body for non-GET requests
  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    
    // Parse JSON response
    const responseData = await response.json();
    
    // Handle error responses
    if (!response.ok) {
      throw new ApiError(
        responseData.detail || 'An error occurred', 
        response.status,
        responseData
      );
    }
    
    return responseData as T;
  } catch (error) {
    // Re-throw ApiError or wrap generic errors
    if (error instanceof ApiError) {
      throw error;
    }
    
    console.error('API request failed:', error);
    throw new ApiError(
      error instanceof Error ? error.message : 'Network error',
      500
    );
  }
}

// API client with typed methods
export const api = {
    // GET request with generic type
    get: <T>(endpoint: string): Promise<T> => 
      request<T>(endpoint, 'GET'),
    
    // POST request with generic type
    post: <T>(endpoint: string, data: any): Promise<T> => 
      request<T>(endpoint, 'POST', data),
    
    // PUT request with generic type
    put: <T>(endpoint: string, data: any): Promise<T> => 
      request<T>(endpoint, 'PUT', data),
    
    // DELETE request with generic type
    delete: <T>(endpoint: string): Promise<T> => 
      request<T>(endpoint, 'DELETE'),
  };

// Simple hooks for common API patterns
export const useApi = () => {
  const handleApiError = (error: unknown) => {
    if (error instanceof ApiError) {
      // Handle specific error codes
      switch (error.status) {
        case 401:
          console.error('Authentication error:', error.message);
          // Handle unauthorized (e.g., redirect to login)
          break;
        case 403:
          console.error('Forbidden:', error.message);
          // Handle forbidden
          break;
        case 404:
          console.error('Not found:', error.message);
          // Handle not found
          break;
        default:
          console.error(`API Error (${error.status}):`, error.message);
      }
      return error;
    }
    
    // Generic error handling
    console.error('Unexpected error:', error);
    return new ApiError('An unexpected error occurred', 500);
  };

  return {
    handleApiError,
  };
};


