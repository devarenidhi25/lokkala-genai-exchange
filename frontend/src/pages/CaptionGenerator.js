"use client"

import React, { useState } from "react"
import BACKEND_URL from "../config"

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
    setError("");
    setResult(null);
    setLoading(true);

    try {
      if (!imageFile) throw new Error("Please upload an image file");

      const formData = new FormData();
      formData.append("file", imageFile, imageFile.name);

      const res = await fetch(`${BACKEND_URL}/instagram/caption`, {
        method: "POST",
        body: formData,
      });

      const body = await res.json();
      console.log("🧾 Backend caption response:", body);

      // If backend returned error
      if (!res.ok || body.status !== "success") {
        throw new Error(body.detail || body.error || "Failed to generate captions");
      }

      // ✅ Use the actual response field from backend: body.captions
      const captions = body.captions || [];

      if (!captions.length) throw new Error("No captions generated");

      // Adapt backend data to UI-friendly structure
      const variations = captions.map((c) => ({
        short: c,
        long: c,
        hashtags: [],
        post_sample: c,
      }));

      setResult({
        variations,
        marketing_tips: ["Try different product angles or lighting for more engagement!"],
      });

      setError(null);
    } catch (err) {
      console.error("❌ Caption generation error:", err);
      setError(err.message || "Failed to generate captions");
    } finally {
      setLoading(false);
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
          <label style={{ display: "block", fontSize: 13, color: "#374151", marginBottom: 6 }}>Upload product image (required)</label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <div style={styles.smallMuted}>Tip: a clean single-product photo works best.</div>
        </div>

        {imagePreview ? <img src={imagePreview} alt="preview" style={styles.preview} /> : null}
      </div>

      <button style={styles.button} onClick={onGenerate} disabled={loading || !imageFile}>
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
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>Generated Caption</div>
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
              <div style={{ fontWeight: 700, marginBottom: 8 }}>📈 Instagram Post Result</div>
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