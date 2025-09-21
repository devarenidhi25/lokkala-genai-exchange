"use client"
import React, { useState } from "react"

function ProfileMenu({ user, onEditProfile, onLogout }) {
  const [open, setOpen] = useState(false)
  if (!user) return null

  return (
    <div className="profile-menu">
      <button className="btn" onClick={() => setOpen(!open)}>
        <span className="icon">👤</span> {user.name || "User"}
      </button>
      {open && (
        <div className="profile-card">
          <div className="bold">{user.name || "User"}</div>
          <div className="small text-muted">{user.email || user.phone || ""}</div>
          <div className="badge mt-3">Role: {user.role}</div>
          <div className="row mt-3">
            <button
              className="btn"
              onClick={() => {
                setOpen(false)
                onEditProfile?.()
              }}
            >
              Edit profile
            </button>
            <button
              className="btn btn-primary"
              onClick={() => {
                setOpen(false)
                onLogout?.()
              }}
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
