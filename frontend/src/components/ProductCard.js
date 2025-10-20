import React, { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function ProductCard({ product }) {
  const { tSync, t } = useLanguage();
  const [translatedName, setTranslatedName] = useState(product.name);
  const [translatedCategory, setTranslatedCategory] = useState(product.category);
  const [translatedArtisan, setTranslatedArtisan] = useState(product.artisan);

  useEffect(() => {
    let mounted = true;
    // request translations for product fields (non-blocking)
    (async () => {
      const arr = [product.name, product.category, product.artisan];
      const res = await t(arr); // triggers backend if missing
      if (!mounted) return;
      setTranslatedName(res[0] ?? product.name);
      setTranslatedCategory(res[1] ?? product.category);
      setTranslatedArtisan(res[2] ?? product.artisan);
    })();
    return () => (mounted = false);
  }, [product, t]);

  function shareProduct() {
    const base = `${window.location.origin}${window.location.pathname}#/products`;
    const url = `${base}?pid=${encodeURIComponent(product.id)}`;
    const text = `Check out "${tSync(translatedName)}" - ₹${product.price} on LokKala: ${url}`;
    if (navigator.share) {
      navigator.share({ title: tSync(translatedName), text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert(tSync("Link copied to clipboard!"));
      });
    }
  }

  return (
    <div style={{
      background: "#fff",
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      transition: "transform 0.2s, box-shadow 0.2s",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-4px)"
      e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.12)"
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)"
      e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"
    }}>
      <img 
        src={product.image || "/placeholder.svg"} 
        alt={product.name}
        style={{ width: "100%", height: 180, objectFit: "cover" }}
      />
      <div style={{ padding: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 8px 0" }}>
          {tSync(translatedName)}
        </h3>
        <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
          ₹{product.price} {product.state && `• ${product.state}`}
        </div>
        {translatedArtisan && (
          <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
            {tSync("By")}: {tSync(translatedArtisan)}
          </div>
        )}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{
            display: "inline-block",
            padding: "4px 10px",
            background: "#e8f4ff",
            color: "#2563eb",
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
          }}>
            {tSync(translatedCategory)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button 
            onClick={shareProduct}
            style={{
              flex: 1,
              padding: "8px 16px",
              background: "transparent",
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent"
            }}
          >
            {tSync("Share")}
          </button>
          <button 
            style={{
              flex: 1,
              padding: "8px 16px",
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#1d4ed8"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#2563eb"
            }}
          >
            {tSync("View")}
          </button>
        </div>
      </div>
    </div>
  );
}

// For non-module environments
if (typeof window !== 'undefined') {
  window.ProductCard = ProductCard;
}