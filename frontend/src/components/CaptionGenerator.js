"use client"

import React, { useState } from "react"

function CaptionGenerator() {
  const [prompt, setPrompt] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [captions, setCaptions] = useState([])
  const [hashtags, setHashtags] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // Convert image to base64
  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result.split(",")[1])
      reader.onerror = (err) => reject(err)
    })

  async function onGenerate() {
    try {
      setLoading(true)
      setError("")

      let imageBase64 = null
      if (imageFile) {
        imageBase64 = await toBase64(imageFile)
      }

      const res = await fetch("http://127.0.0.1:8000/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          imageBase64,
          tone: "heritage-focused",
        }),
      })

      const data = await res.json()
      if (!data.success) throw new Error(data.error || "Failed to generate captions")

      const result = Array.isArray(data.data) ? data.data : [data.data]

      setCaptions(result.map((r) => r.short || r.post_sample || ""))
      setHashtags(result[0]?.hashtags || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">📝 Caption Generator</h2>

      {/* Prompt input */}
      <textarea
        className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        placeholder="Describe your craft (e.g., Handloom cotton saree from Maharashtra)"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />

      {/* Image input */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Upload Product Image (optional):
        </label>
        <input
          type="file"
          accept="image/*"
          className="block w-full text-sm text-gray-600
                     file:mr-4 file:py-2 file:px-4
                     file:rounded-full file:border-0
                     file:text-sm file:font-semibold
                     file:bg-indigo-50 file:text-indigo-700
                     hover:file:bg-indigo-100"
          onChange={(e) => setImageFile(e.target.files[0])}
        />
      </div>

      {/* Generate button */}
      <button
        className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
        onClick={onGenerate}
        disabled={loading}
      >
        {loading ? "Generating..." : "Generate Captions & Hashtags"}
      </button>

      {error && <p className="text-red-500 mt-3">⚠ {error}</p>}

      {/* Captions output */}
      {captions.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">✨ Suggested Captions:</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            {captions.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Hashtags output */}
      {hashtags.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">🏷 Hashtags:</h3>
          <div className="flex flex-wrap gap-2">
            {hashtags.map((h, i) => (
              <span
                key={i}
                className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}

export default CaptionGenerator
