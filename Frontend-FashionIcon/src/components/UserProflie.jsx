import { useState, useEffect } from "react"

// --- Constants (Simplified for Display) ---
const DISPLAY_USER_ID = "profile_user_001" 
// Note: API configuration constants (MEMMACHINE_API_BASE, etc.) were removed 
// because the API call logic is now passed in via the fetchHistory prop.

// Helper function to parse the markdown output from the AI/Memory Content
const parseMarkdownOutput = (markdown) => {
  if (!markdown) return null

  return markdown
    .split("\n")
    .map((line, index) => {
      const key = index
      const trimmedLine = line.trim()

      if (trimmedLine.startsWith("##")) {
        const title = trimmedLine.substring(2).trim()
        return (
          <h3
            key={key}
            className="text-base font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-3 mb-1"
          >
            {title}
          </h3>
        )
      }

      if (trimmedLine.startsWith("#") && !trimmedLine.startsWith("##")) {
        const title = trimmedLine.substring(1).trim()
        return (
          <h2
            key={key}
            className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-3 mb-1"
          >
            {title}
          </h2>
        )
      }

      if (trimmedLine.startsWith("- ")) {
        const content = trimmedLine.substring(2).trim()
        const parts = content.split("**").map((part, i) => {
          return i % 2 === 1 ? (
            <strong key={i} className="text-gray-800">
              {part}
            </strong >
          ) : (
            part
          )
        })

        return (
          <p key={key} className="ml-3 text-gray-700 text-sm leading-relaxed mb-1 flex items-start">
            <span className="text-purple-500 mr-2 mt-0.5">•</span>
            <span>{parts}</span>
          </p>
        )
      }

      if (trimmedLine) {
        const parts = trimmedLine.split("**").map((part, i) => {
          return i % 2 === 1 ? (
            <strong key={i} className="text-gray-800 font-semibold">
              {part}
            </strong >
          ) : (
            part
          )
        })

        return (
          <p key={key} className="mt-1 mb-2 text-sm leading-relaxed text-gray-600">
            {parts}
          </p>
        )
      }

      return null
    })
    .filter(Boolean)
}

// UserProfile now accepts the fetchHistory prop from App.jsx
const UserProfile = ({ fetchHistory }) => {
  const [memories, setMemories] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Only fetch if the handler is provided
    if (fetchHistory) {
        fetchMemories()
    }
  }, [fetchHistory]) // Re-run if the fetchHistory function reference changes

  // Renamed from fetchMemories to better reflect the new logic
  const fetchMemories = async () => {
    setIsLoading(true)
    setError(null)
    setMemories([]) 

    try {
      // *** NEW LOGIC: Use the prop for FastAPI connection ***
      const { success, data, error: fetchError } = await fetchHistory()

      if (!success) {
        throw new Error(fetchError || "Unknown error occurred during history fetch.")
      }

      // 'data' is expected to be the array of history items from the App.jsx handler.
      setMemories(data)
    } catch (err) {
      console.error("Error fetching history via FastAPI handler:", err)
      // Updated error message to reference FastAPI port 8000
      setError(`Failed to retrieve history. Please check the FastAPI service connection on port 8000. Detail: ${err.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTimestamp = (timestamp) => {
    // Ensure the timestamp is valid (can be mem_id or timestamp field from different backends)
    const date = new Date(timestamp)
    // Fallback if Date conversion fails
    if (isNaN(date.getTime())) return "Unknown Date" 
    
    const now = new Date()
    const diffMs = now - date
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="w-full max-w-4xl bg-gradient-to-br from-white to-purple-50 font-sans rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/30">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-white">Fashion Profile</h1>
            {/* Displaying the simplified user ID constant */}
            <p className="text-purple-100 text-sm mt-1">User ID: {DISPLAY_USER_ID}</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white/70 backdrop-blur-sm border-b-2 border-purple-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {memories.length}
            </p>
            <p className="text-xs text-gray-600 mt-1">Total Logs</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              AI
            </p>
            <p className="text-xs text-gray-600 mt-1">Powered</p>
          </div>
          <div className="text-center">
            <button
              onClick={fetchMemories}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Memory Logs */}
      <div className="p-6">
        <h2 className="text-xl font-bold text-transparent bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text mb-4 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-2 text-purple-600"
          >
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          Activity Logs
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg
              className="animate-spin h-10 w-10 text-purple-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-500 bg-red-50 rounded-xl border border-red-200 mx-4">
            <p className="font-semibold text-lg">Connection Failed</p>
            <p className="text-sm mt-2 text-red-700">
              {error}
            </p>
            <button
              onClick={fetchMemories}
              className="mt-4 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-colors duration-200 shadow-md"
            >
              Try Again
            </button>
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-4 text-purple-300"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            <p>No memories found</p>
            <p className="text-sm mt-2">Start using the outfit generator to create logs!</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-purple-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-purple-400 [&::-webkit-scrollbar-thumb]:to-pink-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:from-purple-500 [&::-webkit-scrollbar-thumb]:hover:to-pink-500">
            {memories.map((memory, index) => (
              <div
                key={memory.mem_id || index}
                className="bg-white/70 backdrop-blur-sm border-2 border-purple-200 rounded-xl p-4 shadow-md hover:shadow-lg transition-all duration-200 hover:border-purple-300"
              >
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-purple-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="white"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" x2="12" y1="19" y2="22" />
                      </svg>
                    </div>
                    <span className="text-xs font-semibold text-purple-700">
                      Log #{memory.id || index + 1}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">{formatTimestamp(memory.timestamp || memory.date || Date.now())}</span>
                </div>
                {/* Content parsing assumes the memory object has a 'content' field or an 'output' field from the mock data */}
                {memory.episode_content || memory.output ? (
                    <div className="text-sm">{parseMarkdownOutput(memory.episode_content || memory.output)}</div>
                ) : (
                    <p className="text-sm text-gray-500 italic">No content recorded for this log entry.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserProfile
