"use client"

function ProductCard({ product }) {
  function shareProduct() {
    const base = `${window.location.origin}${window.location.pathname}#/products`
    const url = `${base}?pid=${encodeURIComponent(product.id)}`
    const text = `Check out "${product.name}" - ₹${product.price} on ArtConnect India: ${url}`
    if (navigator.share) {
      navigator.share({ title: product.name, text, url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text).then(() => {
        alert("Link copied to clipboard!")
      })
    }
  }

  return (
    <div className="card product-card">
      <img className="product-img" src={product.image || "/placeholder.svg"} alt={product.name} />
      <div className="card-body">
        <div className="product-meta">
          <div>
            <div className="bold">{product.name}</div>
            <div className="small text-muted">
              ₹{product.price} • {product.state}
            </div>
            {/* ✅ Add artisan name below price/state */}
            {product.artisan && (
              <div className="small text-gray-700">By: {product.artisan}</div>
            )}
          </div>
          <div className="badge">{product.category}</div>
        </div>
        <div className="form-actions">
          <button className="btn" onClick={shareProduct}>
            Share
          </button>
          <button className="btn btn-primary">View</button>
        </div>
      </div>
    </div>
  )
}

window.ProductCard = ProductCard
export default ProductCard
