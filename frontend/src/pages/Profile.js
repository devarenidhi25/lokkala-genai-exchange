"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { auth } from "../firebase"
import { getFirestore, doc, getDoc } from "firebase/firestore"
import { MapPin, Mail, Phone, Package, Calendar, Award } from "lucide-react"
import CatalogPromotion from "../components/CatalogPromotion"  // ✅ CORRECT

function Profile() {
  const navigate = useNavigate()
  const db = getFirestore()
  
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (!currentUser) {
        navigate("/signin")
        return
      }

      setUser(currentUser)

      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists()) {
          setProfile(userDoc.data())
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
      } finally {
        setLoading(false)
      }
    })

    return () => unsubscribe()
  }, [navigate, db])

  if (loading) {
    return (
      <main className="container">
        <div className="card mt-4">
          <div className="card-body" style={{ textAlign: "center", padding: "2rem" }}>
            <p>Loading profile...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!profile) {
    return (
      <main className="container">
        <div className="card mt-4">
          <div className="card-body" style={{ textAlign: "center", padding: "2rem" }}>
            <p>Profile not found. Please complete your profile setup.</p>
            <button 
              className="btn btn-primary mt-3"
              onClick={() => navigate("/profile-setup/customer")}
            >
              Setup Profile
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Render Artisan Profile
  if (profile.type === "artisan") {
    return (
      <main className="container">
        <section className="mt-4">
          {/* Profile Header */}
          <div className="card">
            <div className="card-body" style={{ 
              background: "linear-gradient(135deg, var(--primary) 0%, #0ea5a4 100%)", 
              color: "white",
              padding: "2rem"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
                {profile.profilePhoto ? (
                  <img
                    src={profile.profilePhoto}
                    alt="Profile"
                    style={{
                      width: "120px",
                      height: "120px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      border: "4px solid white",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
                    }}
                  />
                ) : (
                  <div style={{
                    width: "120px",
                    height: "120px",
                    borderRadius: "50%",
                    background: "white",
                    color: "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "3rem",
                    fontWeight: "bold",
                    border: "4px solid white"
                  }}>
                    {profile.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                
                <div style={{ flex: 1 }}>
                  <h2 className="bold" style={{ margin: 0, marginBottom: "0.5rem" }}>
                    {profile.displayName || user?.email?.split('@')[0]}
                  </h2>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", opacity: 0.95 }}>
                    <Award style={{ width: "18px", height: "18px" }} />
                    <span style={{ textTransform: "capitalize" }}>{profile.craftType} Artisan</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", opacity: 0.95 }}>
                    <MapPin style={{ width: "18px", height: "18px" }} />
                    <span>{profile.village}, {profile.state} - {profile.pincode}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.95 }}>
                    <Mail style={{ width: "18px", height: "18px" }} />
                    <span>{user?.email}</span>
                  </div>
                  
                  {/* Go to Dashboard Button */}
                  <button
                    className="btn btn-primary"
                    onClick={() => navigate("/artisan")}
                    title="Access your artisan tools, manage products, and view analytics"
                    style={{
                      marginTop: "1rem",
                      background: "white",
                      color: "var(--primary)",
                      border: "2px solid white",
                      fontWeight: "600",
                      padding: "0.75rem 1.5rem"
                    }}
                  >
                    🚀 Go to Artisan Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <CatalogPromotion 
              artisanId={user?.uid} 
              artisanName={profile.displayName || user?.email?.split('@')[0]}
            />
          </div>

          {/* Profile Details */}
          <div className="grid mt-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
            <div className="card">
              <div className="card-body">
                <h3 className="bold" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                  📖 About My Craft
                </h3>
                <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>
                  {profile.story || "No story added yet."}
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div className="badge" style={{ background: "var(--bg-secondary)", padding: "0.5rem 1rem" }}>
                    🎨 {profile.craftType}
                  </div>
                  <div className="badge" style={{ background: "var(--bg-secondary)", padding: "0.5rem 1rem" }}>
                    ⭐ {profile.experience} years experience
                  </div>
                  <div className="badge" style={{ background: "var(--bg-secondary)", padding: "0.5rem 1rem" }}>
                    💰 {profile.priceRange}
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body">
                <h3 className="bold" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                  🛠️ Materials & Languages
                </h3>
                <div style={{ marginBottom: "1rem" }}>
                  <strong style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Materials Used:</strong>
                  <p style={{ margin: "0.25rem 0", textTransform: "capitalize" }}>
                    {profile.materials || "Not specified"}
                  </p>
                </div>
                <div>
                  <strong style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Languages Spoken:</strong>
                  <p style={{ margin: "0.25rem 0" }}>
                    {profile.languages || "Not specified"}
                  </p>
                </div>
                {profile.whatsapp && (
                  <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(37, 211, 102, 0.1)", borderRadius: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Phone style={{ width: "16px", height: "16px", color: "#25D366" }} />
                      <span style={{ fontSize: "0.9rem" }}>WhatsApp contact enabled</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sample Products from Profile Setup */}
          {profile.samples && profile.samples.length > 0 && (
            <div className="card mt-4">
              <div className="card-body">
                <h3 className="bold" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                  🖼️ Sample Work
                </h3>
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
                  {profile.samples.map((sample, index) => (
                    <img
                      key={index}
                      src={sample}
                      alt={`Sample ${index + 1}`}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        objectFit: "cover",
                        borderRadius: "12px",
                        border: "1px solid var(--border)"
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Uploaded Products */}
          {profile.products && profile.products.length > 0 && (
            <div className="card mt-4">
              <div className="card-body">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
                  <h3 className="bold" style={{ margin: 0, fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Package style={{ width: "20px", height: "20px" }} />
                    My Products ({profile.products.length})
                  </h3>
                </div>
                
                <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
                  {profile.products.map((product, index) => (
                    <div key={index} className="card" style={{ border: "1px solid var(--border)" }}>
                      {product.images && product.images[0] && (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          style={{
                            width: "100%",
                            aspectRatio: "4/3",
                            objectFit: "cover",
                            borderTopLeftRadius: "12px",
                            borderTopRightRadius: "12px"
                          }}
                        />
                      )}
                      <div className="card-body">
                        <h4 className="bold" style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
                          {product.name}
                        </h4>
                        {product.description && (
                          <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "0.75rem" }}>
                            {product.description}
                          </p>
                        )}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "1.25rem", fontWeight: "bold", color: "var(--primary)" }}>
                            ₹{product.price}
                          </span>
                          {product.uploadedAt && (
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                              {new Date(product.uploadedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {product.images && product.images.length > 1 && (
                          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                            {product.images.slice(1).map((img, imgIndex) => (
                              <img
                                key={imgIndex}
                                src={img}
                                alt={`${product.name} ${imgIndex + 2}`}
                                style={{
                                  width: "50px",
                                  height: "50px",
                                  objectFit: "cover",
                                  borderRadius: "6px",
                                  border: "1px solid var(--border)"
                                }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    )
  }

  // Render Customer Profile
  return (
    <main className="container">
      <section className="mt-4">
        {/* Profile Header */}
        <div className="card">
          <div className="card-body" style={{ 
            background: "linear-gradient(135deg, var(--primary) 0%, #0ea5a4 100%)", 
            color: "white",
            padding: "2rem"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "2rem", flexWrap: "wrap" }}>
              <div style={{
                width: "120px",
                height: "120px",
                borderRadius: "50%",
                background: "white",
                color: "var(--primary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "3rem",
                fontWeight: "bold",
                border: "4px solid white"
              }}>
                {profile.displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase()}
              </div>
              
              <div style={{ flex: 1 }}>
                <h2 className="bold" style={{ margin: 0, marginBottom: "0.5rem" }}>
                  {profile.displayName || user?.displayName || user?.email?.split('@')[0]}
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", opacity: 0.95 }}>
                  <MapPin style={{ width: "18px", height: "18px" }} />
                  <span>{profile.location} - {profile.pincode}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.95 }}>
                  <Mail style={{ width: "18px", height: "18px" }} />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="grid mt-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem" }}>
          <div className="card">
            <div className="card-body">
              <h3 className="bold" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                🎯 Shopping Preferences
              </h3>
              <div style={{ marginBottom: "1rem" }}>
                <strong style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Budget Preference:</strong>
                <p style={{ margin: "0.25rem 0", fontWeight: "600" }}>{profile.budget}</p>
              </div>
              <div>
                <strong style={{ fontSize: "0.9rem", color: "var(--muted)" }}>Shopping Purpose:</strong>
                <p style={{ margin: "0.25rem 0", fontWeight: "600" }}>{profile.purpose}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="bold" style={{ marginBottom: "1rem", fontSize: "1.1rem" }}>
                ❤️ Interested Categories
              </h3>
              {profile.cats && profile.cats.length > 0 ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                  {profile.cats.map((cat, index) => (
                    <span
                      key={index}
                      className="badge"
                      style={{
                        background: "var(--bg-secondary)",
                        padding: "0.5rem 1rem",
                        fontSize: "0.9rem"
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ color: "var(--muted)" }}>No categories selected</p>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default Profile