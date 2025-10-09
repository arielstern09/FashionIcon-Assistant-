import React, { useState } from 'react';

// Define the URL for your FastAPI server.
const OUTFIT_API_URL = 'http://0.0.0.0:8080/generate-outfit';

/**
 * The main component for the Chrome extension popup UI, now focused solely on
 * the AI Outfit Generator that calls the FastAPI backend.
 */
const Popup = () => {
  // State variables for Outfit Generator feature
  const [outfitInputs, setOutfitInputs] = useState({
    event: '',
    weather: '',
    mood: ''
  });
  const [outfitResult, setOutfitResult] = useState('');
  const [isOutfitLoading, setIsOutfitLoading] = useState(false);
  
  /**
   * Function to handle the generation of a dedicated outfit suggestion
   * by calling the FastAPI backend.
   */
  const generateOutfitSuggestion = async () => {
    if (isOutfitLoading) return;
    
    const { event, weather, mood } = outfitInputs;
    if (!event || !weather || !mood) {
      setOutfitResult("Please fill out all three fields (Event, Weather, Mood).");
      return;
    }
    
    setIsOutfitLoading(true);
    setOutfitResult("Consulting your personal stylist (AI)...");

    try {
      const response = await fetch(OUTFIT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // The body structure matches the OutfitRequest Pydantic model in app.py
        body: JSON.stringify(outfitInputs),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      
      // The FastAPI response has the format {"outfit": "..."}
      setOutfitResult(data.outfit);

    } catch (error) {
      console.error("Error calling outfit API:", error);
      setOutfitResult(`Failed to get outfit suggestion. Is your FastAPI server running at ${OUTFIT_API_URL}? Error: ${error.message}`);
    } finally {
      setIsOutfitLoading(false);
    }
  };

  // Dynamic class application for the outfit generator button
  const outfitButtonClasses = `w-full py-2 text-white font-semibold rounded-lg transition duration-300 transform active:scale-98 shadow-md 
    ${
      isOutfitLoading
        ? 'bg-purple-400 cursor-not-allowed flex items-center justify-center' 
        : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg'
    }`;

  const outfitButtonText = isOutfitLoading ? 'Generating Outfit...' : 'Generate New Outfit';
  
  return (
    <div className="p-4 w-80 min-h-[300px] bg-gray-50 font-sans border-t-4 border-purple-600 rounded-b-xl shadow-2xl">
      <h1 className="text-xl font-extrabold text-gray-800 mb-4 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-purple-600">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
        </svg>
        Fashion Outfit Generator
      </h1>
      
      {/* ---------------------------------- OUTFIT GENERATOR SECTION ---------------------------------- */}
      <h2 className="text-lg font-bold text-purple-700 mb-3 border-b pb-1">👗 AI Outfit Inputs</h2>
      <div className="space-y-2 mb-4">
        {['event', 'weather', 'mood'].map(key => (
          <input
            key={key}
            type="text"
            placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
            value={outfitInputs[key]}
            onChange={(e) => setOutfitInputs(prev => ({ ...prev, [key]: e.target.value }))}
            className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
            disabled={isOutfitLoading}
          />
        ))}
      </div>
      
      <button
        onClick={generateOutfitSuggestion}
        className={outfitButtonClasses}
        disabled={isOutfitLoading}
      >
        {isOutfitLoading ? (
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {outfitButtonText}
          </div>
        ) : outfitButtonText}
      </button>

      <div className="mt-5 p-4 bg-purple-50 border border-purple-200 rounded-xl shadow-lg text-sm text-gray-800 whitespace-pre-wrap min-h-32 overflow-y-auto">
        <p className="font-medium text-purple-700 mb-1 border-b pb-1">Outfit Result</p>
        {outfitResult}
      </div>
    </div>
  );
}

export default Popup;
