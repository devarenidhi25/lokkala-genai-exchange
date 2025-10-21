"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getFirestore, doc, setDoc } from "firebase/firestore"
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { auth } from "../firebase"
import { onAuthStateChanged } from "firebase/auth"
import { AppStore } from "../utils/storage"

function ProfileSetupArtisan() {
  const navigate = useNavigate()
  const db = getFirestore()
  const storage = getStorage()

  // auth state
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // wizard steps
  const [step, setStep] = useState(1)

  // Step 1
  const [village, setVillage] = useState("")
  const [state, setState] = useState("Maharashtra")
  const [pincode, setPincode] = useState("")
  const [languages, setLanguages] = useState("Hindi, English")
  const [profilePhoto, setProfilePhoto] = useState(null)
  const [profilePhotoFile, setProfilePhotoFile] = useState(null)

  // Step 2
  const [craftType, setCraftType] = useState("pottery")
  const [experience, setExperience] = useState(2)
  const [story, setStory] = useState("")
  const [materials, setMaterials] = useState("clay, cotton")

  // Step 3
  const [samples, setSamples] = useState([])
  const [sampleFiles, setSampleFiles] = useState([])
  const [priceRange, setPriceRange] = useState("₹500–₹1000")

  // Step 4
  const [whatsapp, setWhatsapp] = useState(true)
  
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

  function onUploadProfile(e) {
    const f = e.target.files?.[0]
    if (!f) return
    setProfilePhotoFile(f)
    const r = new FileReader()
    r.onload = () => setProfilePhoto(r.result)
    r.readAsDataURL(f)
  }

  function onUploadSamples(e) {
    const files = Array.from(e.target.files || []).slice(0, 5)
    setSampleFiles(files)
    
    const readers = files.map(
      (f) =>
        new Promise((res) => {
          const r = new FileReader()
          r.onload = () => res(r.result)
          r.readAsDataURL(f)
        }),
    )
    Promise.all(readers).then((imgs) => setSamples(imgs))
  }

  function next() {
    setStep((s) => Math.min(4, s + 1))
  }
  function prev() {
    setStep((s) => Math.max(1, s - 1))
  }

  // === Firestore Save ===
  async function save() {
    try {
      if (!user) {
        alert("Please sign in first")
        return
      }

      setSaving(true)

      // Upload profile photo to Firebase Storage if exists
      let profilePhotoUrl = profilePhoto
      if (profilePhotoFile) {
        const profileRef = ref(storage, `profiles/${user.uid}/profile_${Date.now()}_${profilePhotoFile.name}`)
        await uploadBytes(profileRef, profilePhotoFile)
        profilePhotoUrl = await getDownloadURL(profileRef)
      }

      // Upload sample images to Firebase Storage
      const sampleUrls = await Promise.all(
        sampleFiles.map(async (file, index) => {
          const sampleRef = ref(storage, `profiles/${user.uid}/samples/${Date.now()}_${index}_${file.name}`)
          await uploadBytes(sampleRef, file)
          return await getDownloadURL(sampleRef)
        })
      )

      const profile = {
        type: "artisan",       // role identifier
        village,
        state,
        pincode,
        languages,
        profilePhoto: profilePhotoUrl,
        craftType,
        experience,
        story,
        materials,
        samples: sampleUrls.length > 0 ? sampleUrls : samples,
        priceRange,
        whatsapp,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "",
        products: [], // Initialize empty products array
        createdAt: new Date().toISOString()
      }

      // 🔍 Debug
      console.log("Saving artisan profile:", user.uid, profile)

      // Save to Firestore under "users" collection
      await setDoc(doc(db, "users", user.uid), profile)

      console.log("✅ Artisan profile saved successfully")

      // Save locally (optional, for dashboard preload)
      AppStore.setProfile("artisan", profile)
      AppStore.setUser({ uid: user.uid, email: user.email, role: "artisan", displayName: user.displayName })

      // Navigate to artisan dashboard
      navigate("/artisan", { state: profile })
    } catch (err) {
      console.error("❌ Firestore error:", err)
      alert("Error saving profile: " + err.message)
    } finally {
      setSaving(false)
    }
  }
  // === end save ===

  const states = [
    "Maharashtra",
    "Gujarat",
    "Rajasthan",
    "Delhi",
    "Uttar Pradesh",
    "West Bengal",
    "Karnataka",
    "Tamil Nadu",
    "Kerala",
    "Telangana",
    "Madhya Pradesh",
    "Bihar",
    "Punjab",
  ]

  return (
    <main className="container">
      <section className="card mt-4">
        <div className="card-body">
          <h2 className="bold">Artisan Profile Setup</h2>
          <div className="steps mt-3">
            <div className={`step ${step >= 1 ? "active" : ""}`}></div>
            <div className={`step ${step >= 2 ? "active" : ""}`}></div>
            <div className={`step ${step >= 3 ? "active" : ""}`}></div>
            <div className={`step ${step >= 4 ? "active" : ""}`}></div>
          </div>

          {step === 1 && (
            <>
              <div className="row mt-3">
                <div>
                  <label className="label">Village / City</label>
                  <input
                    className="input"
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    placeholder="e.g., Kolhapur"
                  />
                </div>
                <div>
                  <label className="label">State</label>
                  <select className="select" value={state} onChange={(e) => setState(e.target.value)}>
                    {states.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="row mt-3">
                <div>
                  <label className="label">Pincode</label>
                  <input
                    className="input"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="416003"
                  />
                </div>
                <div>
                  <label className="label">Languages Spoken</label>
                  <input
                    className="input"
                    value={languages}
                    onChange={(e) => setLanguages(e.target.value)}
                    placeholder="Marathi, Hindi, English"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="label">Profile Photo</label>
                <input className="input" type="file" accept="image/*" onChange={onUploadProfile} />
                {profilePhoto && (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    style={{ width: 100, height: 100, borderRadius: 12, marginTop: 8, objectFit: "cover" }}
                  />
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="row mt-3">
                <div>
                  <label className="label">Type of Craft</label>
                  <select className="select" value={craftType} onChange={(e) => setCraftType(e.target.value)}>
                    <option value="pottery">Pottery</option>
                    <option value="handloom">Handloom</option>
                    <option value="painting">Painting</option>
                    <option value="embroidery">Embroidery</option>
                    <option value="woodwork">Woodwork</option>
                    <option value="jewelry">Jewelry</option>
                  </select>
                </div>
                <div>
                  <label className="label">Years of Experience</label>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={experience}
                    onChange={(e) => setExperience(+e.target.value)}
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="label">Story of the Craft (short)</label>
                <textarea
                  className="textarea"
                  rows="4"
                  value={story}
                  onChange={(e) => setStory(e.target.value)}
                  placeholder="Share your inspiration..."
                ></textarea>
                <div className="helper mt-2">
                  Voice input option can be added; AI can turn it into a bio later. (TODO)
                </div>
              </div>
              <div className="mt-3">
                <label className="label">Materials Used</label>
                <input
                  className="input"
                  value={materials}
                  onChange={(e) => setMaterials(e.target.value)}
                  placeholder="cotton, clay, bamboo..."
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="mt-3">
                <label className="label">Upload 2–3 Sample Product Images</label>
                <input className="input" type="file" accept="image/*" multiple onChange={onUploadSamples} />
                <div className="grid mt-3" style={{ gridTemplateColumns: "repeat(3,1fr)" }}>
                  {samples.map((s, i) => (
                    <img
                      key={i}
                      src={s}
                      alt={`Sample ${i + 1}`}
                      style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 10 }}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <label className="label">Average Price Range</label>
                <select className="select" value={priceRange} onChange={(e) => setPriceRange(e.target.value)}>
                  <option>₹200–₹500</option>
                  <option>₹500–₹1000</option>
                  <option>₹1000–₹2500</option>
                  <option>₹2500–₹5000</option>
                </select>
              </div>
            </>
          )}
          {step === 4 && (
            <>
              <div className="row mt-3">
                <div>
                  <label className="label">WhatsApp Contact</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                    <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} /> Enable
                    WhatsApp
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <label className="label">Upload Profile Picture (optional)</label>
                <input className="input" type="file" accept="image/*" onChange={onUploadProfile} />
                {profilePhoto && (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    style={{ width: 100, height: 100, borderRadius: 12, marginTop: 8, objectFit: "cover" }}
                  />
                )}
              </div>
            </>
          )}

          <div className="form-actions">
            {step > 1 && (
              <button className="btn" onClick={prev} disabled={saving}>
                Back
              </button>
            )}
            {step < 4 && (
              <button className="btn btn-primary" onClick={next}>
                Next
              </button>
            )}
            {step === 4 && (
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? "Saving..." : "Save & Continue"}
              </button>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

export default ProfileSetupArtisan