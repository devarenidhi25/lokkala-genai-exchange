"use client"

import React, { useState } from "react"
import axios from "axios"

function SocialAgent() {
  const [imagePath, setImagePath] = useState("")   // local path or uploaded file name
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  // Call backend Social Media Agent
  const handlePost = async () => {
    if (!imagePath) return alert("Please provide an image path")
    setLoading(true)
    try {
      const res = await axios.post("http://127.0.0.1:8000/social-agent", {
        image_path: imagePath
      })
      setResult(res.data)
    } catch (err) {
      setResult({ success: false, message: err.message })
    }
    setLoading(false)
  }

  // WhatsApp share
  const shareWhatsApp = (caption) => {
    const text = encodeURIComponent(caption || "Check out my handcrafted product! #Handcrafted #MadeInIndia")
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  return (
    <main className="container mt-4">
      <h2 className="bold">📲 Social Media Agent</h2>
      <p className="small text-muted">Generate captions and post your images automatically!</p>

      <input
        type="text"
        className="form-control mt-3"
        placeholder="Enter local image path (C:/path/to/image.jpg)"
        value={imagePath}
        onChange={(e) => setImagePath(e.target.value)}
      />

      <button
        className="btn btn-success mt-3"
        onClick={handlePost}
        disabled={loading}
      >
        {loading ? "Posting..." : "Generate Caption & Post"}
      </button>

      {result && (
        <div className={`alert mt-3 ${result.success ? "alert-success" : "alert-danger"}`}>
          <p>{result.message}</p>
          {result.caption && (
            <>
              <p><strong>Caption:</strong> {result.caption}</p>
              <button className="btn btn-primary mt-2" onClick={() => shareWhatsApp(result.caption)}>
                Share on WhatsApp
              </button>
            </>
          )}
        </div>
      )}
    </main>
  )
}

export default SocialAgent
