"use client"

import React, { useState } from "react"
import { Mic, Square } from "lucide-react"
import BACKEND_URL from "../config"

const styles = {
  container: {
    maxWidth: 820,
    margin: "32px auto",
    padding: 24,
    borderRadius: 12,
    boxShadow: "0 8px 30px rgba(17,24,39,0.08)",
    background: "#fff",
    fontFamily:
      "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto",
  },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: 700, color: "#0f172a" },
  sub: { color: "#475569", marginTop: 6 },
  input: {
    width: "100%",
    padding: 12,
    borderRadius: 8,
    border: "1px solid #e6e9ee",
    resize: "vertical",
  },
  fileRow: { display: "flex", gap: 12, alignItems: "center", marginTop: 12 },
  preview: {
    width: 140,
    height: 140,
    objectFit: "cover",
    borderRadius: 8,
    border: "1px solid #e6e9ee",
  },
  button: {
    marginTop: 16,
    padding: "12px 18px",
    background: "#4f46e5",
    color: "#fff",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  },
  smallMuted: { color: "#64748b", fontSize: 13 },
  captionCard: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    border: "1px solid #eef2ff",
    background: "#fbfdff",
  },
  tag: {
    display: "inline-block",
    padding: "6px 10px",
    background: "#eef2ff",
    color: "#0b1227",
    borderRadius: 999,
    marginRight: 8,
    marginTop: 8,
  },
  micButton: {
    padding: "8px 12px",
    border: "1px solid #e6e9ee",
    borderRadius: 8,
    background: "#fff",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.9rem",
  },
  recordingButton: {
    padding: "8px 12px",
    border: "1px solid #dc2626",
    borderRadius: 8,
    background: "#fee2e2",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.9rem",
    color: "#dc2626",
  },
}

export default function CaptionGenerator() {
  const [prompt, setPrompt] = useState("")
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [result, setResult] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [recordingLanguage, setRecordingLanguage] = useState("hi-IN")
  const [translating, setTranslating] = useState(false)

  const LANGUAGES = {
    "mr-IN": "Marathi",
    "hi-IN": "Hindi",
    "ta-IN": "Tamil",
    "te-IN": "Telugu",
    "ml-IN": "Malayalam",
    "gu-IN": "Gujarati",
    "or-IN": "Odia",
    "bn-IN": "Bengali",
    "pa-IN": "Punjabi",
    "kn-IN": "Kannada",
  }

  const handleFileChange = (e) => {
    const f = e.target.files?.[0] || null
    setImageFile(f)
    if (f) {
      setImagePreview(URL.createObjectURL(f))
    } else {
      setImagePreview(null)
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const audioChunks = []

      // ✅ Added reminder alert (no logic changed)
      alert("🎙️ Speak clearly & loudly.\n⏱️ Record at least 3 seconds for best results!")

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data)
      }

      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" })
        console.log("🎤 Recording stopped, blob size:", audioBlob.size)
        await translateAudio(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecording(true)
      console.log("🎤 Recording started...")
    } catch (err) {
      console.error("Microphone error:", err)
      setError("Could not access microphone. Please check permissions.")
    }
  }

  function stopRecording() {
    if (mediaRecorder) {
      mediaRecorder.stop()
      setIsRecording(false)
      console.log("🎤 Stopping recording...")
    }
  }

  async function translateAudio(audioBlob) {
    setTranslating(true)
    setError("")
    try {
      console.log("📤 Sending audio for translation...")
      console.log(" Blob size:", audioBlob.size)
      console.log(" Language:", recordingLanguage)

      const formData = new FormData()
      formData.append("file", audioBlob, "recording.webm")
      formData.append("lang_code", recordingLanguage)

      const res = await fetch(`${BACKEND_URL}/translator/translate`, {
        method: "POST",
        body: formData,
      })

      console.log("📥 Response status:", res.status)
      const data = await res.json()
      console.log("📥 Response data:", data)

      if (!res.ok) {
        throw new Error(data.detail || data.message || "Translation request failed")
      }

      if (data.status !== "success") {
        throw new Error(data.detail || data.message || "Translation failed")
      }

      const translatedText = data.translation || ""
      if (translatedText) {
        setPrompt(translatedText)
        console.log("✅ Translation successful:", translatedText)
        setError("")
      } else {
        throw new Error("No translation text received")
      }
    } catch (err) {
      console.error("❌ Translation error:", err)
      setError(err.message || "Failed to translate audio. Please try again.")
    } finally {
      setTranslating(false)
    }
  }

  async function onGenerate() {
    setError("")
    setResult(null)
    setLoading(true)

    try {
      if (!imageFile) throw new Error("Please upload an image file")

      const formData = new FormData()
      formData.append("file", imageFile, imageFile.name)
      formData.append("prompt", prompt)

      const res = await fetch(`${BACKEND_URL}/instagram/caption`, {
        method: "POST",
        body: formData,
      })

      const body = await res.json()

      if (!res.ok || body.status !== "success") {
        throw new Error(body.detail || body.error || "Failed to generate captions")
      }

      const captions = body.captions || []
      if (!captions.length) throw new Error("No captions generated")

      const variations = captions.map((c) => ({
        short: c,
        long: c,
        hashtags: [],
        post_sample: c,
      }))

      setResult({
        variations,
        marketing_tips: ["Try different product angles or lighting for more engagement!"],
      })
      setError(null)
    } catch (err) {
      console.error("Caption generation error:", err)
      setError(err.message || "Failed to generate captions")
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
          <div style={styles.sub}>
            Generate social-ready captions for artisan products — with optional image
            understanding and marketing tips.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", alignItems: "start", gap: "0.75rem" }}>
          <textarea
            placeholder="Describe the product (optional) — e.g. 'Handloom cotton saree, indigo dye, small-batch from Maharashtra'"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            style={{ ...styles.input, marginTop: 0, flex: 1 }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <select
              value={recordingLanguage}
              onChange={(e) => setRecordingLanguage(e.target.value)}
              style={{
                padding: "8px",
                borderRadius: 8,
                border: "1px solid #e6e9ee",
                fontSize: "0.85rem",
              }}
              disabled={isRecording || translating}
            >
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>

            {!isRecording ? (
              <button
                onClick={startRecording}
                style={{
                  ...styles.micButton,
                  opacity: translating ? 0.6 : 1,
                  cursor: translating ? "not-allowed" : "pointer",
                }}
                disabled={translating}
                title="Record voice description"
              >
                <Mic style={{ width: "18px", height: "18px" }} />
                {translating ? "Processing..." : "Record"}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                style={styles.recordingButton}
                title="Stop recording"
              >
                <Square style={{ width: "18px", height: "18px", fill: "currentColor" }} />
                Stop
              </button>
            )}
          </div>
        </div>

        <div style={styles.smallMuted}>
          💡 Tip: You can type or use voice input in any Indian language<br/>
          🎙️ **Speak loudly & record more than 3 seconds for best accuracy**
        </div>
      </div>

      <div style={styles.fileRow}>
        <div style={{ flex: 1 }}>
          <label
            style={{
              display: "block",
              fontSize: 13,
              color: "#374151",
              marginBottom: 6,
            }}
          >
            Upload product image (required)
          </label>
          <input type="file" accept="image/*" onChange={handleFileChange} />
          <div style={styles.smallMuted}>Tip: a clean single-product photo works best.</div>
        </div>
        {imagePreview ? (
          <img src={imagePreview} alt="preview" style={styles.preview} />
        ) : null}
      </div>

      <button
        style={styles.button}
        onClick={onGenerate}
        disabled={loading || !imageFile}
      >
        {loading ? "Generating..." : "Generate Captions & Marketing Tips"}
      </button>

      {error && <div style={{ color: "#b91c1c", marginTop: 12 }}>⚠ {error}</div>}

      {result && (
        <div style={{ marginTop: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                background: "#ecfccb",
                color: "#365314",
                padding: "6px 10px",
                borderRadius: 8,
                fontWeight: 700,
              }}
            >
              Caption generated ✓
            </div>
            <div style={{ color: "#475569" }}>
              You can copy any caption or view detailed marketing tips below.
            </div>
          </div>

          <div style={{ marginTop: 12 }}>
            {result.variations.map((v, idx) => (
              <div key={idx} style={styles.captionCard}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>Generated Caption</div>
                    <div
                      style={{ marginTop: 8, color: "#0b1227" }}
                      dangerouslySetInnerHTML={{
                        __html: (v.short || v.post_sample || v.long || "").replace(
                          /\*\*(.*?)\*\*/g,
                          "<b>$1</b>"
                        ),
                      }}
                    ></div>

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
                    <button
                      onClick={() => copyText(v.short || v.post_sample || v.long)}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #e6e9ee",
                        background: "#fff",
                      }}
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => alert(v.long || "No long caption")}
                      style={{
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid #e6e9ee",
                        background: "#fff",
                      }}
                    >
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
