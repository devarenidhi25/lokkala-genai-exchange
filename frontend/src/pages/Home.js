import { Link, useNavigate } from "react-router-dom"
import React from "react"
import "./Home.css"
"use client"

const AppStore = window.AppStore

function HomePage() {
  const navigate = useNavigate()
  const user = AppStore.getUser()

  return (
    <main className="container mx-auto px-6 py-10">
      <div className="bg-circles" aria-hidden="true"></div>

      {/* Hero Section */}
      <section className="hero">
        <div className="card animate-slide-up shadow-xl rounded-2xl p-8 bg-white">
          <div className="card-body text-center">
            <h1 className="hero-title text-4xl font-bold mb-4">
              Empowering Indian Artisans with AI
            </h1>
            <p className="hero-subtitle text-lg text-gray-600 mb-6">
              LokKala helps local artisans market their craft, tell authentic
              stories, and reach new digital audiences — all with an AI-driven
              toolkit designed for India.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/signup"
                className="btn btn-primary animate-bounce-in no-underline transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Continue as Local Artisan
              </Link>
              <Link
                to="/signup"
                className="btn animate-bounce-in no-underline transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Continue as Buyer / Customer
              </Link>
            </div>

            {/* <div className="mt-4 text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="btn btn-ghost no-underline hover:text-primary transition-colors"
              >
                Sign in
              </Link>
            </div> */}

            <div className="mt-6">
              <Link
                to="/products"
                className="btn animate-fade-in no-underline transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
              >
                Explore Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards Section (outside hero box, side by side) */}
      <section id="about" className="about-section">
        <div className="container">
          <h2 className="section-title scroll-reveal fade-up">About LokKala</h2>
          <div className="about-content">
            <div className="about-text scroll-reveal fade-up">
              <div className="features-grid">
                <div className="feature-item scroll-reveal fade-left">
                  <h4>🎨 For Artisans</h4>
                  <p>• AI-enhanced photos and caption generator
              <br />• Smart product descriptions and hashtags
              <br />• WhatsApp catalog sharing
              <br />• Social media marketing tips</p>
                </div>
                <div className="feature-item scroll-reveal fade-up">
                  <h4>🛍️ For Buyers</h4>
                  <p> • Region-wise discovery with interactive India map
              <br />• Smart search by category, price, and preferences
              <br />• Direct connect with local artisans
              <br />• Authentic craft stories and origins</p>
                </div>
                <div className="feature-item scroll-reveal fade-up">
                  <h4>Why LokKala?</h4>
                  <p>Made in India, for India. A modern platform celebrating traditional crafts
              with cutting-edge AI technology.</p>
                </div>
                
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

window.HomePage = HomePage
export default HomePage
