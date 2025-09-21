"use client"
import React, { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import SearchFilters from "../components/SearchFilters"
import IndiaMap from "../components/IndiaMap"
import ProductCard from "../components/ProductCard"

const SAMPLE_PRODUCTS = [
  {
    id: "p1",
    name: "Handloom Saree",
    price: 1500,
    category: "Clothing",
    state: "West Bengal",
    artisan: "Anjali Roy",
    image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p2",
    name: "Terracotta Pot",
    price: 450,
    category: "Pottery",
    state: "Maharashtra",
    artisan: "Ramesh Patil",
    image: "https://images.unsplash.com/photo-1621328910182-35a3561426d4b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p3",
    name: "Wood Carving Panel",
    price: 3200,
    category: "Woodwork",
    state: "Karnataka",
    artisan: "Kiran Shetty",
    image: "https://images.unsplash.com/photo-1519683109005-58efb1426d4b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p4",
    name: "Madhubani Painting",
    price: 2800,
    category: "Paintings",
    state: "Bihar",
    artisan: "Sita Kumari",
    image: "https://images.unsplash.com/photo-1611605698335-8e3b6b5480a6?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p5",
    name: "Embroidery Dupatta",
    price: 1100,
    category: "Accessories",
    state: "Punjab",
    artisan: "Harpreet Kaur",
    image: "https://images.unsplash.com/photo-1544441893005-58efb1426d4b?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p6",
    name: "Clay Diyas Set",
    price: 220,
    category: "Home",
    state: "Rajasthan",
    artisan: "Vikram Singh",
    image: "https://images.unsplash.com/photo-1508233620467-f79f1e317a05?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p7",
    name: "Block Print Fabric",
    price: 650,
    category: "Handloom",
    state: "Gujarat",
    artisan: "Meena Patel",
    image: "https://images.unsplash.com/photo-1585383490008-13ba8e77a5fd?q=80&w=1200&auto=format&fit=crop",
  },
  {
    id: "p8",
    name: "Brass Jewelry",
    price: 900,
    category: "Jewelry",
    state: "Tamil Nadu",
    artisan: "Lakshmi Nair",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=1200&auto=format&fit=crop",
  },
]


function ProductsPage() {
  const location = useLocation()
  const profile = location.state  // 👈 this is what you passed with navigate
  const [filtered, setFiltered] = useState(SAMPLE_PRODUCTS)

  useEffect(() => {
    if (profile?.location) {
      // optional: auto-filter products by profile location
      const res = SAMPLE_PRODUCTS.filter((p) => p.state === profile.location)
      setFiltered(res.length ? res : SAMPLE_PRODUCTS)
    }
  }, [profile])

  function handleStateSelect(state) {
    if (!state) return setFiltered(SAMPLE_PRODUCTS)
    const res = SAMPLE_PRODUCTS.filter((p) => p.state === state)
    setFiltered(res.length ? res : SAMPLE_PRODUCTS)
  }

  return (
    <main className="container">
      {profile && (
        <section className="card mt-2 p-2">
          <h2>Welcome, customer from {profile.location || "your city"}!</h2>
          <small>Preferences: {profile.cats?.join(", ") || "None selected"}</small>
        </section>
      )}

      <section className="mt-4">
        <div className="row">
          <div>
            <SearchFilters products={SAMPLE_PRODUCTS} onChange={setFiltered} />
          </div>
          <div>
            <IndiaMap onSelectState={handleStateSelect} />
          </div>
        </div>
      </section>

      <section className="mt-4">
        <div className="grid grid-3">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <footer className="footer">
        © {new Date().getFullYear()} ArtConnect India • Discover and support local artisans
      </footer>
    </main>
  )
}

export default ProductsPage