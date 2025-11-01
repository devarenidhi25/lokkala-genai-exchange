"use client"

import React, { useState, useEffect } from "react"
import { TrendingUp, Target, Calendar, Upload, RefreshCw, Clock, Package } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { getFirestore, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore"
import { auth, storage } from "../firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import CatalogPromotion from "../components/CatalogPromotion"

const API_BASE = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000"

// Helper function to format reasoning text
const formatReasoning = (text) => {
  if (!text) return null;

  const sections = text
    .split('*')
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {sections.slice(0, 5).map((section, idx) => {
        // Bold heading pattern "**Heading:** rest"
        const boldMatch = section.match(/^\*\*([^:]+):\*\*(.+)/);
        if (boldMatch) {
          return (
            <div key={idx}>
              <strong style={{ color: "var(--primary)" }}>
                {boldMatch[1]}:
              </strong>
              <p style={{ color: "#555", marginTop: "2px" }}>
                {boldMatch[2].trim()}
              </p>
            </div>
          );
        }

        // Normal bullet
        return (
          <div key={idx} style={{ color: "#444" }}>
            • {section}
          </div>
        );
      })}
    </div>
  );
};


function ArtisanDashboard() {
  const navigate = useNavigate()
  const db = getFirestore()

  const [activeTab, setActiveTab] = useState("audience")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showBestTimeModal, setShowBestTimeModal] = useState(false)
  const [showProductAnalysisModal, setShowProductAnalysisModal] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  // Analytics state
  const [insights, setInsights] = useState(null)
  const [loadingInsights, setLoadingInsights] = useState(true)
  const [insightsError, setInsightsError] = useState(null)
  
  // Best Time Analysis state (manual input)
  const [bestTimeData, setBestTimeData] = useState(null)
  const [loadingBestTime, setLoadingBestTime] = useState(false)
  const [btProductName, setBtProductName] = useState("")
  const [btCategory, setBtCategory] = useState("")
  const [btKeywords, setBtKeywords] = useState("")
  
  // Product Analysis state (existing products)
  const [products, setProducts] = useState([])
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [productAnalysis, setProductAnalysis] = useState({})
  const [analyzingProduct, setAnalyzingProduct] = useState(null)
  
  // Upload form state
  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [productImages, setProductImages] = useState([])
  const [imageFiles, setImageFiles] = useState([])

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser)
      
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid))
          if (userDoc.exists()) {
            const userData = userDoc.data()
            setProfile(userData)
            
            // Load existing products
            if (userData.products && userData.products.length > 0) {
              setProducts(userData.products)
            }
            
            fetchInsights(currentUser.uid)
          }
        } catch (error) {
          console.error("Error fetching profile:", error)
        }
      }
    })
    return () => unsubscribe()
  }, [db])

  async function fetchInsights(artisanId, forceRefresh = false) {
    setLoadingInsights(true)
    setInsightsError(null)
    
    try {
      const url = `${API_BASE}/api/analytics/insights/${artisanId}${forceRefresh ? '?refresh=true' : ''}`
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.statusText}`)
      }
      
      const data = await response.json()
      setInsights(data)
    } catch (error) {
      console.error("Error fetching insights:", error)
      setInsightsError(error.message)
      
      // Fallback to mock data
      setInsights({
        target_audience_data: {
          target_audience: [
            "Women aged 25-34",
            "Metropolitan areas (Mumbai, Delhi, Bangalore)",
            "Festival shoppers and gift buyers"
          ]
        },
        timing_data: {
          best_timing: [
            "Post between 7-9 PM for maximum reach",
            "Thursdays and Fridays show 30% higher engagement",
            "2 weeks before festivals for promotional content"
          ]
        },
        price_data: {
          price_bands: [
            { range: "₹2000-5000", percentage: 45 },
            { range: "₹5000-10000", percentage: 35 },
            { range: "₹10000+", percentage: 20 }
          ]
        },
        key_insights: [
          { icon: "📈", text: "Your handwoven products got 40% more clicks", trend: "up" },
          { icon: "🎉", text: "Festival-related keywords increased reach by 25%", trend: "up" },
          { icon: "⭐", text: "Products priced ₹2000-5000 have highest conversion", trend: "neutral" }
        ],
        recommended_channels: [
          { name: "Instagram Reels", reason: "High engagement for visual products" },
          { name: "Pinterest Boards", reason: "Strong discovery for traditional wear" },
          { name: "WhatsApp Business", reason: "Direct customer communication" }
        ]
      })
    } finally {
      setLoadingInsights(false)
    }
  }

  async function analyzeProduct(product, index) {
    setAnalyzingProduct(index)
    
    try {
      // Extract keywords from product name and description
      const keywords = [
        ...product.name.toLowerCase().split(' ').filter(w => w.length > 3),
        ...(product.description ? product.description.toLowerCase().split(' ').filter(w => w.length > 3).slice(0, 3) : [])
      ].slice(0, 5)
      
      const response = await fetch(`${API_BASE}/api/best-time/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: product.name,
          category: "Handicraft", // You can enhance this by adding category field to products
          keywords: keywords,
          hashtags: keywords.map(k => `#${k}`)
        })
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      setProductAnalysis(prev => ({
        ...prev,
        [index]: result.data
      }))
      
    } catch (error) {
      console.error("Error analyzing product:", error)
      alert(`Analysis failed: ${error.message}`)
    } finally {
      setAnalyzingProduct(null)
    }
  }

  async function analyzeBestTime() {
    if (!btProductName || !btCategory || !btKeywords) {
      alert("Please fill all fields")
      return
    }

    setLoadingBestTime(true)

    try {
      const keywords = btKeywords.split(',').map(k => k.trim()).filter(k => k)
      
      const response = await fetch(`${API_BASE}/api/best-time/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_name: btProductName,
          category: btCategory,
          keywords: keywords,
          hashtags: keywords.map(k => `#${k}`)
        })
      })

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`)
      }

      const result = await response.json()
      setBestTimeData(result.data)
      
    } catch (error) {
      console.error("Error analyzing best time:", error)
      alert(`Analysis failed: ${error.message}`)
    } finally {
      setLoadingBestTime(false)
    }
  }

  function handleImageSelect(e) {
    const files = Array.from(e.target.files || [])
    setImageFiles(files)
    
    const readers = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result)
        reader.readAsDataURL(file)
      })
    })
    
    Promise.all(readers).then(images => setProductImages(images))
  }

  async function handleUploadProduct() {
    if (!user) {
      alert("Please sign in to upload products")
      return
    }

    if (!productName || !productPrice || imageFiles.length === 0) {
      alert("Please fill all required fields and upload at least one image")
      return
    }

    setUploading(true)

    try {
      if (!storage) {
        throw new Error("Firebase Storage is not initialized.")
      }

      const imageUrls = []
      for (let index = 0; index < imageFiles.length; index++) {
        const file = imageFiles[index]
        const timestamp = Date.now()
        const fileName = `${timestamp}_${index}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const storagePath = `products/${user.uid}/${fileName}`
        
        const storageRef = ref(storage, storagePath)
        await uploadBytes(storageRef, file)
        const downloadURL = await getDownloadURL(storageRef)
        imageUrls.push(downloadURL)
      }

      const product = {
        name: productName,
        price: parseFloat(productPrice),
        description: productDescription,
        images: imageUrls,
        uploadedAt: new Date().toISOString(),
        artisanId: user.uid
      }

      const userRef = doc(db, "users", user.uid)
      await updateDoc(userRef, {
        products: arrayUnion(product)
      })

      alert("✅ Product uploaded successfully!")
      
      // Refresh products list
      const updatedDoc = await getDoc(userRef)
      if (updatedDoc.exists()) {
        setProducts(updatedDoc.data().products || [])
      }
      
      setProductName("")
      setProductPrice("")
      setProductDescription("")
      setProductImages([])
      setImageFiles([])
      setShowUploadModal(false)
    } catch (error) {
      console.error("Upload failed:", error)
      alert(`Upload failed: ${error.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <main className="container">
      <section className="mt-4">
        <div className="card animate-slide-up">
          <div className="card-body">
            <h2 className="bold">Welcome, Artisan!</h2>
            <p className="text-muted">Choose how you want to boost your brand today:</p>
            <div className="grid mt-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/caption-generator")}
              >
                📝 Caption Generator
              </button>
              <button
                className="btn btn-success"
                onClick={() => navigate("/social-agent")}
              >
                📲 Social Media Agent
              </button>
              {/* <button
                className="btn btn-primary"
                onClick={() => setShowBestTimeModal(true)}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}
              >
                <Clock style={{ width: "20px", height: "20px" }} />
                Best Time to Post
              </button> */}
              {/* {products.length > 0 && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowProductAnalysisModal(true)}
                  style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}
                >
                  <Package style={{ width: "20px", height: "20px" }} />
                  My Products Analysis
                </button>
              )} */}
              <button
                className="btn btn-primary"
                onClick={() => setShowUploadModal(true)}
                style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}
              >
                <Upload style={{ width: "20px", height: "20px" }} />
                Upload Products
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4">
        <CatalogPromotion 
          artisanId={user?.uid}
          artisanName={profile?.displayName || user?.email?.split('@')[0]}
        />
      </section>

      {/* Product Analysis Modal */}
      {showProductAnalysisModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem",
          overflow: "auto"
        }}>
          <div className="card" style={{ 
            maxWidth: "900px", 
            width: "100%", 
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            margin: "auto"
          }}>
            <div className="card-body" style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              borderBottom: "1px solid var(--border)",
              padding: "1rem 1.5rem",
              flexShrink: 0
            }}>
              <h3 className="bold" style={{ margin: 0 }}>📦 My Products - Best Time Analysis</h3>
              <button
                onClick={() => setShowProductAnalysisModal(false)}
                className="btn"
                style={{ padding: "0.25rem 0.75rem" }}
              >
                ✕
              </button>
            </div>

            <div style={{ 
              overflowY: "auto", 
              padding: "1.5rem",
              flex: 1
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {products.map((product, index) => (
                  <div key={index} className="card" style={{ border: "1px solid var(--border)" }}>
                    <div className="card-body">
                      <div style={{ display: "flex", gap: "1rem", alignItems: "start" }}>
                        {product.images && product.images[0] && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "8px", flexShrink: 0 }}
                          />
                        )}
                        
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 className="bold" style={{ marginBottom: "0.25rem" }}>{product.name}</h4>
                          <p className="text-muted" style={{ fontSize: "0.9rem", marginBottom: "0.5rem" }}>
                            ₹{product.price}
                          </p>
                          {product.description && (
                            <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.5rem" }}>
                              {product.description.slice(0, 100)}...
                            </p>
                          )}
                          
                          {!productAnalysis[index] ? (
                            <button
                              className="btn btn-primary"
                              onClick={() => analyzeProduct(product, index)}
                              disabled={analyzingProduct === index}
                              style={{ marginTop: "0.5rem", fontSize: "0.9rem", padding: "0.5rem 1rem" }}
                            >
                              {analyzingProduct === index ? "Analyzing..." : "🔍 Analyze Best Time"}
                            </button>
                          ) : (
                            <div style={{ marginTop: "1rem", padding: "1rem", background: "#f0f9ff", borderRadius: "8px" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                                <div>
                                  <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>Best Time</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "var(--primary)" }}>
                                    {productAnalysis[index].best_time_to_post}
                                  </div>
                                </div>
                                
                                <div>
                                  <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>Expected Boost</div>
                                  <div style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#10b981" }}>
                                    {productAnalysis[index].expected_engagement_improvement}
                                  </div>
                                </div>
                                
                                {productAnalysis[index].target_region && (
                                  <div>
                                    <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.25rem" }}>Target Regions</div>
                                    <div style={{ fontSize: "0.9rem" }}>
                                      {productAnalysis[index].target_region.slice(0, 2).join(", ")}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              {productAnalysis[index].reasoning && (
                                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "white", borderRadius: "6px", borderLeft: "3px solid var(--primary)" }}>
                                  <div style={{ fontSize: "0.85rem", fontWeight: "600", marginBottom: "0.5rem" }}>💡 Why this timing works:</div>
                                  <div style={{ fontSize: "0.85rem", color: "#666", lineHeight: "1.6" }}>
                                    {formatReasoning(productAnalysis[index].reasoning)}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ 
              padding: "1rem 1.5rem", 
              borderTop: "1px solid var(--border)",
              flexShrink: 0
            }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowProductAnalysisModal(false)}
                style={{ width: "100%" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Best Time Modal (Manual Input) */}
      {showBestTimeModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div className="card" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflow: "auto" }}>
            <div className="card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 className="bold" style={{ margin: 0 }}>⏰ Best Time to Post (New Product)</h3>
                <button
                  onClick={() => {
                    setShowBestTimeModal(false)
                    setBestTimeData(null)
                    setBtProductName("")
                    setBtCategory("")
                    setBtKeywords("")
                  }}
                  className="btn"
                  style={{ padding: "0.25rem 0.75rem" }}
                >
                  ✕
                </button>
              </div>

              {!bestTimeData ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label className="label">Product Name *</label>
                    <input
                      className="input"
                      value={btProductName}
                      onChange={(e) => setBtProductName(e.target.value)}
                      placeholder="e.g., Hand-painted Terracotta Pots"
                    />
                  </div>

                  <div>
                    <label className="label">Category *</label>
                    <input
                      className="input"
                      value={btCategory}
                      onChange={(e) => setBtCategory(e.target.value)}
                      placeholder="e.g., Home Decor"
                    />
                  </div>

                  <div>
                    <label className="label">Keywords * (comma-separated)</label>
                    <input
                      className="input"
                      value={btKeywords}
                      onChange={(e) => setBtKeywords(e.target.value)}
                      placeholder="e.g., terracotta, handmade, clay"
                    />
                  </div>

                  <div className="form-actions" style={{ marginTop: "1rem" }}>
                    <button
                      className="btn"
                      onClick={() => setShowBestTimeModal(false)}
                      disabled={loadingBestTime}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={analyzeBestTime}
                      disabled={loadingBestTime}
                    >
                      {loadingBestTime ? "Analyzing..." : "Analyze"}
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ padding: "1rem", background: "#f0f9ff", borderRadius: "8px", textAlign: "center" }}>
                    <h4 className="bold">{bestTimeData.product}</h4>
                    <p className="text-muted" style={{ fontSize: "0.9rem" }}>{bestTimeData.category}</p>
                  </div>

                  <div style={{ padding: "1.5rem", background: "var(--primary)", color: "white", borderRadius: "8px", textAlign: "center" }}>
                    <div style={{ fontSize: "0.9rem", marginBottom: "0.5rem", opacity: 0.9 }}>Best Time to Post</div>
                    <div style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
                      {bestTimeData.best_time_to_post}
                    </div>
                    <div style={{ fontSize: "0.95rem" }}>
                      Expected boost: {bestTimeData.expected_engagement_improvement}
                    </div>
                  </div>

                  <div>
                    <h4 className="bold" style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🎯 Target Regions</h4>
                    <p>{bestTimeData.target_region.join(", ")}</p>
                  </div>

                  {bestTimeData.season_spike && bestTimeData.season_spike.length > 0 && (
                    <div>
                      <h4 className="bold" style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>📈 Season Spikes</h4>
                      <p>{bestTimeData.season_spike.join(", ")}</p>
                    </div>
                  )}

                  {bestTimeData.festivals && bestTimeData.festivals.length > 0 && (
                    <div>
                      <h4 className="bold" style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>🎉 Festivals</h4>
                      <p>{bestTimeData.festivals.join(", ")}</p>
                    </div>
                  )}

                  {bestTimeData.reasoning && (
                    <div style={{ padding: "1rem", background: "#f9fafb", borderRadius: "8px", borderLeft: "4px solid var(--primary)" }}>
                      <h4 className="bold" style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>💡 Why this timing works:</h4>
                      <div style={{ fontSize: "0.9rem", margin: 0, lineHeight: "1.6" }}>
                        {formatReasoning(bestTimeData.reasoning)}
                      </div>
                    </div>
                  )}

                  <div className="form-actions">
                    <button
                      className="btn"
                      onClick={() => {
                        setBestTimeData(null)
                        setBtProductName("")
                        setBtCategory("")
                        setBtKeywords("")
                      }}
                    >
                      Analyze Another
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowBestTimeModal(false)}
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div className="card" style={{ maxWidth: "600px", width: "100%", maxHeight: "90vh", overflow: "auto" }}>
            <div className="card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 className="bold" style={{ margin: 0 }}>Upload New Product</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="btn"
                  style={{ padding: "0.25rem 0.75rem" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="label">Product Name *</label>
                  <input
                    className="input"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder="e.g., Handwoven Cotton Saree"
                  />
                </div>

                <div>
                  <label className="label">Price (₹) *</label>
                  <input
                    className="input"
                    type="number"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="e.g., 2500"
                  />
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="textarea"
                    rows="3"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder="Describe your product..."
                  />
                </div>

                <div>
                  <label className="label">Product Images * (Max 5)</label>
                  <input
                    className="input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageSelect}
                  />
                  {productImages.length > 0 && (
                    <div className="grid mt-3" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                      {productImages.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Product ${i + 1}`}
                          style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "8px" }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions" style={{ marginTop: "1rem" }}>
                  <button
                    className="btn"
                    onClick={() => setShowUploadModal(false)}
                    disabled={uploading}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleUploadProduct}
                    disabled={uploading}
                  >
                    {uploading ? "Uploading..." : "Upload Product"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Market Insights Section */}
      <section className="mt-4 animate-slide-up-delayed">
        <div className="card">
          <div className="card-body" style={{ 
            background: "linear-gradient(135deg, var(--primary) 0%, #0ea5a4 100%)", 
            color: "white", 
            padding: "1.5rem",
            borderTopLeftRadius: "14px",
            borderTopRightRadius: "14px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 className="bold" style={{ display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
                  <TrendingUp style={{ width: "24px", height: "24px" }} />
                  Your Artisan Insights
                </h2>
                <p style={{ margin: "0.5rem 0 0 0", opacity: 0.95, fontSize: "0.95rem" }}>
                  {loadingInsights ? "Loading analytics..." : insightsError ? "Using sample data" : "Real-time market trends from BigQuery"}
                </p>
              </div>
              <button
                className="btn"
                onClick={() => user && fetchInsights(user.uid, true)}
                disabled={loadingInsights}
                style={{
                  background: "rgba(255,255,255,0.2)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                <RefreshCw style={{ width: "16px", height: "16px" }} />
                Refresh
              </button>
            </div>
          </div>

          <div style={{ borderBottom: "1px solid var(--border)", display: "flex", gap: 0, background: "white" }}>
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

          <div className="card-body">
            {loadingInsights ? (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <p className="text-muted">Loading insights...</p>
              </div>
            ) : (
              <>
                {activeTab === "audience" && insights && (
                  <div>
                    <div style={{ marginBottom: "2rem" }}>
                      <h3 className="bold" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>🎯 Target Audience</h3>
                      <div className="card" style={{ 
                        background: "linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(167, 212, 155, 0.15) 100%)", 
                        border: "1px solid rgba(20, 184, 166, 0.3)" 
                      }}>
                        <div className="card-body">
                          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                            {insights.target_audience_data.target_audience.map((audience, index) => (
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
                        {insights.recommended_channels.map((channel, index) => (
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

                {activeTab === "timing" && insights && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "1rem",
                        marginBottom: "1.5rem",
                      }}
                    >
                      {products.length > 0 && (
                        <button
                          className="btn btn-primary"
                          onClick={() => setShowProductAnalysisModal(true)}
                          style={{
                            flex: "1 1 220px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.5rem",
                            padding: "0.75rem 1rem",
                          }}
                        >
                          <Package style={{ width: "20px", height: "20px" }} />
                          My Products Analysis
                        </button>
                      )}

                      <button
                        className="btn btn-primary"
                        onClick={() => setShowBestTimeModal(true)}
                        style={{
                          flex: "1 1 220px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.5rem",
                          padding: "0.75rem 1rem",
                        }}
                      >
                        <Clock style={{ width: "20px", height: "20px" }} />
                        Best Time to Post
                      </button>
                    </div>

                    <h3 className="bold" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>⏰ Best Timing</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                      {insights.timing_data.best_timing.map((timing, index) => (
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
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default ArtisanDashboard