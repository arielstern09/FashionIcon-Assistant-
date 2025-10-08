import React from 'react';
import Popup from './components/Popup.jsx'; 

// --- Configuration ---
// Set to 'true' to bypass the CORS-blocked remote API and use local mock data.
// Set to 'false' to attempt connection to the real API (requires a CORS-compliant server).
const IS_DEV_MODE = true; 

// Define the common API root URL (Only used if IS_DEV_MODE is false)
const API_ROOT = 'http://184.72.12.106:8080/v1';

// Utility function to generate a standard session structure
const createSessionPayload = () => ({
  group_id: "fashion-shopping-group", 
  agent_id: ["chrome-extension-ai"], 
  // In a real app, this should be the authenticated user's ID
  user_id: ["current-shopper-id"], 
  session_id: crypto.randomUUID(), 
});
// ---------------------


/**
 * The main application wrapper component. It houses global logic and API calls.
 */
function App() {
  
  /**
   * Posts a sample memory object containing user input to the memories endpoint.
   * @param {string} content The main content/episode (e.g., the user's AI prompt) to record.
   * @returns {object} An object indicating success status and result data or error message.
   */
  const postMemory = async (content) => {
    // --- MOCK API RESPONSE (DEV MODE) ---
    if (IS_DEV_MODE) {
      console.log(`[MOCK API] Simulating successful post memory for: "${content}"`);
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 50)); 
      return { success: true, data: { status: "MOCK_OK", content_logged: content } };
    }
    // -------------------------------------
    
    const payload = {
      session: createSessionPayload(),
      producer: "chrome-extension-popup",
      produced_for: "AI_Fashion_System",
      episode_content: content, 
      episode_type: "user_query_fashion",
      metadata: {},
    };

    try {
      const response = await fetch(`${API_ROOT}/memories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Memory POST failed: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };

    } catch (error) {
      console.error('Failed to post memory:', error);
      return { success: false, error: error.message };
    }
  };

  /**
   * Queries the memory system for previous interactions related to the user's current query.
   * @param {string} query The search string (user's input).
   * @returns {Array<object>} An array of memory objects found.
   */
  const searchMemory = async (query) => {
    // --- MOCK API RESPONSE (DEV MODE) ---
    if (IS_DEV_MODE) {
      console.log(`[MOCK API] Simulating successful search for: "${query}"`);
      // Return mock memory objects to test the context logic in Popup.jsx
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100)); 
      return [{ 
        episode_content: "I am looking for a size M sweater, preferably wool, light gray color. I usually wear a 40 Regular jacket.", 
        timestamp: Date.now() 
      }, { 
        episode_content: "I asked about the difference between slim-fit and relaxed-fit jeans for a 32-inch waist.", 
        timestamp: Date.now() - 3600000 
      }];
    }
    // -------------------------------------
    
    const payload = {
      session: createSessionPayload(),
      query: query,
      filter: {}, // You can add filters later
      limit: 5 
    };

    try {
      const response = await fetch(`${API_ROOT}/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Search POST failed: ${response.status}`);
      }

      const result = await response.json();
      // Assuming the API returns a list of relevant memory documents
      return result.memories || []; 

    } catch (error) {
      console.error('Failed to search memory:', error);
      return []; // Return an empty array on failure
    }
  };


  // Pass both postMemory and the new searchMemory function down to the Popup component
  return (
    <div className="App">
      <Popup postMemory={postMemory} searchMemory={searchMemory} />
    </div>
  );
}

export default App;