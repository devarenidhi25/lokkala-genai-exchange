"use client"
import React from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { AppStore } from "../utils/storage"
import ProfileMenu from "./ProfileMenu"

function Header({ user }) {
  const navigate = useNavigate()
  const location = useLocation()

  function refreshToHome() {
    if (location.pathname === "/") {
      window.location.reload()
    } else {
      navigate("/")
      setTimeout(() => window.location.reload(), 0)
    }
  }

  function goEditProfile() {
    if (!user) return
    if (user.role === "artisan") navigate("/profile-setup/artisan")
    else navigate("/profile-setup/customer")
  }

  function handleLogout() {
    AppStore.logout()
    navigate("/")
    window.location.reload()
  }

  // Smooth scroll to footer
  function scrollToFooter(e) {
    e.preventDefault()
    const footer = document.getElementById("contact")
    if (footer) {
      footer.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <header className="header">
      <div className="container header-inner">
        <a role="button" className="brand" onClick={refreshToHome}>
          <span className="brand-name">LokKala</span>
          <span className="india-chip" style={{ marginLeft: 10 }}>
            <span className="india-flag" aria-hidden="true"></span>
            <span className="small">Made for Indian artisans</span>
          </span>
        </a>
        <nav className="nav">
          <Link to="/">Home</Link>
          <Link to="/products">Explore Products</Link>
          <a href="#footer" onClick={scrollToFooter}>
            Contact Us
          </a>

          {!user ? (
            <>
              <button
                className="btn"
                onClick={() => navigate("/signin")}
                title="Sign in to your existing account to access your profile"
              >
                Sign in
              </button>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/signup")}
                title="Create a new account as an artisan or customer"
              >
                Sign up
              </button>
            </>
          ) : (
            <ProfileMenu
              user={user}
              onEditProfile={goEditProfile}
              onLogout={handleLogout}
            />
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
