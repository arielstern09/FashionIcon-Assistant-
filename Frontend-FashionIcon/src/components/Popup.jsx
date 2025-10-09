import { useState } from "react"

const OUTFIT_API_URL = "http://0.0.0.0:8080/generate-outfit"

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
            className="text-lg font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-4 mb-2 pt-3 border-t-2 border-purple-200"
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
            className="text-xl font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mt-4 mb-2 pt-3 border-t-2 border-purple-200"
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
            </strong>
          ) : (
            part
          )
        })

        return (
          <p key={key} className="ml-3 text-gray-700 leading-relaxed mb-2 flex items-start">
            <span className="text-purple-500 mr-2 mt-1 text-lg">•</span>
            <span>{parts}</span>
          </p>
        )
      }

      if (trimmedLine) {
        const parts = trimmedLine.split("**").map((part, i) => {
          return i % 2 === 1 ? (
            <strong key={i} className="text-gray-800 font-bold">
              {part}
            </strong>
          ) : (
            part
          )
        })

        return (
          <p key={key} className="mt-1 mb-3 leading-relaxed text-gray-600">
            {parts}
          </p>
        )
      }

      return null
    })
    .filter(Boolean)
}

const Popup = () => {
  const [outfitInputs, setOutfitInputs] = useState({
    event: "",
    weather: "",
    mood: "",
  })
  const [outfitResult, setOutfitResult] = useState("")
  const [isOutfitLoading, setIsOutfitLoading] = useState(false)

  const generateOutfitSuggestion = async () => {
    if (isOutfitLoading) return

    const { event, weather, mood } = outfitInputs
    if (!event || !weather || !mood) {
      setOutfitResult("Please fill out all three fields (Event, Weather, Mood).")
      return
    }

    setIsOutfitLoading(true)
    setOutfitResult("Consulting your personal stylist (AI)...")

    try {
      const response = await fetch(OUTFIT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(outfitInputs),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()
      setOutfitResult(data.outfit)
    } catch (error) {
      console.error("Error calling outfit API:", error)
      setOutfitResult(
        `Failed to get outfit suggestion. Is your FastAPI server running at ${OUTFIT_API_URL}? Error: ${error.message}`,
      )
    } finally {
      setIsOutfitLoading(false)
    }
  }

  const outfitButtonClasses = `w-full py-3 text-white font-bold rounded-xl transition-all duration-300 transform shadow-lg ${
    isOutfitLoading
      ? "bg-gradient-to-r from-purple-400 to-pink-400 cursor-not-allowed flex items-center justify-center"
      : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
  }`

  const outfitButtonText = isOutfitLoading ? "Generating Outfit..." : "Generate New Outfit"

  const inputIcons = {
    event: "🎉",
    weather: "🌤️",
    mood: "😊",
  }

  return (
    <div className="p-6 max-w-sm w-full min-h-[300px] bg-gradient-to-br from-white to-purple-50 font-sans rounded-2xl shadow-2xl">
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 -mx-6 -mt-6 mb-6 p-5 rounded-t-2xl">
        <h1 className="text-2xl font-extrabold text-white flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-3"
          >
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" x2="12" y1="19" y2="22" />
          </svg>
          Fashion Outfit Generator
        </h1>
      </div>

      <h2 className="text-lg font-bold text-transparent bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text mb-4">
        AI Outfit Inputs
      </h2>

      <div className="space-y-3 mb-5">
        {["event", "weather", "mood"].map((key) => (
          <div key={key} className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl transition-transform group-hover:scale-110">
              {inputIcons[key]}
            </span>
            <input
              type="text"
              placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
              value={outfitInputs[key]}
              onChange={(e) => setOutfitInputs((prev) => ({ ...prev, [key]: e.target.value }))}
              className="w-full pl-14 pr-4 py-3 border-2 border-purple-200 rounded-xl text-base focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 shadow-sm hover:shadow-md bg-white placeholder:text-gray-400"
              disabled={isOutfitLoading}
            />
          </div>
        ))}
      </div>

      <button onClick={generateOutfitSuggestion} className={outfitButtonClasses} disabled={isOutfitLoading}>
        {isOutfitLoading ? (
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            {outfitButtonText}
          </div>
        ) : (
          outfitButtonText
        )}
      </button>

      <div className="mt-6 p-5 bg-white/70 backdrop-blur-sm border-2 border-purple-200 rounded-2xl shadow-lg text-sm text-gray-800 min-h-32 max-h-96 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-purple-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-purple-400 [&::-webkit-scrollbar-thumb]:to-pink-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:from-purple-500 [&::-webkit-scrollbar-thumb]:hover:to-pink-500">
        <p className="font-bold text-transparent bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text mb-3 pb-2 border-b-2 border-purple-200">
          AI Stylist Report
        </p>
        {isOutfitLoading || !outfitResult ? (
          <p className="text-gray-500 italic mt-3">{outfitResult}</p>
        ) : (
          parseMarkdownOutput(outfitResult)
        )}
      </div>
    </div>
  )
}

export default Popup
