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

function ImageEnhancement() {
  const [src, setSrc] = React.useState("")
  const imgRef = React.useRef(null)
  const canvasRef = React.useRef(null)

  function onUpload(e) {
    const f = e.target.files?.[0]
    if (!f) return
    const r = new FileReader()
    r.onload = () => setSrc(r.result)
    r.readAsDataURL(f)
  }

  function onEnhance() {
    const img = imgRef.current
    const canvas = canvasRef.current
    if (!img || !canvas) return
    enhanceImageOnCanvas(img, canvas)
  }

  return (
    <main className="container">
      <h2 className="bold mt-3">✨ Image Enhancement</h2>
      <input className="input mt-3" type="file" accept="image/*" onChange={onUpload} />
      <div className="row mt-3">
        <div>
          {src ? (
            <img ref={imgRef} src={src} alt="Original" style={{ width: "100%", borderRadius: 10 }} />
          ) : (
            <div className="small text-muted">No image uploaded yet.</div>
          )}
        </div>
        <div>
          <canvas ref={canvasRef} style={{ width: "100%", borderRadius: 10, background: "#f8fafc" }}></canvas>
        </div>
      </div>
      <button className="btn btn-primary mt-3" onClick={onEnhance}>
        Enhance with AI (demo)
      </button>
    </main>
  )
}

export default ImageEnhancement
