// Chrome Extension Service Worker
// This runs in the background and handles extension events

const chrome = window.chrome // Declare the chrome variable

console.log("Fashion Icon Assistant service worker loaded")

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("Fashion Icon Assistant installed")
})

// Handle messages from the popup or content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received:", request)

  if (request.type === "GET_MEMORIES") {
    // Handle memory requests here if needed
    sendResponse({ success: true })
  }

  return true // Keep the message channel open for async responses
})
