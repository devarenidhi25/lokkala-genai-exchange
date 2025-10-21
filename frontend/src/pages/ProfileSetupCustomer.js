"use client"

import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getFirestore, doc, setDoc } from "firebase/firestore"
import { auth } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { AppStore } from "../utils/storage"

function ProfileSetupCustomer() {
  const navigate = useNavigate()
  const db = getFirestore()

  // auth state
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // profile fields
  const [location, setLocation] = useState("")
  const [pincode, setPincode] = useState("")
  const [cats, setCats] = useState([])
  const [budget, setBudget] = useState("Medium")
  const [purpose, setPurpose] = useState("Personal Purchase")

  // listen for firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  if (loading) {
    return (
      <main className="container">
        <p>Loading...</p>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="container">
        <p>Please sign in.</p>
      </main>
    )
  }

  const CATEGORY_OPTIONS = [
    "Home Décor",
    "Clothing",
    "Accessories",
    "Paintings",
    "Handloom",
    "Jewelry",
    "Pottery",
    "Woodwork",
  ]

  function toggleCat(c) {
    setCats((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  async function save() {
    if (!user) {
      alert("Please sign in first")
      return
    }

    setSaving(true)

    const profile = {
      type: "customer",
      location,
      pincode,
      cats,
      budget,
      purpose,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || "",
      createdAt: new Date().toISOString()
    }

    try {
      // 🔍 Debug log
      console.log("Saving profile for:", user.uid, profile)

      await setDoc(doc(db, "users", user.uid), profile)

      console.log("✅ Profile saved successfully")

      // Save locally
      AppStore.setProfile("customer", profile)
      AppStore.setUser({ uid: user.uid, email: user.email, role: "customer", displayName: user.displayName })

      // 👉 Navigate after save
      navigate("/products", { state: profile })
    } catch (err) {
      console.error("❌ Firestore error:", err)
      alert("Error saving profile: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="container">
      <section className="card mt-4">
        <div className="card-body">
          <h2 className="bold">Customer Profile</h2>
          <div className="row mt-3">
            <div>
              <label className="label">Location (City)</label>
              <input
                className="input"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City"
              />
            </div>
            <div>
              <label className="label">Pincode</label>
              <input
                className="input"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="560001"
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Interested Categories</label>
            <div className="grid" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
              {CATEGORY_OPTIONS.map((c) => (
                <label key={c} className="badge" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={cats.includes(c)} onChange={() => toggleCat(c)} /> {c}
                </label>
              ))}
            </div>
          </div>
          <div className="row mt-3">
            <div>
              <label className="label">Budget Preference</label>
              <select className="select" value={budget} onChange={(e) => setBudget(e.target.value)}>
                <option>Low</option>
                <option>Medium</option>
                <option>Premium</option>
              </select>
            </div>
            <div>
              <label className="label">Purpose</label>
              <select className="select" value={purpose} onChange={(e) => setPurpose(e.target.value)}>
                <option>Personal Purchase</option>
                <option>Gifting</option>
                <option>Reseller</option>
                <option>NGO Bulk Buying</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save & Continue"}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default ProfileSetupCustomer