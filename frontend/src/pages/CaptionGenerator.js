"use client"

import React, { useState } from "react"

const styles = {
  container: {
    maxWidth: 820,
    margin: "32px auto",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 8px 30px rgba(17,24,39,0.08)",
    background: "#fff",
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: 700, color: "#0f172a" },
  sub: { color: "#475569", marginTop: 6 },
  input: { width: "100%", padding: 12, borderRadius: 8, border: "1px solid #e6e9ee", resize: "vertical" },
  fileRow: { display: "flex", gap: 12, alignItems: "center", marginTop: 12 },
  preview: { width: 140, height: 140, objectFit: "cover", borderRadius: 8, border: "1px solid #e6e9ee" },
  button: { marginTop: 16, padding: "12px 18px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 10, cursor: "pointer" },
  smallMuted: { color: "#64748b", fontSize: 13 },
  captionCard: { marginTop: 16, padding: 14, borderRadius: 10, border: "1px solid #eef2ff", background: "#fbfdff" },
  tag: { display: "inline-block", padding: "6px 10px", background: "#eef2ff", color: "#0b1227", borderRadius: 999, marginRight: 8, marginTop: 8 }
}

export default function CaptionGenerator() {
  const [prompt, setPrompt] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null) // { variations: [...], marketing_tips: [...] }

  // convert file -> base64 (strip data URL prefix)
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result
        const base64 = dataUrl.split(",")[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null
    setImageFile(f)
    if (f) {
      setImagePreview(URL.createObjectURL(f))
    } else {
      setImagePreview(null)
    }
  }

  async function onGenerate() {
    setError("")
    setResult(null)
    setLoading(true)

    try {
      let imageBase64 = null
      if (imageFile) {
        imageBase64 = await fileToBase64(imageFile)
      }

      const payload = {
        prompt,
        imageBase64,
        tone: "heritage-focused",
      }

      const res = await fetch("http://127.0.0.1:8000/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || "Server error")
      }

      const body = await res.json()
      if (!body.success) throw new Error(body.error || "Failed to generate captions")

      const data = body.data

      // normalize: some responses may return {variations:..., marketing_tips:...} or raw text
      if (data.variations) {
        setResult(data)
      } else if (Array.isArray(data)) {
        // older format – map to our shape
        setResult({ variations: data, marketing_tips: [] })
      } else if (data.raw_text) {
        // server couldn't parse JSON from model; show raw text as a single suggestion
        setResult({
          variations: [{ short: data.raw_text.slice(0, 200), long: data.raw_text, hashtags: [], post_sample: data.raw_text }],
          marketing_tips: [],
        })
      } else {
        setResult({ variations: [{ short: "No captions returned", long: "", hashtags: [], post_sample: "" }], marketing_tips: [] })
      }
    } catch (err) {
      setError(err.message || String(err))
    } finally {
      setLoading(false)
    }
  }

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
      alert("Copied to clipboard")
    } catch {
      alert("Unable to copy")
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <div style={styles.title}>📝 Caption Generator</div>
          <div style={styles.sub}>Generate social-ready captions for artisan products — with optional image understanding and marketing tips.</div>
        </div>
      </div>

      <textarea
        placeholder="Describe the product (optional) — e.g. 'Handloom cotton saree, indigo dye, small-batch from Maharashtra'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={4}
        style={{ ...styles.input, marginTop: 12 }}
      />

      <div style={styles.fileRow}>
        <div style={{ flex: 1 }}>
          <label style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 6 }}>Upload product image (optional)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <div style={styles.smallMuted}>Tip: a clean single-product photo works best.</div>
        </div>

        {imagePreview ? <img src={imagePreview} alt="preview" style={styles.preview} /> : null}
      </div>

      <button style={styles.button} onClick={onGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Captions & Marketing Tips"}
      </button>

      {error && <div style={{ color: "#b91c1c", marginTop: 12 }}>⚠ {error}</div>}

      {result && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ background: "#ecfccb", color: "#365314", padding: "6px 10px", borderRadius: 8, fontWeight: 700 }}>
              Caption generated ✓
            </div>
            <div style={{ color: "#475569" }}>You can copy any caption or view detailed marketing tips below.</div>
          </div>

          <div style={{ marginTop: 12 }}>
            {result.variations.map((v, idx) => (
              <div key={idx} style={styles.captionCard}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>Suggestion #{idx + 1}</div>
                    <div style={{ marginTop: 8, color: "#0b1227" }}>{v.short || v.post_sample || v.long}</div>
                    {v.hashtags && v.hashtags.length > 0 && (
                      <div style={{ marginTop: 10 }}>
                        {v.hashtags.slice(0, 10).map((h, i) => (
                          <span key={i} style={styles.tag}>
                            {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    <button onClick={() => copyText(v.short || v.post_sample || v.long)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e6e9ee", background: "#fff" }}>
                      Copy
                    </button>
                    <button onClick={() => alert(v.long || "No long caption")} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e6e9ee", background: "#fff" }}>
                      View long
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {result.marketing_tips && result.marketing_tips.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>📈 Quick marketing tips</div>
              <ul style={{ color: "#334155" }}>
                {result.marketing_tips.map((t, i) => (
                  <li key={i} style={{ marginBottom: 6 }}>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
