import React from 'react';
import Popup from './components/Popup.jsx'; 

// Define the API URL for clarity
const MEMORY_API_URL = 'http://184.72.12.106:8080/v1/memories';

/**
 * The main application wrapper component. It can now house global logic, 
 * such as API functions, and pass them down to child components.
 */
function App() {
  
  /**
   * Posts a sample memory object containing user input to the external API endpoint.
   * This function uses the JSON structure you provided.
   * @param {string} content The main content/episode (e.g., the user's AI prompt) to record.
   * @returns {object} An object indicating success status and result data or error message.
   */
  const postMemory = async (content) => {
    // Construct the data structure provided by the user
    const payload = {
      session: {
        group_id: "default-extension-group", 
        agent_id: ["chrome-extension-ai"], 
        user_id: ["current-user-id"], // This should be replaced with actual user identification logic
        session_id: crypto.randomUUID(), // Unique ID for this session/request
      },
      producer: "chrome-extension-popup",
      produced_for: "AI_System",
      episode_content: content, // The actual content being logged
      episode_type: "user_query",
      metadata: {
        // Additional metadata fields can go here
      },
    };

    console.log('Attempting to post memory:', payload);

    try {
      const response = await fetch(MEMORY_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Memory posted successfully:', result);
      return { success: true, data: result };

    } catch (error) {
      console.error('Failed to post memory:', error);
      return { success: false, error: error.message };
    }
  };

  // Pass the postMemory function down to the Popup component as a prop
  return (
    <div className="App">
      {/* The main UI for the extension is rendered here */}
      <Popup postMemory={postMemory} />
    </div>
  );
}

export default App;