"use client"
import React, { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"

function ProfileMenu({ user, onEditProfile, onLogout }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const navigate = useNavigate()

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    if (open) {
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [open])

  if (!user) return null

  function handleViewProfile() {
    setOpen(false)
    navigate("/profile")
  }

  return (
    <div className="profile-menu" ref={menuRef}>
      <button className="btn" onClick={() => setOpen(!open)}>
        <span className="icon">👤</span> {user.name || user.displayName || "User"}
      </button>
      {open && (
        <div className="profile-card">
          <div className="bold">{user.name || user.displayName || "User"}</div>
          <div className="small text-muted">{user.email || user.phone || ""}</div>
          <div className="badge mt-3">Role: {user.role}</div>
          
          {/* View Profile Button */}
          <button
            className="btn mt-3"
            style={{ width: "100%" }}
            onClick={handleViewProfile}
            title="View your complete profile information"
          >
            View Profile
          </button>
          
          <div className="row mt-3">
            <button
              className="btn"
              onClick={() => {
                setOpen(false)
                onEditProfile?.()
              }}
              title="Update your profile information and settings"
            >
              Edit profile
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setOpen(false)
                onLogout?.()
              }}
              title="Sign out of your account"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProfileMenu