"use client"
import React from "react"
import { useNavigate } from "react-router-dom"
import { auth, db } from "../firebase"
import { doc, setDoc } from "firebase/firestore"

function ProfileWizardArtisan() {
  const navigate = useNavigate()
  const [step, setStep] = React.useState(1)

  // Step 1
  const [fullName, setFullName] = React.useState("")
  const [village, setVillage] = React.useState("")
  const [state, setState] = React.useState("")
  const [pincode, setPincode] = React.useState("")
  const [languages, setLanguages] = React.useState("Hindi, English")
  const [profilePhoto, setProfilePhoto] = React.useState("")

  // Step 2
  const [craft, setCraft] = React.useState("Handloom")
  const [experience, setExperience] = React.useState("2")
  const [story, setStory] = React.useState("")
  const [materials, setMaterials] = React.useState("Cotton, Bamboo")

  // Step 3
  const [images, setImages] = React.useState([])
  const [priceRange, setPriceRange] = React.useState("₹500–₹1000")

  // Step 4
  const [finalPhoto, setFinalPhoto] = React.useState("")

  const onImgUpload = (e) => {
    const files = Array.from(e.target.files || [])
    const readers = files.slice(0, 5).map(
      (f) =>
        new Promise((res) => {
          const r = new FileReader()
          r.onload = () => res(r.result)
          r.readAsDataURL(f)
        }),
    )
    Promise.all(readers).then(setImages)
  }

  const onSetProfile = (e, setter) => {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setter(r.result)
    r.readAsDataURL(f)
  }

  async function save() {
    const user = auth.currentUser
    if (!user) return navigate("/")

    const profile = {
      fullName,
      village,
      state,
      pincode,
      languages,
      profilePhoto,
      craft,
      experience,
      story,
      materials,
      images,
      priceRange,
      finalPhoto,
      profileCompleted: true,
    }

    await setDoc(doc(db, "users", user.uid), {
      type: "artisan",
      ...profile,
    })

    navigate("/artisan")
  }

  return (
    <section>
      <div className="container">
        <h1 className="h1">Artisan Profile Setup</h1>
        <div className="badge">Step {step} of 4</div>
        <div style={{ height: 12 }} />

        {step === 1 && (
          <div className="card">
            <h2 className="h2">Step 1: Basic Info</h2>
            <div className="grid grid-2">
              <div className="field">
                <label className="label">Full Name</label>
                <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Languages</label>
                <input className="input" value={languages} onChange={(e) => setLanguages(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-3">
              <div className="field">
                <label className="label">Village / City</label>
                <input className="input" value={village} onChange={(e) => setVillage(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">State</label>
                <input className="input" value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Pincode</label>
                <input className="input" value={pincode} onChange={(e) => setPincode(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label className="label">Profile Photo</label>
              <input type="file" accept="image/*" onChange={(e) => onSetProfile(e, setProfilePhoto)} />
              {profilePhoto && <img src={profilePhoto} alt="Profile" style={{ marginTop: 8, width: 120 }} />}
            </div>
            <button className="btn btn-primary" onClick={() => setStep(2)}>Continue</button>
          </div>
        )}

        {step === 2 && (
          <div className="card">
            <h2 className="h2">Step 2: Craft & Story</h2>
            <div className="grid grid-3">
              <div className="field">
                <label className="label">Craft</label>
                <input className="input" value={craft} onChange={(e) => setCraft(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Experience (years)</label>
                <input className="input" type="number" value={experience} onChange={(e) => setExperience(e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Materials</label>
                <input className="input" value={materials} onChange={(e) => setMaterials(e.target.value)} />
              </div>
            </div>
            <div className="field">
              <label className="label">Story</label>
              <textarea className="input" rows="3" value={story} onChange={(e) => setStory(e.target.value)} />
            </div>
            <button className="btn" onClick={() => setStep(1)}>Back</button>
            <button className="btn btn-primary" onClick={() => setStep(3)}>Continue</button>
          </div>
        )}

        {step === 3 && (
          <div className="card">
            <h2 className="h2">Step 3: Showcase</h2>
            <div className="field">
              <label className="label">Upload Sample Images</label>
              <input type="file" accept="image/*" multiple onChange={onImgUpload} />
            </div>
            {images.length > 0 && (
              <div className="grid grid-3">
                {images.map((src, i) => <img key={i} src={src} alt={`Sample ${i}`} style={{ width: "100%" }} />)}
              </div>
            )}
            <div className="field">
              <label className="label">Average Price Range</label>
              <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
                <option>₹200–₹500</option>
                <option>₹500–₹1000</option>
                <option>₹1000–₹2000</option>
              </select>
            </div>
            <button className="btn" onClick={() => setStep(2)}>Back</button>
            <button className="btn btn-primary" onClick={() => setStep(4)}>Continue</button>
          </div>
        )}

        {step === 4 && (
          <div className="card">
            <h2 className="h2">Step 4: Final Photo</h2>
            <input type="file" accept="image/*" onChange={(e) => onSetProfile(e, setFinalPhoto)} />
            {finalPhoto && <img src={finalPhoto} alt="Final" style={{ marginTop: 8, width: 120 }} />}
            <button className="btn" onClick={() => setStep(3)}>Back</button>
            <button className="btn btn-primary" onClick={save}>Finish</button>
          </div>
        )}
      </div>
    </section>
  )
}

export default ProfileWizardArtisan
