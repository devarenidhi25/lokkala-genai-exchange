"use client"

import React, { useState } from "react"
import { TrendingUp, Target, Calendar, BarChart3 } from "lucide-react"

import { useNavigate } from "react-router-dom"

function ArtisanDashboard() {
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState("trends")

  // Navigation handlers - you'll connect these to your routing
  

  // This will be replaced with actual data from your backend
  const mockInsights = {
    colorTrends: [
      { color: "Blue", percentage: 35, clicks: 450 },
      { color: "Red", percentage: 25, clicks: 320 },
      { color: "Green", percentage: 20, clicks: 260 },
      { color: "Gold", percentage: 20, clicks: 250 }
    ],
    motifTrends: [
      { motif: "Floral", percentage: 40 },
      { motif: "Geometric", percentage: 30 },
      { motif: "Traditional", percentage: 30 }
    ],
    priceBands: [
      { range: "₹2000-5000", percentage: 45 },
      { range: "₹5000-10000", percentage: 35 },
      { range: "₹10000+", percentage: 20 }
    ],
    keyInsights: [
      { icon: "📈", text: "Your blue sarees got 40% more clicks than red ones", trend: "up" },
      { icon: "🎉", text: "Festival-related keywords increased reach by 20%", trend: "up" },
      { icon: "⭐", text: "Products priced ₹2000-5000 have highest conversion", trend: "neutral" }
    ],
    targetAudience: [
      "Women aged 25-34",
      "Metropolitan areas (Mumbai, Delhi, Bangalore)",
      "Festival shoppers"
    ],
    recommendedChannels: [
      { name: "Instagram Reels", reason: "High engagement for visual products" },
      { name: "Pinterest Boards", reason: "Strong discovery for traditional wear" },
      { name: "WhatsApp Business", reason: "Direct customer communication" }
    ],
    bestTiming: [
      "Post between 7-9 PM for maximum reach",
      "Thursdays and Fridays show 30% higher engagement",
      "2 weeks before festivals for promotional content"
    ]
  }

  return (
    <main className="container">
      <section className="mt-4">
        <div className="card animate-slide-up">
          <div className="card-body">
            <h2 className="bold">Welcome, Artisan!</h2>
            <p className="text-muted">Choose how you want to boost your brand today:</p>
            <div className="grid mt-4" style={{ gridTemplateColumns: "repeat(2,1fr)", gap: "1rem" }}>
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

      {/* Market Insights & Trends Section */}
      <section className="mt-4 animate-slide-up-delayed">
        <div className="card">
          <div className="card-body" style={{ 
            background: "linear-gradient(135deg, var(--primary) 0%, #0ea5a4 100%)", 
            color: "white", 
            padding: "1.5rem",
            borderTopLeftRadius: "14px",
            borderTopRightRadius: "14px"
          }}>
            <h2 className="bold" style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <TrendingUp style={{ width: "24px", height: "24px" }} />
              Your Artisan Insights
            </h2>
            <p style={{ margin: "0.5rem 0 0 0", opacity: 0.95, fontSize: "0.95rem" }}>
              Market trends and recommendations tailored for you
            </p>
          </div>

          {/* Tabs */}
          <div style={{ borderBottom: "1px solid var(--border)", display: "flex", gap: 0, background: "white" }}>
            <button
              onClick={() => setActiveTab("trends")}
              className="btn"
              style={{
                borderRadius: 0,
                borderBottom: activeTab === "trends" ? "3px solid var(--primary)" : "3px solid transparent",
                background: "transparent",
                color: activeTab === "trends" ? "var(--primary)" : "var(--muted)",
                fontWeight: activeTab === "trends" ? "600" : "normal",
                padding: "0.75rem 1.5rem"
              }}
            >
              <BarChart3 style={{ width: "16px", height: "16px", display: "inline", marginRight: "0.5rem" }} />
              Trend Radar
            </button>
            <button
              onClick={() => setActiveTab("audience")}
              className="btn"
              style={{
                borderRadius: 0,
                borderBottom: activeTab === "audience" ? "3px solid var(--primary)" : "3px solid transparent",
                background: "transparent",
                color: activeTab === "audience" ? "var(--primary)" : "var(--muted)",
                fontWeight: activeTab === "audience" ? "600" : "normal",
                padding: "0.75rem 1.5rem"
              }}
            >
              <Target style={{ width: "16px", height: "16px", display: "inline", marginRight: "0.5rem" }} />
              Target Audience
            </button>
            <button
              onClick={() => setActiveTab("timing")}
              className="btn"
              style={{
                borderRadius: 0,
                borderBottom: activeTab === "timing" ? "3px solid var(--primary)" : "3px solid transparent",
                background: "transparent",
                color: activeTab === "timing" ? "var(--primary)" : "var(--muted)",
                fontWeight: activeTab === "timing" ? "600" : "normal",
                padding: "0.75rem 1.5rem"
              }}
            >
              <Calendar style={{ width: "16px", height: "16px", display: "inline", marginRight: "0.5rem" }} />
              Best Timing
            </button>
          </div>

          {/* Tab Content */}
          <div className="card-body">
            {activeTab === "trends" && (
              <div>
                {/* Key Insights Cards */}
                <div style={{ marginBottom: "2rem" }}>
                  <h3 className="bold" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>📊 Key Insights</h3>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
                    {mockInsights.keyInsights.map((insight, index) => (
                      <div
                        key={index}
                        className="card"
                        style={{ 
                          background: "linear-gradient(135deg, rgba(244, 177, 131, 0.15) 0%, rgba(167, 212, 155, 0.15) 100%)",
                          border: "1px solid var(--border)"
                        }}
                      >
                        <div className="card-body" style={{ display: "flex", alignItems: "start", gap: "0.75rem" }}>
                          <span style={{ fontSize: "1.5rem" }}>{insight.icon}</span>
                          <p style={{ fontSize: "0.9rem", margin: 0, flex: 1 }}>{insight.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Trend Charts */}
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                  {/* Color Trends */}
                  <div className="card">
                    <div className="card-body">
                      <h4 className="bold" style={{ marginBottom: "1rem", fontSize: "1rem" }}>🎨 Color Trends</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {mockInsights.colorTrends.map((item, index) => (
                          <div key={index}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                              <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>{item.color}</span>
                              <span className="text-muted" style={{ fontSize: "0.9rem" }}>{item.percentage}%</span>
                            </div>
                            <div style={{ width: "100%", height: "8px", background: "var(--border)", borderRadius: "9999px", overflow: "hidden" }}>
                              <div
                                style={{ 
                                  width: `${item.percentage}%`, 
                                  height: "100%", 
                                  background: "linear-gradient(90deg, var(--primary) 0%, var(--accent-green) 100%)",
                                  transition: "width 0.5s ease",
                                  borderRadius: "9999px"
                                }}
                              ></div>
                            </div>
                            <span className="text-muted small" style={{ fontSize: "0.75rem" }}>{item.clicks} clicks</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Motif Trends */}
                  <div className="card">
                    <div className="card-body">
                      <h4 className="bold" style={{ marginBottom: "1rem", fontSize: "1rem" }}>🌸 Popular Motifs</h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {mockInsights.motifTrends.map((item, index) => (
                          <div key={index}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                              <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>{item.motif}</span>
                              <span className="text-muted" style={{ fontSize: "0.9rem" }}>{item.percentage}%</span>
                            </div>
                            <div style={{ width: "100%", height: "8px", background: "var(--border)", borderRadius: "9999px", overflow: "hidden" }}>
                              <div
                                style={{ 
                                  width: `${item.percentage}%`, 
                                  height: "100%", 
                                  background: "linear-gradient(90deg, var(--accent-saffron) 0%, var(--accent-green) 100%)",
                                  transition: "width 0.5s ease",
                                  borderRadius: "9999px"
                                }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Price Bands */}
                <div className="card mt-4">
                  <div className="card-body">
                    <h4 className="bold" style={{ marginBottom: "1rem", fontSize: "1rem" }}>💰 Best Performing Price Bands</h4>
                    <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
                      {mockInsights.priceBands.map((item, index) => (
                        <div key={index} className="card" style={{ textAlign: "center", border: "1px solid var(--border)", background: "white" }}>
                          <div className="card-body">
                            <div style={{ fontSize: "1.75rem", fontWeight: "bold", color: "var(--primary)", marginBottom: "0.25rem" }}>
                              {item.percentage}%
                            </div>
                            <div className="text-muted" style={{ fontSize: "0.9rem" }}>{item.range}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "audience" && (
              <div>
                <div style={{ marginBottom: "2rem" }}>
                  <h3 className="bold" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>🎯 Target Audience Suggestions</h3>
                  <div className="card" style={{ 
                    background: "linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(167, 212, 155, 0.15) 100%)", 
                    border: "1px solid rgba(20, 184, 166, 0.3)" 
                  }}>
                    <div className="card-body">
                      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                        {mockInsights.targetAudience.map((audience, index) => (
                          <li key={index} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}>
                            <span style={{ 
                              width: "8px", 
                              height: "8px", 
                              background: "var(--primary)", 
                              borderRadius: "50%", 
                              flexShrink: 0 
                            }}></span>
                            <span style={{ fontWeight: "500" }}>{audience}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="bold" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>📢 Recommended Channels</h3>
                  <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
                    {mockInsights.recommendedChannels.map((channel, index) => (
                      <div key={index} className="card" style={{ border: "1px solid var(--border)" }}>
                        <div className="card-body">
                          <h4 className="bold" style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>{channel.name}</h4>
                          <p className="text-muted" style={{ fontSize: "0.9rem", margin: 0 }}>{channel.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "timing" && (
              <div>
                <h3 className="bold" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>⏰ Best Timing for Maximum Impact</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {mockInsights.bestTiming.map((timing, index) => (
                    <div
                      key={index}
                      className="card"
                      style={{ 
                        background: "linear-gradient(135deg, rgba(244, 177, 131, 0.2) 0%, rgba(244, 177, 131, 0.1) 100%)",
                        border: "1px solid rgba(244, 177, 131, 0.4)"
                      }}
                    >
                      <div className="card-body" style={{ display: "flex", alignItems: "start", gap: "0.75rem" }}>
                        <span style={{ fontSize: "1.5rem" }}>⏰</span>
                        <p style={{ margin: 0, flex: 1, fontWeight: "500" }}>{timing}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default ArtisanDashboard