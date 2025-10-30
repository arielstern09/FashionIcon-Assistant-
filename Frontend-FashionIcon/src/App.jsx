
import { useState } from "react"
import Popup from "./components/Popup.jsx"
import UserProfile from "./components/UserProflie.jsx"

// --- Configuration ---
const IS_DEV_MODE = false // Set to false to use real API
const API_ROOT = "http://localhost:8000" // Your FastAPI server

// MemMachine API configuration
const MEMMACHINE_API_BASE = "http://0.0.0.0:8080"
const FASHION_USER_ID = "profile_user_001"
const ASSISTANT_AGENT_ID = ["fashion-stylist-gemini"]
const FASHION_GROUP_ID = "fashion-group-01"

const createSessionPayload = () => ({
  group_id: FASHION_GROUP_ID,
  agent_id: ASSISTANT_AGENT_ID,
  user_id: [FASHION_USER_ID],
  session_id: crypto.randomUUID(),
})

function App() {
  const [currentView, setCurrentView] = useState("profile") // 'profile' or 'generator'

  // Fetch history from MemMachine
  const fetchHistory = async () => {
    if (IS_DEV_MODE) {
      console.log("[MOCK API] Returning mock history data")
      await new Promise((resolve) => setTimeout(resolve, 100))
      return {
        success: true,
        data: [
          {
            mem_id: "mock_1",
            episode_content: "**Style Vibe**: Casual chic for brunch\n\n**Recommended Outfit**:\n- Top: White linen shirt\n- Bottom: High-waisted jeans\n- Shoes: White sneakers\n- Accessories: Gold hoop earrings",
            timestamp: Date.now() - 3600000,
          },
          {
            mem_id: "mock_2",
            episode_content: "**Style Vibe**: Professional and polished\n\n**Recommended Outfit**:\n- Top: Silk blouse\n- Bottom: Black trousers\n- Shoes: Leather loafers\n- Accessories: Minimal gold jewelry",
            timestamp: Date.now() - 7200000,
          }
        ]
      }
    }

    try {
      const payload = {
        session: createSessionPayload(),
        query: "Show all outfit recommendations",
        limit: 20
      }

      const response = await fetch(`${API_ROOT}/api/memories/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`History fetch failed: ${response.status}`)
      }

      const result = await response.json()
      
      // DEBUG: Log what we received
      console.log("Raw MemMachine response:", result)
      
      // Parse the nested episodic_memory structure from MemMachine
      let memories = []
      
      if (result.content && result.content.episodic_memory) {
        // episodic_memory is an array of arrays: [[], [actual_memories], ['']]
        // We need the second array (index 1)
        const episodicArrays = result.content.episodic_memory
        if (Array.isArray(episodicArrays) && episodicArrays.length > 1) {
          const actualMemories = episodicArrays[1]
          if (Array.isArray(actualMemories)) {
            // Transform to match UserProfile's expected format
            memories = actualMemories.map(mem => ({
              mem_id: mem.uuid,
              episode_content: mem.content,
              timestamp: mem.timestamp,
              id: mem.uuid
            }))
          }
        }
      }
      
      console.log("Parsed memories:", memories)
      
      return { success: true, data: memories }
    } catch (error) {
      console.error("Failed to fetch history:", error)
      return { success: false, error: error.message }
    }
  }

  const postMemory = async (content) => {
    if (IS_DEV_MODE) {
      console.log(`[MOCK API] Simulating successful post memory for: "${content}"`)
      await new Promise((resolve) => setTimeout(resolve, 50))
      return { success: true, data: { status: "MOCK_OK", content_logged: content } }
    }

    const payload = {
      session: createSessionPayload(),
      producer: FASHION_USER_ID,
      produced_for: ASSISTANT_AGENT_ID[0],
      episode_content: content,
      episode_type: "user_query_fashion",
      metadata: {},
    }

    try {
      const response = await fetch(`${MEMMACHINE_API_BASE}/v1/memories`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Memory POST failed: ${response.status}`)
      }

      const result = await response.json()
      return { success: true, data: result }
    } catch (error) {
      console.error("Failed to post memory:", error)
      return { success: false, error: error.message }
    }
  }

  const searchMemory = async (query) => {
    if (IS_DEV_MODE) {
      console.log(`[MOCK API] Simulating successful search for: "${query}"`)
      await new Promise((resolve) => setTimeout(resolve, 100))
      return [
        {
          episode_content:
            "I am looking for a size M sweater, preferably wool, light gray color. I usually wear a 40 Regular jacket.",
          timestamp: Date.now(),
        },
        {
          episode_content: "I asked about the difference between slim-fit and relaxed-fit jeans for a 32-inch waist.",
          timestamp: Date.now() - 3600000,
        },
      ]
    }

    const payload = {
      session: createSessionPayload(),
      query: query,
      filter: {},
      limit: 5,
    }

    try {
      const response = await fetch(`${API_ROOT}/api/memories/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error(`Search POST failed: ${response.status}`)
      }

      const result = await response.json()
      return result.content?.profile_memory || []
    } catch (error) {
      console.error("Failed to search memory:", error)
      return []
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-8 px-4">
      {/* Navigation */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => setCurrentView("profile")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              currentView === "profile"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-purple-200"
            }`}
          >
            Profile & Logs
          </button>
          <button
            onClick={() => setCurrentView("generator")}
            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
              currentView === "generator"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white text-gray-700 hover:bg-gray-50 border-2 border-purple-200"
            }`}
          >
            Outfit Generator
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center">
        {currentView === "profile" ? (
          <UserProfile fetchHistory={fetchHistory} />
        ) : (
          <Popup postMemory={postMemory} searchMemory={searchMemory} />
        )}
      </div>
    </div>
  )
}

export default App