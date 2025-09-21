"use client"

import React from "react"
import ReactRouterDOM from "react-router-dom"

const { isValidAadhaar } = window.Validators

window.ArtisanProfileWizard = function ArtisanProfileWizard() {
  const navigate = ReactRouterDOM.useNavigate()
  const [step, setStep] = React.useState(1)
  const [data, setData] = React.useState({
    fullName: "",
    age: "",
    gender: "",
    phone: "",
    whatsapp: true,
    email: "",
    village: "",
    city: "",
    state: "",
    pincode: "",
    languages: "",
    aadhaar: "",
    craftType: "",
    materials: "",
    experience: "",
    story: "",
    profilePhoto: "",
    samples: [],
    video: "",
    priceRange: "₹500–₹1000",
    selling: "National",
    delivery: "Self-arranged",
  })

  const craftTypes = ["Pottery", "Handloom", "Painting", "Embroidery", "Woodwork", "Jewelry", "Bamboo"]
  const priceRanges = ["₹200–₹500", "₹500–₹1000", "₹1000–₹2500", "₹2500+"]
  const states = window.INDIA_REGIONS?.includes("Delhi")
    ? window.INDIA_REGIONS
    : [
        "Maharashtra",
        "Karnataka",
        "Tamil Nadu",
        "Gujarat",
        "Punjab",
        "Uttar Pradesh",
        "Bihar",
        "West Bengal",
        "Delhi",
        "Kerala",
        "Rajasthan",
        "Telangana",
        "Assam",
        "Odisha",
        "Jammu & Kashmir",
        "Madhya Pradesh",
      ]

  function onPickProfile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setData((d) => ({ ...d, profilePhoto: reader.result }))
    reader.readAsDataURL(file)
  }
  function onPickSamples(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const readers = files.map(
      (f) =>
        new Promise((res) => {
          const r = new FileReader()
          r.onload = () => res(r.result)
          r.readAsDataURL(f)
        }),
    )
    Promise.all(readers).then((imgs) => setData((d) => ({ ...d, samples: imgs.slice(0, 5) })))
  }

  function next() {
    setStep((s) => Math.min(4, s + 1))
  }
  function prev() {
    setStep((s) => Math.max(1, s - 1))
  }
  function saveAndFinish() {
    if (!isValidAadhaar(data.aadhaar)) return alert("Please enter a valid 12-digit Aadhaar number.")
    const session = window.StorageAPI.getSession()
    window.StorageAPI.saveProfile("artisan", data)
    window.StorageAPI.setSession({ ...session, profileComplete: true })
    navigate("/artisan")
  }

  return (
    <main className="container" style={{ paddingTop: "1rem" }}>
      <h2>Artisan Profile Setup</h2>
      <div className="helptext">Step {step} of 4</div>

      <div className="card card-body" style={{ display: "grid", gap: "0.6rem", marginTop: "0.5rem" }}>
        {step === 1 && (
          <>
            <h3>Basic Info & Location</h3>
            <div className="filters-row">
              <div style={{ flex: 1 }}>
                <label className="label">Full Name</label>
                <input
                  className="input"
                  value={data.fullName}
                  onChange={(e) => setData({ ...data, fullName: e.target.value })}
                />
              </div>
              <div style={{ width: 160 }}>
                <label className="label">Age</label>
                <input className="input" value={data.age} onChange={(e) => setData({ ...data, age: e.target.value })} />
              </div>
              <div style={{ width: 200 }}>
                <label className="label">Gender (optional)</label>
                <select
                  className="select"
                  value={data.gender}
                  onChange={(e) => setData({ ...data, gender: e.target.value })}
                >
                  <option value="">Prefer not to say</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>

            <div className="filters-row">
              <div style={{ flex: 1 }}>
                <label className="label">Phone</label>
                <input
                  className="input"
                  value={data.phone}
                  onChange={(e) => setData({ ...data, phone: e.target.value })}
                  placeholder="WhatsApp reachable number"
                />
                <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 6 }}>
                  <input
                    type="checkbox"
                    checked={!!data.whatsapp}
                    onChange={(e) => setData({ ...data, whatsapp: e.target.checked })}
                  />{" "}
                  WhatsApp
                </label>
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Email (optional)</label>
                <input
                  className="input"
                  value={data.email}
                  onChange={(e) => setData({ ...data, email: e.target.value })}
                />
              </div>
            </div>

            <div className="filters-row">
              <div style={{ flex: 1 }}>
                <label className="label">Village / Town / City</label>
                <input
                  className="input"
                  value={data.city}
                  onChange={(e) => setData({ ...data, city: e.target.value })}
                />
              </div>
              <div style={{ width: 220 }}>
                <label className="label">State</label>
                <select
                  className="select"
                  value={data.state}
                  onChange={(e) => setData({ ...data, state: e.target.value })}
                >
                  <option value="">Select state</option>
                  {states.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ width: 160 }}>
                <label className="label">Pincode</label>
                <input
                  className="input"
                  value={data.pincode}
                  onChange={(e) => setData({ ...data, pincode: e.target.value })}
                />
              </div>
            </div>

            <div className="filters-row">
              <div style={{ flex: 1 }}>
                <label className="label">Languages</label>
                <input
                  className="input"
                  placeholder="Marathi, Hindi, English"
                  value={data.languages}
                  onChange={(e) => setData({ ...data, languages: e.target.value })}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="label">Aadhaar (12 digits)</label>
                <input
                  className="input"
                  value={data.aadhaar}
                  onChange={(e) => setData({ ...data, aadhaar: e.target.value })}
                />
                <small className="helptext">
                  {data.aadhaar.length
                    ? isValidAadhaar(data.aadhaar)
                      ? "Aadhaar looks valid."
                      : "Invalid Aadhaar."
                    : ""}
                </small>
              </div>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h3>Craft & Story</h3>
            <div className="filters-row">
              <div style={{ flex: 1 }}>
                <label className="label">Type of Craft</label>
                <select
                  className="select"
                  value={data.craftType}
                  onChange={(e) => setData({ ...data, craftType: e.target.value })}
                >
                  <option value="">Select craft</option>
                  {craftTypes.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ width: 220 }}>
                <label className="label">Years of Experience</label>
                <input
                  className="input"
                  value={data.experience}
                  onChange={(e) => setData({ ...data, experience: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="label">Materials Used</label>
              <input
                className="input"
                placeholder="cotton, clay, bamboo..."
                value={data.materials}
                onChange={(e) => setData({ ...data, materials: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Short Story (or attach voice note)</label>
              <textarea
                className="textarea"
                rows="4"
                value={data.story}
                onChange={(e) => setData({ ...data, story: e.target.value })}
              />
              <input
                className="input"
                type="file"
                accept="audio/*"
                onChange={(e) => alert("Voice note uploaded (placeholder).")}
                style={{ marginTop: 8 }}
              />
              <small className="helptext">AI can convert your voice note into a bio later.</small>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h3>Showcase</h3>
            <div>
              <label className="label">Upload 3–5 sample images</label>
              <input className="input" type="file" multiple accept="image/*" onChange={onPickSamples} />
              <div className="products-grid" style={{ marginTop: 8 }}>
                {data.samples.map((s, idx) => (
                  <div key={idx} className="card">
                    <img className="product-img" src={s || "/placeholder.svg"} alt={"Sample " + (idx + 1)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="filters-row">
              <div>
                <label className="label">Average Price Range</label>
                <select
                  className="select"
                  value={data.priceRange}
                  onChange={(e) => setData({ ...data, priceRange: e.target.value })}
                >
                  {priceRanges.map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Selling Preference</label>
                <select
                  className="select"
                  value={data.selling}
                  onChange={(e) => setData({ ...data, selling: e.target.value })}
                >
                  <option>Local</option>
                  <option>National</option>
                  <option>International</option>
                </select>
              </div>
              <div>
                <label className="label">Delivery Option</label>
                <select
                  className="select"
                  value={data.delivery}
                  onChange={(e) => setData({ ...data, delivery: e.target.value })}
                >
                  <option>Self-arranged</option>
                  <option>Need Help with Logistics</option>
                </select>
              </div>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <h3>Profile Photo</h3>
            <p className="helptext">Add a profile picture or shop logo.</p>
            <div className="filters-row">
              <div>
                <input className="input" type="file" accept="image/*" onChange={onPickProfile} />
              </div>
              {data.profilePhoto && (
                <img
                  src={data.profilePhoto || "/placeholder.svg"}
                  alt="Profile"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 12,
                    objectFit: "cover",
                    border: "1px solid var(--border)",
                  }}
                />
              )}
            </div>
          </>
        )}

        <div className="filters-row">
          {step > 1 && (
            <button className="btn" onClick={prev}>
              Back
            </button>
          )}
          {step < 4 && (
            <button className="btn btn-primary" onClick={next}>
              Next
            </button>
          )}
          {step === 4 && (
            <button className="btn btn-accent" onClick={saveAndFinish}>
              Finish
            </button>
          )}
        </div>
      </div>
    </main>
  )
}

window.ArtisanProfileWizard = window.ArtisanProfileWizard
