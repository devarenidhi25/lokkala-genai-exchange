"use client"
import React, { useState, useEffect } from "react"
import { useLocation } from "react-router-dom"
import { getFirestore, collection, getDocs } from "firebase/firestore"
import SearchFilters from "../components/SearchFilters"
import IndiaMap from "../components/IndiaMap"
import ProductCard from "../components/ProductCard"
import LanguageSelectorBubble from "../components/LanguageSelectorBubble"

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
  const profile = location.state
  const db = getFirestore()
  
  const [allProducts, setAllProducts] = useState(SAMPLE_PRODUCTS)
  const [filtered, setFiltered] = useState(SAMPLE_PRODUCTS)
  const [selectedStateFromMap, setSelectedStateFromMap] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch artisan products from Firestore
  useEffect(() => {
    async function fetchArtisanProducts() {
      try {
        console.log("Fetching artisan products from Firestore...")
        const usersSnapshot = await getDocs(collection(db, "users"))
        const artisanProducts = []

        usersSnapshot.forEach((doc) => {
          const userData = doc.data()
          
          // Only process artisan profiles with products
          if (userData.type === "artisan" && userData.products && userData.products.length > 0) {
            userData.products.forEach((product, index) => {
              artisanProducts.push({
                id: `artisan_${doc.id}_${index}`,
                name: product.name,
                price: parseFloat(product.price),
                category: userData.craftType || "Handmade",
                state: userData.state || "India",
                artisan: userData.displayName || userData.email?.split('@')[0] || "Artisan",
                image: product.images && product.images.length > 0 ? product.images[0] : "https://images.unsplash.com/photo-1596462502278-27bfdc403348?q=80&w=1200&auto=format&fit=crop",
                description: product.description,
                uploadedAt: product.uploadedAt,
                artisanId: product.artisanId,
                allImages: product.images
              })
            })
          }
        })

        console.log(`Found ${artisanProducts.length} artisan products`)
        
        // Combine sample products with artisan products
        const combinedProducts = [...SAMPLE_PRODUCTS, ...artisanProducts]
        setAllProducts(combinedProducts)
        setFiltered(combinedProducts)
      } catch (error) {
        console.error("Error fetching artisan products:", error)
        // If error, just use sample products
        setAllProducts(SAMPLE_PRODUCTS)
        setFiltered(SAMPLE_PRODUCTS)
      } finally {
        setLoading(false)
      }
    }

    fetchArtisanProducts()
  }, [db])

  useEffect(() => {
    if (profile?.location) {
      const res = allProducts.filter((p) => p.state === profile.location)
      setFiltered(res.length ? res : allProducts)
    }
  }, [profile, allProducts])

  function handleStateSelect(state) {
    setSelectedStateFromMap(state)
    if (!state) {
      setFiltered(allProducts)
    } else {
      const res = allProducts.filter((p) => p.state === state)
      setFiltered(res.length ? res : [])
    }
  }

  const styles = {
    page: { padding: 16 },
    top: { marginBottom: 14 },
    content: { display: "flex", gap: 20, alignItems: "flex-start" },
    left: { flex: 1 },
    right: { width: 360, minWidth: 220, position: "sticky", top: 16 },
    productsGrid: { 
      display: "grid", 
      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
      gap: 16 
    },
    mapContainer: { 
      padding: 8, 
      height: "600px",
      borderRadius: "8px",
      overflow: "hidden"
    },
    selectedBadge: {
      background: "#2563eb",
      color: "white",
      padding: "6px 12px",
      borderRadius: "4px",
      fontSize: "13px",
      marginBottom: "10px",
      display: "inline-flex",
      alignItems: "center",
      gap: "8px"
    },
    clearButton: {
      background: "transparent",
      border: "none",
      color: "white",
      cursor: "pointer",
      fontSize: "16px",
      padding: "0 4px"
    },
    loadingContainer: {
      textAlign: "center",
      padding: "40px",
      color: "#666"
    }
  }

  return (
    <main className="container" style={styles.page}>
      {profile && (
        <section className="card mt-2 p-2" style={{ marginBottom: 12 }}>
          <h2>Welcome, customer from {profile.location || "your city"}!</h2>
          <small>Preferences: {profile.cats?.join(", ") || "None selected"}</small>
        </section>
      )}

      <section style={styles.top} title="Use filters to find exactly what you're looking for">
        <SearchFilters products={allProducts} onChange={setFiltered} />
      </section>

      <section style={styles.content}>
        <div style={styles.left}>
          {selectedStateFromMap && (
            <div style={styles.selectedBadge}>
              <span>Showing products from: {selectedStateFromMap}</span>
              <button 
                onClick={() => handleStateSelect(null)}
                style={styles.clearButton}
                title="Clear filter"
              >
                ✕
              </button>
            </div>
          )}
          
          {loading ? (
            <div style={styles.loadingContainer}>
              <h3>Loading products...</h3>
              <p>Fetching handmade products from artisans...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
              <h3>No products found</h3>
              <p>Try selecting a different state or clearing filters</p>
            </div>
          ) : (
            <div style={styles.productsGrid}>
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>

        <aside style={styles.right}>
          <div className="card" style={styles.mapContainer}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
              📍 Select State to View Products
            </div>
            <IndiaMap 
              onSelectState={handleStateSelect} 
              products={allProducts}
            />
          </div>
        </aside>
      </section>

      {/* Floating Language Selector Bubble */}
      <LanguageSelectorBubble />
    </main>
  )
}

export default ProductsPage