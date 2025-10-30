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
      const previewUrl = URL.createObjectURL(file)
      setPreview(previewUrl)
      setResult(null)
      setCompleted(false)
    }
  }

  // Post to Instagram with auto-generated caption
  const handlePost = async () => {
    if (!selectedFile) {
      alert("Please select an image file")
      return
    }
    
    setLoading(true)
    setCompleted(false)
    setResult(null)
    
    try {
      const formData = new FormData()
      formData.append('image', selectedFile)

      console.log("📤 Posting to:", `${BACKEND_URL}/instagram/post`)

      const res = await axios.post(`${BACKEND_URL}/instagram/post`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      console.log("📥 Response:", res.data)
      
      setResult(res.data)
      if (res.data.success) {
        setCompleted(true)
      }
    } catch (err) {
      console.error("❌ Error:", err)
      const errorMsg = err.response?.data?.message || err.response?.data?.detail || err.message
      setResult({ 
        success: false, 
        message: errorMsg
      })
      setCompleted(false)
    } finally {
      setLoading(false)
    }
  }

  // Share on WhatsApp
  const shareWhatsApp = (caption) => {
    const text = encodeURIComponent(caption || "Check out my handcrafted product! 🌟 #Handcrafted #MadeInIndia")
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedFile(null)
    setPreview("")
    setResult(null)
    setCompleted(false)
    const fileInput = document.getElementById('imageInput')
    if (fileInput) fileInput.value = ''
  }

  return (
    <main className="container mt-4">
      <h2 className="bold">📲 Social Media Agent</h2>
      <p className="small text-muted">
        Upload an image to auto-generate captions and post directly to Instagram!
      </p>

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
            <strong>Selected:</strong> {selectedFile?.name} 
            ({(selectedFile?.size / 1024 / 1024).toFixed(2)} MB)
          </p>
          <button 
            className="btn btn-outline-secondary btn-sm" 
            onClick={clearSelection}
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Action Button */}
      <div className="mt-3">
        <button
          className="btn btn-success"
          onClick={handlePost}
          disabled={loading || !selectedFile}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Processing...
            </>
          ) : (
            "🚀 Generate Caption & Post to Instagram"
          )}
        </button>
      </div>

      {/* Success Banner */}
      {completed && (
        <div className="alert alert-success mt-3 d-flex align-items-center">
          <span style={{ fontSize: "1.5rem", marginRight: "0.5rem" }}>✅</span>
          <div>
            <strong>Success!</strong> Your content has been posted to Instagram.
          </div>
        </div>
      )}

      {/* Error Message */}
      {result && !result.success && (
        <div className="alert alert-danger mt-3">
          <strong>❌ Error:</strong> {result.message}
        </div>
      )}

      {/* Success Details */}
      {result && result.success && (
        <div className="mt-3">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">✨ Posted Successfully!</h5>
              
              {result.caption && (
                <div className="mb-3">
                  <strong>Generated Caption:</strong>
                  <p className="card-text mt-2" style={{ whiteSpace: "pre-wrap" }}>
                    {result.caption}
                  </p>
                </div>
              )}

              {result.post_result && (
                <div className="mb-3">
                  <strong>Instagram Response:</strong>
                  <p className="text-muted small mt-2">{result.post_result}</p>
                </div>
              )}

              <div className="d-flex gap-2">
                <button 
                  className="btn btn-primary" 
                  onClick={() => shareWhatsApp(result.caption)}
                >
                  📱 Share on WhatsApp
                </button>

                <button 
                  className="btn btn-outline-secondary" 
                  onClick={() => {
                    navigator.clipboard.writeText(result.caption)
                    alert("✅ Caption copied to clipboard!")
                  }}
                >
                  📋 Copy Caption
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State Details */}
      {loading && (
        <div className="alert alert-info mt-3">
          <strong>🔄 Processing your request...</strong>
          <ul className="mt-2 mb-0 small">
            <li>Analyzing image with AI</li>
            <li>Generating engaging caption</li>
            <li>Uploading to Cloudinary</li>
            <li>Publishing to Instagram</li>
          </ul>
        </div>
      )}
    </main>
  )
}

export default SocialAgent