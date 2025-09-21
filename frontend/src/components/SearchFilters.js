"use client"
import React, { useState, useEffect } from "react"

function SearchFilters({ products, onChange }) {
  const [q, setQ] = useState("")
  const [cat, setCat] = useState("all")
  const [state, setState] = useState("all")
  const [price, setPrice] = useState([0, 5000])
  const [sort, setSort] = useState("relevance")

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
  }, [q, cat, price, sort, state, products])

  const categories = Array.from(new Set(products.map((p) => p.category)))
  const states = Array.from(new Set(products.map((p) => p.state)))

  return (
    <div className="card">
      <div className="card-body">
        <div className="row">
          <div>
            <label className="label">Search</label>
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search products..."
            />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="select" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="row mt-3">
          <div>
            <label className="label">State / Region</label>
            <select className="select" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="all">All</option>
              {states.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Sort</label>
            <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
        <div className="mt-3">
          <label className="label">Price range (₹{price[0]} - ₹{price[1]})</label>
          <div className="row">
            <input
              className="input"
              type="number"
              min="0"
              step="50"
              value={price[0]}
              onChange={(e) => setPrice([+e.target.value, price[1]])}
            />
            <input
              className="input"
              type="number"
              min="0"
              step="50"
              value={price[1]}
              onChange={(e) => setPrice([price[0], +e.target.value])}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default SearchFilters
