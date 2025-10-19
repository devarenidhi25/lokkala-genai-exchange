"use client"
import React from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../firebase"
import { doc, setDoc } from "firebase/firestore"

function ProfileWizardCustomer() {
  const navigate = useNavigate()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [city, setCity] = React.useState("")
  const [pincode, setPincode] = React.useState("")
  const [categories, setCategories] = React.useState([])
  const [budget, setBudget] = React.useState("Medium")
  const [purpose, setPurpose] = React.useState("Personal Purchase")

  const toggleCat = (c) => {
    setCategories((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]))
  }

  async function save() {
    const user = auth.currentUser
    if (!user) return navigate("/")

    const profile = {
      name,
      email,
      phone,
      city,
      pincode,
      categories,
      budget,
      purpose,
      profileCompleted: true,
    }

    await setDoc(doc(db, "users", user.uid), {
      type: "customer",
      ...profile,
    })

    navigate("/products")
  }

  const allCats = ["Home Décor", "Clothing", "Accessories", "Paintings", "Handloom"]

  return (
    <section>
      <div className="container">
        <h1 className="h1">Customer Profile</h1>
        <div className="card">
          <div className="grid grid-2">
            <div className="field">
              <label className="label">Full Name</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Phone</label>
                <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid grid-3">
            <div className="field">
              <label className="label">City</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Pincode</label>
              <input className="input" value={pincode} onChange={(e) => setPincode(e.target.value)} />
            </div>
            <div className="field">
              <label className="label">Budget Preference</label>
              <select value={budget} onChange={(e) => setBudget(e.target.value)}>
                <option>Low</option>
                <option>Medium</option>
                <option>Premium</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label className="label">Interested Categories</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {allCats.map((c) => (
                <label key={c} className="badge" style={{ cursor: "pointer" }}>
                  <input type="checkbox" checked={categories.includes(c)} onChange={() => toggleCat(c)} /> {c}
                </label>
              ))}
            </div>
          </div>

          <div className="field">
            <label className="label">Purpose</label>
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
              <option>Personal Purchase</option>
              <option>Gifting</option>
              <option>Reseller</option>
              <option>NGO Bulk Buying</option>
            </select>
          </div>

          <button className="btn btn-primary" onClick={save}>
            Save and Continue
          </button>
        </div>
      </div>
    </section>
  )
}

export default ProfileWizardCustomer
