import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext";

/**
 * Globe icon dropdown - small globe, open on click
 * Places itself suitable for top-right corner of navbar.
 */

export default function LanguageSelector() {
  const { lang, setLang, languages } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleChoose = (code) => {
    setLang(code);
    setOpen(false);
    // page translations will auto-load via context
  };

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Change language"
        style={{
          background: "transparent",
          border: "none",
          cursor: "pointer",
          padding: 6,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {/* globe svg */}
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke="#333" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12h20M12 2c2.5 4 2.5 12 0 20M12 2C9.5 6 9.5 18 12 22" stroke="#333" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>

        <span style={{ fontSize: 13 }}>{languages[lang]}</span>
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            marginTop: 8,
            background: "#fff",
            border: "1px solid #eee",
            boxShadow: "0 6px 20px rgba(0,0,0,0.08)",
            borderRadius: 8,
            zIndex: 40,
            minWidth: 160,
            overflow: "hidden",
          }}
        >
          {Object.entries(languages).map(([code, label]) => (
            <div
              key={code}
              onClick={() => handleChoose(code)}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: code === lang ? "#f6f8fa" : "transparent",
              }}
            >
              <span>{label}</span>
              {code === lang && <small style={{ color: "#666" }}>Selected</small>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
