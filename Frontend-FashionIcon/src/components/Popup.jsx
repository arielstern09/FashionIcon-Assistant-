import React, { useState } from 'react';

/**
 * The main component for the Chrome extension popup UI.
 * It handles user input and orchestrates memory logging and retrieval.
 * @param {object} props 
 * @param {function} props.postMemory - Function to log the current interaction.
 * @param {function} props.searchMemory - Function to retrieve relevant past interactions.
 */
const Popup = ({ postMemory, searchMemory }) => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('AI response will appear here.');
  const [isLoading, setIsLoading] = useState(false);
  const [isMemoryPosting, setIsMemoryPosting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  /**
   * Composes a specialized prompt for the AI, integrating retrieved context.
   * This logic instructs the AI to act as a fashion expert.
   * @param {string} userQuery - The user's direct question.
   * @param {Array<object>} memories - List of relevant past memory objects.
   * @returns {string} The final prompt to send to the AI model.
   */
  const composeSpecializedPrompt = (userQuery, memories) => {
    let context = '';
    
    // Check if there are any memories to include in the prompt
    if (memories && memories.length > 0) {
      const memoryText = memories
        // We assume the episode_content field holds the text we need for context
        .map(m => `- ${m.episode_content}`) 
        .join('\n');
      
      context = `
        --- RELEVANT SHOPPING HISTORY/CONTEXT ---
        The user's previous related interactions and preferences:
        ${memoryText}
        --- END CONTEXT ---
      `;
    }

    const systemInstruction = `
      You are a world-class, helpful Fashion Shopping Assistant. Your responses must be concise, accurate, 
      and highly focused on **style, fit, and sizing** advice for the user's shopping needs. 
      Always consider the user's previous context (if provided in the CONTEXT block).
      
      Examples of expertise: size recommendations based on weight/height, outfit pairings, and trend analysis.

      Address the user's query directly using the context provided below.
    `;

    // The final prompt package sent to the Service Worker
    return `${systemInstruction}\n${context}\nUSER QUERY: ${userQuery}`;
  };

  /**
   * Executes the full AI workflow: Search -> Query -> Log.
   */
  const handleSubmit = async () => {
    const userPrompt = prompt.trim();
    if (!userPrompt || isLoading || isMemoryPosting || isSearching) return;

    // Start all loading states
    setIsLoading(true);
    setIsSearching(true);
    setResult('Searching history and preparing specialized prompt...');

    let memories = [];
    
    // 1. --- RETRIEVE MEMORY (Search) ---
    try {
      memories = await searchMemory(userPrompt);
    } catch (e) {
      console.error("Memory search failed:", e);
    } finally {
      setIsSearching(false);
    }
    
    // 2. --- COMPOSE FINAL PROMPT ---
    const finalPrompt = composeSpecializedPrompt(userPrompt, memories);
    setResult('Context gathered. Sending to AI...');

    // 3. --- LOG THE MEMORY (Post) ---
    // Log the *original* user input to the database for future retrieval, running independently
    setIsMemoryPosting(true);
    postMemory(userPrompt)
      .then(logResponse => {
        if (!logResponse.success) {
          console.warn("Memory logging failed.");
        }
      })
      .finally(() => {
        setIsMemoryPosting(false);
      });
    // ------------------------------------

    // 4. --- QUERY THE AI SERVICE WORKER / FALLBACK ---
    // Check if the Chrome runtime API is available (it is not in local dev mode)
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
        chrome.runtime.sendMessage({ action: "queryAI", data: finalPrompt }, (response) => {
            // 5. --- DISPLAY RESULT ---
            setIsLoading(false);
            
            if (response && response.success) {
                setResult(response.result);
            } else {
                setResult(`Error: ${response?.error || 'Unknown error occurred in service worker.'}`);
            }
        });
    } else {
        // Fallback for local development environment where 'chrome' is undefined
        console.error("Warning: 'chrome.runtime.sendMessage' is undefined. Running in development mode (outside extension).");
        
        // Simulate a success after a delay so the UI doesn't get stuck
        setTimeout(() => {
            setIsLoading(false);
            setResult("DEV MODE: Chrome API unavailable. Service worker contact simulated. Logging still runs in background.");
        }, 1500);
    }
  };

  // Dynamic class application for the button based on loading state
  const buttonClasses = `w-full py-2 text-white font-semibold rounded-lg transition duration-300 transform active:scale-98 shadow-md 
    ${
      isLoading || isMemoryPosting || isSearching
        ? 'bg-blue-400 cursor-not-allowed flex items-center justify-center' 
        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
    }`;

  const buttonText = () => {
    if (isSearching) {
      return 'Searching History...';
    }
    if (isLoading) {
      // If we are waiting for the AI response (via service worker or timeout)
      return typeof chrome !== 'undefined' ? 'Asking AI...' : 'Simulating AI...';
    }
    if (isMemoryPosting) {
      return 'Logging Memory...';
    }
    return 'Get Contextual Fashion Advice';
  };
  
  const isDisabled = isLoading || isMemoryPosting || isSearching;

  return (
    <div className="p-4 w-80 min-h-[300px] bg-gray-50 font-sans border-t-4 border-blue-600 rounded-b-xl shadow-2xl">
      <h1 className="text-2xl font-extrabold text-gray-800 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-600">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
        Fashion Shopping Assistant
      </h1>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        placeholder="Ask about style, sizing, or fit (e.g., 'What shirt size am I if I weigh 160 lbs?')"
        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 resize-none mb-4 shadow-inner text-sm"
        rows="4"
        disabled={isDisabled}
      />
      
      <button
        onClick={handleSubmit}
        className={buttonClasses}
        disabled={isDisabled}
      >
        {(isDisabled) ? (
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {buttonText()}
          </div>
        ) : buttonText()}
      </button>

      <div className="mt-5 p-4 bg-white border border-gray-200 rounded-xl shadow-lg text-sm text-gray-800 whitespace-pre-wrap min-h-20 max-h-40 overflow-y-auto">
        <p className="font-medium text-gray-500 mb-1 border-b pb-1">AI Response</p>
        {result}
      </div>
    </div>
  );
}

export default Popup;
