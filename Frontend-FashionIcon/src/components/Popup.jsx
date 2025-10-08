import React, { useState, useEffect } from 'react';

/**
 * The main component for the Chrome extension popup UI.
 * It handles user input, communicates with the background service worker, 
 * and displays the AI response.
 */
const Popup = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('AI response will appear here.');
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Sends the user's prompt to the background service worker for processing 
   * by the AI API.
   */
  const handleSubmit = () => {
    if (!prompt.trim() || isLoading) return;

    setIsLoading(true);
    setResult('Thinking...');

    // Send the message to the Service Worker defined in service-worker.js
    // The service worker will handle the API call and send back the response.
    chrome.runtime.sendMessage({ action: "queryAI", data: prompt }, (response) => {
      setIsLoading(false);
      
      if (response && response.success) {
        // Display the received text result
        setResult(response.result);
      } else {
        // Display an error message if the service worker failed
        setResult(`Error: ${response?.error || 'Unknown error occurred in service worker.'}`);
      }
    });
  };

  // Dynamic class application for the button based on loading state
  const buttonClasses = `w-full py-2 text-white font-semibold rounded-lg transition duration-300 transform active:scale-98 shadow-md 
    ${
      isLoading 
        ? 'bg-blue-400 cursor-not-allowed flex items-center justify-center' 
        : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
    }`;
  
  return (
    <div className="p-4 w-80 min-h-[300px] bg-gray-50 font-sans border-t-4 border-blue-600 rounded-b-xl shadow-2xl">
      <h1 className="text-2xl font-extrabold text-gray-800 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-blue-600">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
        AI Assistant
      </h1>
      
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); } }}
        placeholder="Type your question or request here..."
        className="w-full p-3 border border-gray-300 rounded-xl focus:ring-blue-500 focus:border-blue-500 resize-none mb-4 shadow-inner text-sm"
        rows="4"
        disabled={isLoading}
      />
      
      <button
        onClick={handleSubmit}
        className={buttonClasses}
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
          </div>
        ) : 'Get AI Answer'}
      </button>

      <div className="mt-5 p-4 bg-white border border-gray-200 rounded-xl shadow-lg text-sm text-gray-800 whitespace-pre-wrap min-h-20 max-h-40 overflow-y-auto">
        <p className="font-medium text-gray-500 mb-1 border-b pb-1">AI Response</p>
        {result}
      </div>
    </div>
  );
}

export default Popup;