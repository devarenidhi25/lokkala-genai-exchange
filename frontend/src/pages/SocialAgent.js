"use client"

import React, { useState } from "react"
import axios from "axios"

function SocialAgent() {
  const [imagePath, setImagePath] = useState("")   
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)  // NEW: tracks if work is done

  // Call backend Social Media Agent
  const handlePost = async () => {
    if (!imagePath) return alert("Please provide an image path")
    setLoading(true)
    setCompleted(false) // reset before starting
    try {
      const res = await axios.post("http://127.0.0.1:8000/social-agent", {
        image_path: imagePath
      })
      setResult(res.data)
      if (res.data.success) setCompleted(true) // mark as completed
    } catch (err) {
      setResult({ success: false, message: err.message })
      setCompleted(false)
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

      {/* Work Completed Banner */}
      {completed && (
        <div className="alert alert-success mt-3 d-flex align-items-center">
          <span style={{ fontSize: "1.5rem", marginRight: "0.5rem" }}>✅</span>
          <strong>Success!</strong> Your caption has been generated and posting is done.
        </div>
      )}

      {/* Result Details */}
      {result && !completed && (
        <div className={`alert mt-3 ${result.success ? "alert-success" : "alert-danger"}`}>
          <p>{result.message}</p>
        </div>
      )}

      {result && result.caption && (
        <div className="mt-2">
          <p><strong>Caption:</strong> {result.caption}</p>
          <button className="btn btn-primary mt-2" onClick={() => shareWhatsApp(result.caption)}>
            Share on WhatsApp
          </button>
        </div>
      )}
    </main>
  )
}

export default SocialAgent
