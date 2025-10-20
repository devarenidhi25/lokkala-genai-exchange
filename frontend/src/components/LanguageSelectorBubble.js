import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

/**
 * Floating language selector bubble for products page
 * Shows as a floating globe icon that expands on hover
 */

export default function LanguageSelectorBubble() {
  const { lang, setLang, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const dropdownRef = useRef(null);
  const hoverTimeout = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    setHovered(true);
    // Open dropdown after a short delay on hover
    hoverTimeout.current = setTimeout(() => {
      setOpen(true);
    }, 300);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    // Keep dropdown open briefly to allow moving cursor to it
    setTimeout(() => {
      if (!dropdownRef.current?.matches(':hover')) {
        setOpen(false);
      }
    }, 100);
  };

  const handleChoose = (code) => {
    setLang(code);
    setOpen(false);
  };

  return (
    <div 
      ref={dropdownRef}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 1000,
      }}
    >
      {/* Floating bubble button */}
      <button
        onClick={() => setOpen((v) => !v)}
        onMouseEnter={handleMouseEnter}
        aria-label="Change language"
        title="Select Language"
        style={{
          width: open ? "auto" : "56px",
          height: "56px",
          borderRadius: "28px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          border: "none",
          boxShadow: hovered || open 
            ? "0 8px 24px rgba(102, 126, 234, 0.4)" 
            : "0 4px 12px rgba(102, 126, 234, 0.3)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          padding: open ? "0 20px 0 16px" : "0",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: hovered ? "scale(1.05)" : "scale(1)",
          position: "relative",
        }}
      >
        {/* Globe icon */}
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          style={{
            transition: "transform 0.3s ease",
            transform: open ? "rotate(180deg)" : "rotate(0)",
          }}
        >
          <path 
            d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
          <path 
            d="M2 12h20M12 2c2.5 4 2.5 12 0 20M12 2C9.5 6 9.5 18 12 22" 
            stroke="white" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
          />
        </svg>

        {/* Language label when expanded */}
        {open && (
          <span 
            style={{ 
              color: "white", 
              fontSize: "14px", 
              fontWeight: "600",
              whiteSpace: "nowrap",
            }}
          >
            {languages[lang].split(" (")[0]}
          </span>
        )}

        {/* Tooltip on hover */}
        {hovered && !open && (
          <div
            style={{
              position: "absolute",
              bottom: "calc(100% + 12px)",
              right: "0",
              background: "rgba(0, 0, 0, 0.85)",
              color: "white",
              padding: "8px 14px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "500",
              whiteSpace: "nowrap",
              animation: "fadeIn 0.2s ease-out",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
            }}
          >
            Select Language
            {/* Tooltip arrow */}
            <div
              style={{
                position: "absolute",
                bottom: "-4px",
                right: "20px",
                width: "8px",
                height: "8px",
                background: "rgba(0, 0, 0, 0.85)",
                transform: "rotate(45deg)",
              }}
            />
          </div>
        )}
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "70px",
            right: "0",
            background: "white",
            border: "1px solid #e5e7eb",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
            borderRadius: "12px",
            minWidth: "240px",
            maxHeight: "420px",
            overflow: "auto",
            animation: "slideUp 0.3s ease-out",
          }}
        >
          {/* Header */}
          <div 
            style={{ 
              padding: "12px 16px", 
              borderBottom: "1px solid #e5e7eb", 
              fontSize: "12px", 
              color: "#6b7280", 
              fontWeight: "700",
              letterSpacing: "0.5px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12h20M12 2c2.5 4 2.5 12 0 20M12 2C9.5 6 9.5 18 12 22" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            SELECT YOUR LANGUAGE
          </div>

          {/* Language options */}
          {Object.entries(languages).map(([code, label]) => (
            <div
              key={code}
              onClick={() => handleChoose(code)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: code === lang ? "#f0f4ff" : "transparent",
                borderLeft: code === lang ? "4px solid #667eea" : "4px solid transparent",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (code !== lang) e.currentTarget.style.background = "#f9fafb";
              }}
              onMouseLeave={(e) => {
                if (code !== lang) e.currentTarget.style.background = "transparent";
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: code === lang ? "600" : "400" }}>
                {label}
              </span>
              {code === lang && (
                <svg 
                  width="18" 
                  height="18" 
                  viewBox="0 0 18 18" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path 
                    d="M15 5L7 13L3 9" 
                    stroke="#667eea" 
                    strokeWidth="2.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}

      <style>
        {`
          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(4px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}