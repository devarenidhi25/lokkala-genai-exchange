"use client"

import React from "react"

const _AppStore = window.AppStore

function enhanceImageOnCanvas(imgEl, canvas) {
  const ctx = canvas.getContext("2d")
  const w = imgEl.naturalWidth
  const h = imgEl.naturalHeight
  canvas.width = w
  canvas.height = h
  ctx.drawImage(imgEl, 0, 0)

  // Simple enhancement: increase brightness + contrast
  const imageData = ctx.getImageData(0, 0, w, h)
  const data = imageData.data
  const brightness = 12
  const contrast = 1.08
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let v = data[i + c]
      v = v + brightness
      v = (v - 128) * contrast + 128
      data[i + c] = Math.max(0, Math.min(255, v))
    }
  }
  ctx.putImageData(imageData, 0, 0)
}

function generateViralTips() {
  return [
    "Post during evenings (7–9 PM) for higher engagement.",
    "Use natural light for product photos and a clean background.",
    "Tell a short story about the craft in 2–3 lines.",
    "Add 5–7 relevant hashtags, not more.",
    "Share to WhatsApp status and customer groups.",
  ]
}

function ArtisanDashboard() {
  const user = _AppStore.getUser()
  const profile = _AppStore.getProfile("artisan")
  const [src, setSrc] = React.useState("")
  const [enhanced, setEnhanced] = React.useState("")
  const [aiCaptions, setAiCaptions] = React.useState([]) // AI captions
  const [hashtags, setHashtags] = React.useState([])
  const [loading, setLoading] = React.useState(false)
  const [prompt, setPrompt] = React.useState("")

  const imgRef = React.useRef(null)
  const canvasRef = React.useRef(null)
  const uploadedFileRef = React.useRef(null) // keep uploaded file for AI API

  if (!user || user.role !== "artisan") {
    return (
      <main className="container">
        <p>Please sign in as an artisan.</p>
      </main>
    )
  }
  if (!profile) {
    return (
      <main className="container">
        <p>Please complete your artisan profile first.</p>
      </main>
    )
  }

  function onUpload(e) {
    const f = e.target.files?.[0]
    if (!f) return
    uploadedFileRef.current = f
    const r = new FileReader()
    r.onload = () => setSrc(r.result)
    r.readAsDataURL(f)
  }

  function onEnhance() {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return
    enhanceImageOnCanvas(img, canvas)
    setEnhanced(canvas.toDataURL("image/jpeg", 0.9))
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `${aiCaptions[0]?.short || "Check out my handcrafted product!"}\n${hashtags.join(" ")}`
    )
    window.open(`https://wa.me/?text=${text}`, "_blank")
  }

  function copyAll() {
    const text = `${aiCaptions[0]?.short || ""}\n${hashtags.join(" ")}`
    navigator.clipboard.writeText(text).then(() => alert("Copied captions & hashtags"))
  }

  const toBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result.split(",")[1])
      reader.onerror = (error) => reject(error)
    })

  async function generateAICaptions() {
    if (!prompt && !uploadedFileRef.current) {
      alert("Please enter a prompt or upload an image.")
      return
    }
    setLoading(true)
    const base64Image = uploadedFileRef.current ? await toBase64(uploadedFileRef.current) : null

    const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8080";
    const res = await fetch(`${API_BASE}/api/generate-caption`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        imageBase64: base64Image,
      }),
    })

    const data = await res.json()
    if (data.success) {
      setAiCaptions(data.data)
      if (data.data[0]?.hashtags) {
        setHashtags(data.data[0].hashtags)
      }
    } else {
      alert("Error: " + data.error)
    }
    setLoading(false)
  }

  return (
    <main className="container">
      <section className="mt-4">
        <div className="row">
          <div className="card">
            <div className="card-body">
              <h2 className="bold">Upload & Enhance Product Image</h2>
              <input className="input mt-3" type="file" accept="image/*" onChange={onUpload} />
              <div className="row mt-3">
                <div>
                  {src ? (
                    <img
                      ref={imgRef}
                      src={src}
                      alt="Original"
                      style={{ width: "100%", borderRadius: 10, objectFit: "cover" }}
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="small text-muted">No image uploaded yet.</div>
                  )}
                </div>
                <div>
                  <canvas
                    ref={canvasRef}
                    style={{ width: "100%", borderRadius: 10, background: "#f8fafc" }}
                  ></canvas>
                </div>
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={onEnhance}>
                  Enhance with AI (demo)
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="bold">AI Caption Generator</h3>
              <textarea
                placeholder="Enter your idea or product prompt..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                style={{ width: "100%", marginBottom: "10px" }}
              />
              <button className="btn btn-success" onClick={generateAICaptions} disabled={loading}>
                {loading ? "Generating..." : "Generate Captions"}
              </button>

              {aiCaptions.length > 0 && (
                <div style={{ marginTop: "20px" }}>
                  {aiCaptions.map((c, idx) => (
                    <div
                      key={idx}
                      style={{
                        border: "1px solid #ddd",
                        marginBottom: "10px",
                        padding: "10px",
                        borderRadius: "8px",
                      }}
                    >
                      <p>
                        <strong>Short:</strong> {c.short}
                      </p>
                      <p>
                        <strong>Long:</strong> {c.long}
                      </p>
                      <p>
                        <strong>Hashtags:</strong> {c.hashtags?.join(" ")}
                      </p>
                      <p>
                        <strong>Sample Post:</strong> {c.post_sample}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <div className="form-actions mt-3">
                <button className="btn" onClick={copyAll} disabled={!aiCaptions.length}>
                  Copy Captions & Hashtags
                </button>
                <button className="btn" onClick={shareWhatsApp} disabled={!aiCaptions.length}>
                  Share on WhatsApp
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h3 className="bold">ViralBuddy Tips</h3>
              <ul className="small">
                {generateViralTips().map((t, i) => (
                  <li key={i}>• {t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
      <footer className="footer">Grow your brand with ArtConnect India • Share everywhere</footer>
    </main>
  )
}

window.ArtisanDashboard = ArtisanDashboard
export default ArtisanDashboard
