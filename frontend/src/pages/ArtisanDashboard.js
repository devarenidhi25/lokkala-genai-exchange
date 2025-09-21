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
              <button className="btn btn-primary" onClick={() => navigate("/image-enhancement")}>
                ✨ Image Enhancement
              </button>
              <button className="btn btn-secondary" onClick={() => navigate("/caption-generator")}>
                📝 Caption Generator
              </button>
              <button className="btn btn-success" onClick={() => navigate("/social-agent")}>
                📲 Social Media Agent
              </button>
            </div>
          </div>
        </div>
      </section>
      <footer className="footer">Grow your brand with ArtConnect India • Share everywhere</footer>
    </main>
  )
}

export default ArtisanDashboard
