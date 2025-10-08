import React from 'react';
// Assuming the Canvas component is located at src/components/Popup.jsx
import Popup from './components/Popup.jsx'; 

/**
 * The main application wrapper component. In a typical React app, this 
 * holds global logic (like routing, context, or layout), but here it 
 * primarily serves to render the core UI component.
 */
function App() {
  // If you later add global providers (e.g., context) or a larger layout, 
  // you can place them here.
  return (
    <div className="App">
      {/* The main UI for the extension is rendered here */}
      <Popup />
    </div>
  );
}

export default App;
