"use client"

import React, { useState, useEffect } from "react"
import { Share2, FileText, Eye, Send, Download, Loader, CheckCircle, AlertCircle } from "lucide-react"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000"

function CatalogPromotion({ artisanId, artisanName }) {
  const [loading, setLoading] = useState(false)
  const [generatingCatalog, setGeneratingCatalog] = useState(false)
  const [sharingWhatsApp, setSharingWhatsApp] = useState(false)
  const [currentCatalog, setCurrentCatalog] = useState(null)
  const [catalogHistory, setCatalogHistory] = useState([])
  const [shareHistory, setShareHistory] = useState([])
  const [showShareModal, setShowShareModal] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [showBulkShare, setShowBulkShare] = useState(false)
  const [bulkPhones, setBulkPhones] = useState("")
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState(null)
  const [catalogType, setCatalogType] = useState('pdf')

  useEffect(() => {
    if (artisanId) {
      loadCatalogHistory()
      loadShareHistory()
    }
  }, [artisanId])

  async function loadCatalogHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/catalog/history/${artisanId}?limit=5`)
      const data = await response.json()
      
      if (data.success && data.catalogs && data.catalogs.length > 0) {
        setCatalogHistory(data.catalogs)
        setCurrentCatalog(data.catalogs[0])
      }
    } catch (err) {
      console.error("Error loading catalog history:", err)
    }
  }

  async function loadShareHistory() {
    try {
      const response = await fetch(`${API_BASE_URL}/api/catalog/shares/${artisanId}?limit=10`)
      const data = await response.json()
      
      if (data.success && data.shares) {
        setShareHistory(data.shares)
      }
    } catch (err) {
      console.error("Error loading share history:", err)
    }
  }

  async function handleGenerateCatalog(type = 'pdf') {
    setGeneratingCatalog(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/catalog/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisan_id: artisanId,
          catalog_type: type
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to generate catalog')
      }

      if (data.success) {
        const newCatalog = {
          url: data.catalog_url,
          type: type,
          product_count: data.product_count,
          created_at: new Date().toISOString()
        }
        setCurrentCatalog(newCatalog)
        setSuccessMessage(`✅ ${type.toUpperCase()} catalog generated successfully!`)
        await loadCatalogHistory()
      }
    } catch (err) {
      setError(err.message || 'Failed to generate catalog. Please try again.')
      console.error("Catalog generation error:", err)
    } finally {
      setGeneratingCatalog(false)
    }
  }

  async function handleShareWhatsApp() {
    if (!phoneNumber.trim()) {
      setError("Please enter a phone number")
      return
    }

    if (!currentCatalog || !currentCatalog.url) {
      setError("Please generate a catalog first")
      return
    }

    setSharingWhatsApp(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/catalog/share-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisan_id: artisanId,
          phone_number: phoneNumber,
          catalog_url: currentCatalog.url,
          custom_message: customMessage || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to share on WhatsApp')
      }

      if (data.success) {
        setSuccessMessage(`✅ Catalog shared successfully to ${phoneNumber}!`)
        setShowShareModal(false)
        setPhoneNumber("")
        setCustomMessage("")
        await loadShareHistory()
      }
    } catch (err) {
      setError(err.message || 'Failed to share catalog. Please try again.')
      console.error("WhatsApp share error:", err)
    } finally {
      setSharingWhatsApp(false)
    }
  }

  async function handleBulkShare() {
    const phones = bulkPhones
      .split('\n')
      .map(p => p.trim())
      .filter(p => p.length > 0)

    if (phones.length === 0) {
      setError("Please enter at least one phone number")
      return
    }

    if (!currentCatalog || !currentCatalog.url) {
      setError("Please generate a catalog first")
      return
    }

    setSharingWhatsApp(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`${API_BASE_URL}/api/catalog/share-whatsapp-bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artisan_id: artisanId,
          phone_numbers: phones,
          catalog_url: currentCatalog.url
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to send bulk shares')
      }

      const successCount = data.results.filter(r => r.success).length
      setSuccessMessage(`✅ Catalog shared to ${successCount}/${phones.length} numbers successfully!`)
      setShowBulkShare(false)
      setBulkPhones("")
      await loadShareHistory()
    } catch (err) {
      setError(err.message || 'Failed to send bulk shares. Please try again.')
      console.error("Bulk share error:", err)
    } finally {
      setSharingWhatsApp(false)
    }
  }

  return (
    <div>
      {/* Error/Success Messages */}
      {error && (
        <div className="card" style={{ 
          background: "rgba(239, 68, 68, 0.1)", 
          border: "1px solid rgba(239, 68, 68, 0.3)",
          marginBottom: "1rem"
        }}>
          <div className="card-body" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle style={{ width: "20px", height: "20px", color: "#dc2626", flexShrink: 0 }} />
            <p style={{ color: "#dc2626", margin: 0 }}>{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="card" style={{ 
          background: "rgba(34, 197, 94, 0.1)", 
          border: "1px solid rgba(34, 197, 94, 0.3)",
          marginBottom: "1rem"
        }}>
          <div className="card-body" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CheckCircle style={{ width: "20px", height: "20px", color: "#16a34a", flexShrink: 0 }} />
            <p style={{ color: "#16a34a", margin: 0 }}>{successMessage}</p>
          </div>
        </div>
      )}

      {/* Main Catalog Section */}
      <div className="card">
        <div className="card-body" style={{ 
          background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)", 
          color: "white",
          padding: "1.5rem"
        }}>
          <h3 className="bold" style={{ margin: 0, display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FileText style={{ width: "24px", height: "24px" }} />
            Promote My Business
          </h3>
          <p style={{ margin: "0.5rem 0 0 0", opacity: 0.95 }}>
            Generate and share your product catalog with customers
          </p>
        </div>

        <div className="card-body">
          {/* Current Catalog Display */}
          {currentCatalog && (
            <div className="card" style={{ 
              background: "rgba(139, 92, 246, 0.05)", 
              border: "1px solid rgba(139, 92, 246, 0.2)",
              marginBottom: "1.5rem"
            }}>
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "1rem", flexWrap: "wrap" }}>
                  <div>
                    <h4 className="bold" style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>
                      📄 Latest Catalog
                    </h4>
                    <p className="text-muted" style={{ fontSize: "0.85rem", margin: 0 }}>
                      Generated on {new Date(currentCatalog.created_at).toLocaleString()}
                    </p>
                    <p className="text-muted" style={{ fontSize: "0.85rem", margin: "0.25rem 0 0 0" }}>
                      Type: {currentCatalog.type?.toUpperCase()} | Products: {currentCatalog.product_count || 0}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <a
                      href={currentCatalog.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                    >
                      <Eye style={{ width: "16px", height: "16px" }} />
                      View
                    </a>
                    <a
                      href={currentCatalog.url}
                      download
                      className="btn btn-secondary"
                      style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
                    >
                      <Download style={{ width: "16px", height: "16px" }} />
                      Download
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Catalog Type Selection */}
          <div style={{ marginBottom: "1rem" }}>
            <label className="label">Catalog Type</label>
            <div style={{ display: "flex", gap: "1rem" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input 
                  type="radio" 
                  name="catalogType" 
                  value="pdf"
                  checked={catalogType === 'pdf'}
                  onChange={(e) => setCatalogType(e.target.value)}
                />
                <span>PDF (Professional)</span>
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                <input 
                  type="radio" 
                  name="catalogType" 
                  value="image"
                  checked={catalogType === 'image'}
                  onChange={(e) => setCatalogType(e.target.value)}
                />
                <span>Image (Social Media)</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <button
              className="btn btn-primary"
              onClick={() => handleGenerateCatalog(catalogType)}
              disabled={generatingCatalog}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}
            >
              {generatingCatalog ? (
                <>
                  <Loader style={{ width: "18px", height: "18px" }} className="spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText style={{ width: "18px", height: "18px" }} />
                  Generate Catalog
                </>
              )}
            </button>

            <button
              className="btn btn-success"
              onClick={() => setShowShareModal(true)}
              disabled={!currentCatalog || sharingWhatsApp}
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "center" }}
            >
              <Send style={{ width: "18px", height: "18px" }} />
              Share on WhatsApp
            </button>

            <button
              className="btn"
              onClick={() => setShowBulkShare(true)}
              disabled={!currentCatalog || sharingWhatsApp}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: "0.5rem", 
                justifyContent: "center",
                background: "var(--accent-green)",
                color: "white"
              }}
            >
              <Share2 style={{ width: "18px", height: "18px" }} />
              Bulk Share
            </button>
          </div>

          {/* Share History */}
          {shareHistory.length > 0 && (
            <div>
              <h4 className="bold" style={{ fontSize: "1rem", marginBottom: "1rem" }}>
                📊 Recent Shares ({shareHistory.length})
              </h4>
              <div style={{ maxHeight: "300px", overflow: "auto" }}>
                <table style={{ width: "100%", fontSize: "0.9rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border)" }}>
                      <th style={{ padding: "0.5rem", textAlign: "left" }}>Date</th>
                      <th style={{ padding: "0.5rem", textAlign: "left" }}>Phone</th>
                      <th style={{ padding: "0.5rem", textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shareHistory.map((share, index) => (
                      <tr key={index} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "0.5rem" }}>
                          {new Date(share.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "0.5rem" }}>{share.phone_number}</td>
                        <td style={{ padding: "0.5rem", textAlign: "center" }}>
                          {share.status === 'sent' || share.status === 'queued' ? (
                            <CheckCircle style={{ width: "16px", height: "16px", color: "#16a34a" }} />
                          ) : (
                            <span style={{ color: "#dc2626" }}>Failed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div className="card" style={{ maxWidth: "500px", width: "100%" }}>
            <div className="card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 className="bold" style={{ margin: 0 }}>Share on WhatsApp</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="btn"
                  style={{ padding: "0.25rem 0.75rem" }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label className="label">Phone Number (with country code) *</label>
                  <input
                    className="input"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g., +919876543210"
                  />
                  <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    Include country code (e.g., +91 for India)
                  </p>
                </div>

                <div>
                  <label className="label">Custom Message (optional)</label>
                  <textarea
                    className="textarea"
                    rows="3"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Add a personal message..."
                  />
                </div>

                <div className="form-actions">
                  <button
                    className="btn"
                    onClick={() => setShowShareModal(false)}
                    disabled={sharingWhatsApp}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handleShareWhatsApp}
                    disabled={sharingWhatsApp}
                  >
                    {sharingWhatsApp ? "Sending..." : "Send"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Share Modal */}
      {showBulkShare && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "1rem"
        }}>
          <div className="card" style={{ maxWidth: "500px", width: "100%" }}>
            <div className="card-body">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
                <h3 className="bold" style={{ margin: 0 }}>Bulk Share on WhatsApp</h3>
                <button
                  onClick={() => setShowBulkShare(false)}
                  className="btn"
                  style={{ padding: "0.25rem 0.75rem" }}
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="label">Phone Numbers (one per line, with country code) *</label>
                <textarea
                  className="textarea"
                  rows="8"
                  value={bulkPhones}
                  onChange={(e) => setBulkPhones(e.target.value)}
                  placeholder="+919876543210&#10;+919876543211&#10;+919876543212"
                />
                <p className="text-muted" style={{ fontSize: "0.85rem", marginTop: "0.5rem" }}>
                  Enter one phone number per line with country code
                </p>
              </div>

              <div className="form-actions" style={{ marginTop: "1rem" }}>
                <button
                  className="btn"
                  onClick={() => setShowBulkShare(false)}
                  disabled={sharingWhatsApp}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-success"
                  onClick={handleBulkShare}
                  disabled={sharingWhatsApp}
                >
                  {sharingWhatsApp ? "Sending..." : "Send to All"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default CatalogPromotion