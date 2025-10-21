"use client"

import React, { useState } from "react"
import axios from "axios"
import BACKEND_URL from "../config"

function SocialAgent() {
  const [selectedFile, setSelectedFile] = useState(null)
  const [preview, setPreview] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      setSelectedFile(file)
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
      // Reset previous results
      setResult(null)
      setCompleted(false)
    }
  }

  // Call backend Instagram Poster Agent
  const handlePost = async () => {
    if (!selectedFile) return alert("Please select an image file")
    
    setLoading(true)
    setCompleted(false)
    
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('image', selectedFile)
      formData.append('caption', '') // Empty caption - agent will generate one

      // Use the Instagram post endpoint
      const res = await axios.post(`${BACKEND_URL}/instagram/post`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log("Response:", res.data)
      setResult(res.data)
      if (res.data.success) setCompleted(true)
    } catch (err) {
      console.error("Error:", err)
      setResult({ 
        success: false, 
        message: err.response?.data?.detail || err.message 
      })
      setCompleted(false)
    }
    setLoading(false)
  }

  // WhatsApp share
  const shareWhatsApp = (caption) => {
    const text = encodeURIComponent(caption || "Check out my handcrafted product! #Handcrafted #MadeInIndia")
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedFile(null)
    setPreview("")
    setResult(null)
    setCompleted(false)
    // Clear file input
    const fileInput = document.getElementById('imageInput')
    if (fileInput) fileInput.value = ''
  }

  return (
    <main className="container mt-4">
      <h2 className="bold">📲 Social Media Agent</h2>
      <p className="small text-muted">Upload an image to generate captions and post to Instagram automatically!</p>

      {/* File Upload Section */}
      <div className="mt-3">
        <label htmlFor="imageInput" className="form-label">Select Image:</label>
        <input
          id="imageInput"
          type="file"
          className="form-control"
          accept="image/*"
          onChange={handleFileSelect}
        />
      </div>

      {/* Image Preview */}
      {preview && (
        <div className="mt-3">
          <p className="small text-muted">Preview:</p>
          <div style={{ maxWidth: "300px", marginBottom: "10px" }}>
            <img 
              src={preview} 
              alt="Preview" 
              className="img-fluid rounded border"
              style={{ maxHeight: "200px", objectFit: "cover" }}
            />
          </div>
          <p className="small">
            <strong>Selected:</strong> {selectedFile?.name} ({(selectedFile?.size / 1024 / 1024).toFixed(2)} MB)
          </p>
          <button 
            className="btn btn-outline-secondary btn-sm" 
            onClick={clearSelection}
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-3">
        <button
          className="btn btn-success"
          onClick={handlePost}
          disabled={loading || !selectedFile}
        >
          {loading ? "Processing..." : "Generate Caption & Post to Instagram"}
        </button>
      </div>

      {/* Work Completed Banner */}
      {completed && (
        <div className="alert alert-success mt-3 d-flex align-items-center">
          <span style={{ fontSize: "1.5rem", marginRight: "0.5rem" }}>✅</span>
          <div>
            <strong>Success!</strong> Your content has been posted to Instagram.
          </div>
        </div>
      )}

      {/* Result Details */}
      {result && !result.success && (
        <div className="alert alert-danger mt-3">
          <p><strong>Error:</strong> {result.message}</p>
        </div>
      )}

      {result && result.success && result.caption && (
        <div className="mt-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">✨ Posted Successfully!</h5>
              
              <div className="mb-3">
                <strong>Caption:</strong>
                <p className="card-text mt-2">{result.caption}</p>
              </div>

              {result.post_result && (
                <div className="mb-3">
                  <strong>Instagram Response:</strong>
                  <p className="text-muted small mt-2">{result.post_result}</p>
                </div>
              )}

              <button 
                className="btn btn-primary me-2" 
                onClick={() => shareWhatsApp(result.caption)}
              >
                📱 Share on WhatsApp
              </button>

              <button 
                className="btn btn-outline-secondary" 
                onClick={() => navigator.clipboard.writeText(result.caption)}
              >
                📋 Copy Caption
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

export default SocialAgent