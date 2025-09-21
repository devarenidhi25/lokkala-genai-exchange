"use client"

import React from "react"
import { useNavigate } from "react-router-dom"

function ArtisanDashboard() {
  const navigate = useNavigate()

  return (
    <main className="container">
      <section className="mt-4">
        <div className="card">
          <div className="card-body">
            <h2 className="bold">Welcome, Artisan!</h2>
            <p className="text-muted">Choose how you want to boost your brand today:</p>
            <div className="grid mt-4" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
              {/* <button
                className="btn btn-primary"
                title="Enhance your product images to look more professional"
                onClick={() => navigate("/image-enhancement")}
              >
                ✨ Image Enhancement
              </button> */}
              <button
                className="btn btn-secondary"
                title="Generate catchy captions for your posts or products"
                onClick={() => navigate("/caption-generator")}
              >
                📝 Caption Generator
              </button>
              <button
                className="btn btn-success"
                title="Automatically manage your social media posts and interactions"
                onClick={() => navigate("/social-agent")}
              >
                📲 Social Media Agent
              </button>
            </div>
          </div>
        </div>
      </section>
      <footer className="footer">Grow your brand with LokKala India • Share everywhere</footer>
    </main>
  )
}

export default ArtisanDashboard
