// frontend/src/utils/toolMonitoringStorage.ts
import { ToolExecutionEvent } from '../components/tools/ToolMonitor';

const STORAGE_KEY = 'tool_execution_events';

// Get events from storage
export const getStoredEvents = (): ToolExecutionEvent[] => {
  try {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (!storedData) return [];
    
    const parsedData = JSON.parse(storedData);
    
    // Convert string dates back to Date objects
    return parsedData.map((event: any) => ({
      ...event,
      startTime: new Date(event.startTime),
      endTime: event.endTime ? new Date(event.endTime) : undefined
    }));
  } catch (err) {
    console.error('Error retrieving tool execution events:', err);
    return [];
  }
};

// Save events to storage
export const storeEvents = (events: ToolExecutionEvent[]): boolean => {
  try {
    // Limit storage to the most recent 100 events to prevent localStorage overflow
    const eventsToStore = events.slice(0, 100);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(eventsToStore));
    return true;
  } catch (err) {
    console.error('Error storing tool execution events:', err);
    return false;
  }
};

// Add a single event to storage
export const addStoredEvent = (event: ToolExecutionEvent): boolean => {
  try {
    const currentEvents = getStoredEvents();
    return storeEvents([event, ...currentEvents]);
  } catch (err) {
    console.error('Error adding tool execution event:', err);
    return false;
  }
};

// Clear all stored events
export const clearStoredEvents = (): boolean => {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (err) {
    console.error('Error clearing tool execution events:', err);
    return false;
  }
};