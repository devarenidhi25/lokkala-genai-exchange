"use client"

import React, { useState, useEffect } from "react"
import { TrendingUp, Target, Calendar, BarChart3, Upload, Package } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { getFirestore, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore"
import { auth, storage } from "../firebase"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

function ArtisanDashboard() {
  const navigate = useNavigate()
  const db = getFirestore()

  const [activeTab, setActiveTab] = useState("trends")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [user, setUser] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  // Upload form state
  const [productName, setProductName] = useState("")
  const [productPrice, setProductPrice] = useState("")
  const [productDescription, setProductDescription] = useState("")
  const [productImages, setProductImages] = useState([])
  const [imageFiles, setImageFiles] = useState([])

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

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
      console.log("=== UPLOAD STARTING ===")
      console.log("User UID:", user.uid)
      console.log("User Email:", user.email)
      console.log("Number of images:", imageFiles.length)
      console.log("Storage object:", storage)

      // Upload images to Firebase Storage
      const imageUrls = []
      for (let index = 0; index < imageFiles.length; index++) {
        const file = imageFiles[index]
        console.log(`\n--- Uploading image ${index + 1}/${imageFiles.length} ---`)
        console.log("File name:", file.name)
        console.log("File size:", file.size, "bytes")
        console.log("File type:", file.type)
        
        const timestamp = Date.now()
        const fileName = `${timestamp}_${index}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
        const storagePath = `products/${user.uid}/${fileName}`
        
        console.log("Storage path:", storagePath)
        
        try {
          const storageRef = ref(storage, storagePath)
          console.log("Storage ref created:", storageRef)
          
          console.log("Starting uploadBytes...")
          const uploadResult = await uploadBytes(storageRef, file)
          console.log("✅ Upload successful:", uploadResult.metadata.fullPath)
          
          console.log("Getting download URL...")
          const downloadURL = await getDownloadURL(storageRef)
          console.log("✅ Download URL obtained:", downloadURL)
          
          imageUrls.push(downloadURL)
        } catch (uploadError) {
          console.error("❌ Error uploading this specific image:")
          console.error("Error code:", uploadError.code)
          console.error("Error message:", uploadError.message)
          console.error("Full error:", uploadError)
          throw uploadError
        }
      }

      console.log("\n=== ALL IMAGES UPLOADED ===")
      console.log("Image URLs:", imageUrls)

      // Create product object
      const product = {
        name: productName,
        price: productPrice,
        description: productDescription,
        images: imageUrls,
        uploadedAt: new Date().toISOString(),
        artisanId: user.uid
      }

      console.log("\n=== SAVING TO FIRESTORE ===")
      console.log("Product object:", product)

      // Update user document with new product
      const userRef = doc(db, "users", user.uid)
      
      console.log("Checking if user document exists...")
      const userDoc = await getDoc(userRef)
      
      if (!userDoc.exists()) {
        console.error("❌ User document does not exist!")
        alert("Profile not found. Please complete your profile setup first.")
        setUploading(false)
        return
      }

      console.log("✅ User document exists")
      console.log("Current user data:", userDoc.data())
      
      console.log("Updating Firestore with new product...")
      await updateDoc(userRef, {
        products: arrayUnion(product)
      })

      console.log("✅✅✅ PRODUCT UPLOADED SUCCESSFULLY! ✅✅✅")
      alert("Product uploaded successfully!")
      
      // Reset form
      setProductName("")
      setProductPrice("")
      setProductDescription("")
      setProductImages([])
      setImageFiles([])
      setShowUploadModal(false)
    } catch (error) {
      console.error("\n❌❌❌ UPLOAD FAILED ❌❌❌")
      console.error("Error type:", error.constructor.name)
      console.error("Error code:", error.code)
      console.error("Error message:", error.message)
      console.error("Full error object:", error)
      console.error("Error stack:", error.stack)
      
      let errorMessage = "Error uploading product:\n\n"
      
      if (error.code === "storage/unauthorized") {
        errorMessage += "❌ Permission denied!\n\nYour Firebase Storage rules are blocking the upload.\n\nFix:\n1. Go to Firebase Console → Storage → Rules\n2. Update the rules as provided\n3. Click 'Publish'"
      } else if (error.code === "storage/canceled") {
        errorMessage += "Upload was canceled."
      } else if (error.code === "storage/unknown") {
        errorMessage += "Unknown storage error. Check:\n- Internet connection\n- Firebase Storage is enabled\n- Storage bucket URL is correct"
      } else if (error.code === "permission-denied") {
        errorMessage += "Firestore permission denied. Check your Firestore rules."
      } else {
        errorMessage += error.message
      }
      
      alert(errorMessage)
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
            <div className="grid mt-4" style={{ gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
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
              <button
                className="btn btn-primary"
                title="Upload new products to your catalog"
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