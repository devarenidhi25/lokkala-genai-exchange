"use client"
import React, { useState, useEffect, useRef } from "react"

function SearchFilters({ products, onChange }) {
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("all")
  const [state, setState] = useState("all")
  const [price, setPrice] = useState([0, 5000])
  const [sort, setSort] = useState("relevance")
  const [imgPreview, setImgPreview] = useState(null)

  const fileInputRef = useRef(null)

  useEffect(() => {
    const filtered = products
      .filter((p) => p.name.toLowerCase().includes(q.toLowerCase()))
      .filter((p) => (cat === "all" ? true : p.category === cat))
      .filter((p) => (state === "all" ? true : p.state === state))
      .filter((p) => p.price >= price[0] && p.price <= price[1])

    const sorted = [...filtered].sort((a, b) => {
      if (sort === "price-asc") return a.price - b.price
      if (sort === "price-desc") return b.price - a.price
      if (sort === "name") return a.name.localeCompare(b.name)
      return 0
    })

    onChange?.(sorted)
  }, [q, cat, price, sort, state, products, onChange])

  const categories = Array.from(new Set(products.map((p) => p.category)))
  const states = Array.from(new Set(products.map((p) => p.state)))

  // 🎙️ Handle voice search
  const startVoiceSearch = () => {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognition) {
        alert("Voice search not supported in this browser.")
        return
      }
      const recognition = new SpeechRecognition()
      recognition.lang = "en-IN"
      recognition.interimResults = false
      recognition.maxAlternatives = 1

      recognition.start()

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript
        setQ(transcript)
      }
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error)
      }
    } catch (err) {
      console.error("Voice search init failed:", err)
    }
  }

  // 📷 Handle camera / image picker
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setImgPreview(reader.result)
      reader.readAsDataURL(file)
    }
  }

  // Inline styles
  const styles = {
    searchWrap: { position: "relative", width: "100%" },
    searchInput: {
      width: "100%",
      padding: "12px 46px 12px 16px",
      borderRadius: 10,
      border: "1px solid #e6e6e6",
      fontSize: 16,
      outline: "none",
      boxSizing: "border-box",
    },
    iconContainer: {
      position: "absolute",
      right: 8,
      top: "50%",
      transform: "translateY(-50%)",
      display: "flex",
      gap: 6,
      alignItems: "center",
    },
    iconBtn: {
      background: "transparent",
      border: "none",
      padding: 6,
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    filtersGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
      gap: 12,
      marginTop: 14,
      alignItems: "start",
    },
    label: { display: "block", marginBottom: 6, fontSize: 13, color: "#333" },
    input: {
      width: "100%",
      padding: "8px 10px",
      borderRadius: 8,
      border: "1px solid #e6e6e6",
    },
    priceRow: { display: "flex", gap: 8 },
    previewImg: { marginTop: 10, maxWidth: "100%", borderRadius: 8 },
  }

  return (
    <div className="card" style={{ width: "100%" }}>
      <div className="card-body" style={{ padding: 16 }}>
        {/* Search bar with working mic + camera */}
        <div style={styles.searchWrap}>
          <input
            className="input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products, artisans, categories..."
            style={styles.searchInput}
            aria-label="Search products"
          />
          <div style={styles.iconContainer}>
            <button type="button" title="Voice search" aria-label="Voice search" style={styles.iconBtn} onClick={startVoiceSearch}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3z" stroke="#333" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M19 11v1a7 7 0 0 1-14 0v-1" stroke="#333" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 21v-3" stroke="#333" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            <button
              type="button"
              title="Image search"
              aria-label="Image search"
              style={styles.iconBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M21 19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l1-2h4l1 2h3a2 2 0 0 1 2 2v12z" stroke="#333" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="13" r="3" stroke="#333" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Hidden file input for camera */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: "none" }}
              onChange={handleImageChange}
            />
          </div>
        </div>

        {imgPreview && <img src={imgPreview} alt="Selected" style={styles.previewImg} />}

        {/* Filters below */}
        <div style={styles.filtersGrid} className="mt-3">
          <div>
            <label style={styles.label}>Category</label>
            <select className="select" value={cat} onChange={(e) => setCat(e.target.value)} style={styles.input}>
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>State / Region</label>
            <select className="select" value={state} onChange={(e) => setState(e.target.value)} style={styles.input}>
              <option value="all">All</option>
              {states.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={styles.label}>Sort</label>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)} style={styles.input}>
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

          <div>
            <label style={styles.label}>Price range (₹{price[0]} - ₹{price[1]})</label>
            <div style={styles.priceRow}>
              <input type="number" min="0" step="50" value={price[0]} onChange={(e) => setPrice([+e.target.value, price[1]])} style={styles.input}/>
              <input type="number" min="0" step="50" value={price[1]} onChange={(e) => setPrice([price[0], +e.target.value])} style={styles.input}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchFilters
