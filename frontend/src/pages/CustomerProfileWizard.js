"use client"

import React from "react"
import ReactRouterDOM from "react-router-dom"

window.CustomerProfileWizard = function CustomerProfileWizard() {
  const navigate = ReactRouterDOM.useNavigate()
  const [step, setStep] = React.useState(1)
  const [data, setData] = React.useState({
    fullName: "",
    contact: "",
    location: "",
    pincode: "",
    categories: [],
    budget: "Medium",
    purpose: "Personal",
  })
  const categories = ["Home Décor", "Clothing", "Accessories", "Paintings", "Handloom", "Jewelry", "Pottery"]
  function toggleCategory(cat) {
    setData((d) => {
      const has = d.categories.includes(cat)
      return { ...d, categories: has ? d.categories.filter((c) => c !== cat) : d.categories.concat(cat) }
    })
  }

  function next() {
    setStep((s) => Math.min(3, s + 1))
  }
  function prev() {
    setStep((s) => Math.max(1, s - 1))
  }
  function saveAndFinish() {
    const session = window.StorageAPI.getSession()
    window.StorageAPI.saveProfile("customer", data)
    window.StorageAPI.setSession({ ...session, profileComplete: true })
    navigate("/products")
  }

  return (
    <main className="container" style={{ paddingTop: "1rem" }}>
      <h2>Customer Profile Setup</h2>
      <div className="helptext">Step {step} of 3</div>
      <div className="card card-body" style={{ display: "grid", gap: "0.6rem", marginTop: "0.5rem" }}>
        {step === 1 && (
          <>
            <div>
              <label className="label">Full Name</label>
              <input
                className="input"
                value={data.fullName}
                onChange={(e) => setData({ ...data, fullName: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Email or Phone</label>
              <input
                className="input"
                value={data.contact}
                onChange={(e) => setData({ ...data, contact: e.target.value })}
              />
            </div>
            <div className="filters-row">
              <div style={{ flex: 1 }}>
                <label className="label">City</label>
                <input
                  className="input"
                  value={data.location}
                  onChange={(e) => setData({ ...data, location: e.target.value })}
                />
              </div>
              <div style={{ width: 180 }}>
                <label className="label">Pincode</label>
                <input
                  className="input"
                  value={data.pincode}
                  onChange={(e) => setData({ ...data, pincode: e.target.value })}
                />
              </div>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <div>
              <label className="label">Interested Categories</label>
              <div className="filters-row">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    className={"btn " + (data.categories.includes(cat) ? "btn-primary" : "")}
                    onClick={() => toggleCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="filters-row">
              <div>
                <label className="label">Budget</label>
                <select
                  className="select"
                  value={data.budget}
                  onChange={(e) => setData({ ...data, budget: e.target.value })}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>Premium</option>
                </select>
              </div>
              <div>
                <label className="label">Purpose</label>
                <select
                  className="select"
                  value={data.purpose}
                  onChange={(e) => setData({ ...data, purpose: e.target.value })}
                >
                  <option>Personal</option>
                  <option>Gifting</option>
                  <option>Reseller</option>
                  <option>NGO Bulk Buying</option>
                </select>
              </div>
            </div>
          </>
        )}
        {step === 3 && (
          <>
            <h3>Review</h3>
            <div className="helptext">Ensure your preferences look good.</div>
            <pre
              className="card"
              style={{
                padding: 12,
                background: "#f9fafb",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
                overflow: "auto",
              }}
            >
              {JSON.stringify(data, null, 2)}
            </pre>
          </>
        )}

        <div className="filters-row">
          {step > 1 && (
            <button className="btn" onClick={prev}>
              Back
            </button>
          )}
          {step < 3 && (
            <button className="btn btn-primary" onClick={next}>
              Next
            </button>
          )}
          {step === 3 && (
            <button className="btn btn-accent" onClick={saveAndFinish}>
              Finish
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
