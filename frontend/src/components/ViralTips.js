"use client"

import React from "react"

function generateViralTips() {
  return [
    "Post during evenings (7–9 PM) for higher engagement.",
    "Use natural light for product photos and a clean background.",
    "Tell a short story about the craft in 2–3 lines.",
    "Add 5–7 relevant hashtags, not more.",
    "Share to WhatsApp status and customer groups.",
  ]
}

function ViralTips() {
  return (
    <div className="mt-3">
      <h3 className="bold">ViralBuddy Tips</h3>
      <ul className="small">
        {generateViralTips().map((t, i) => (
          <li key={i}>• {t}</li>
        ))}
      </ul>
    </div>
  )
}

export default ViralTips
