"use client"

import { useState } from "react"
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom"
import { AppStore } from "./utils/storage"
import Header from "./components/Header"
import HomePage from "./pages/Home"
import ProductsPage from "./pages/Products"
import ProfileSetupCustomer from "./pages/ProfileSetupCustomer"
import ProfileSetupArtisan from "./pages/ProfileSetupArtisan"
import ArtisanDashboard from "./pages/ArtisanDashboard"
import CaptionGenerator from "./pages/CaptionGenerator"      // ✅ new
import ImageEnhancement from "./pages/ImageEnhancement"      // ✅ new
import SocialAgent from "./pages/SocialAgent"                // ✅ new
import AuthModal from "./components/AuthModal"
import Footer from "./components/Footer"
import SignUp from "./pages/SignUp"
import SignIn from "./pages/SignIn"

function AppShell() {
  const [authOpen, setAuthOpen] = useState(false)
  const navigate = useNavigate()

  function openAuth() {
    setAuthOpen(true)
  }

  function handleAuthed(u) {
    AppStore.setUser(u)
    if (u.role === "artisan") {
      navigate("/profile-setup/artisan")
    } else {
      navigate("/profile-setup/customer")
    }
  }

  return (
    <>
      <Header user={AppStore.getUser()} onOpenAuth={openAuth} />

      <Routes>
        <Route path="/" element={<HomePage onOpenAuth={openAuth} />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/profile-setup/customer" element={<ProfileSetupCustomer />} />
        <Route path="/profile-setup/artisan" element={<ProfileSetupArtisan />} />
        <Route path="/artisan" element={<ArtisanDashboard />} />

        {/* ✅ new artisan feature routes */}
        <Route path="/caption-generator" element={<CaptionGenerator />} />
        <Route path="/image-enhancement" element={<ImageEnhancement />} />
        <Route path="/social-agent" element={<SocialAgent />} />

        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="*"
          element={
            <main className="container">
              <p>Page not found</p>
            </main>
          }
        />
      </Routes>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onAuthed={handleAuthed}
      />
      <Footer />
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}

export default App
