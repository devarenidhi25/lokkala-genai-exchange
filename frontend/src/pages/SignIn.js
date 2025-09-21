"use client"

import React, { useState } from "react"
import { auth, googleProvider } from "../firebase"
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { AppStore } from "../utils/storage"

const validPhone = (phone) => /^\d{10}$/.test(phone)

function SignIn() {
  const navigate = useNavigate()
  const [method, setMethod] = useState("email")
  const [role, setRole] = useState("customer")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState(null)

  // helper to route after auth
  // helper to route after auth
  function completeAuth(user, roleOverride) {
    const r = roleOverride || role || (user?.role) || "customer"
    const userData = {
      uid: user?.uid,
      email: user?.email || "",
      name: user?.displayName || "Guest",
      role: r,
    }
    AppStore.setUser(userData)

    if (r === "customer") {
      navigate("/products")
    } else if (r === "artisan") {
      navigate("/artisan")
    }

    try {
      window.location.reload()
    } catch (e) {
      // ignore
    }
  }


  // Google sign-in
  async function handleGoogle() {
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      completeAuth(result.user)
    } catch (err) {
      console.error(err)
      alert("Google sign-in failed: " + (err?.message || err))
    } finally {
      setLoading(false)
    }
  }

  // Email sign-in
  async function handleEmailSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      completeAuth(result.user)
    } catch (err) {
      console.error("Email sign-in error:", err)
      if (err.code === "auth/user-not-found") {
        alert("No account found. Please sign up first.")
      } else if (err.code === "auth/wrong-password") {
        alert("Incorrect password. Try again.")
      } else {
        alert(err.message || "Sign in failed.")
      }
    } finally {
      setLoading(false)
    }
  }

  // recaptcha helper (robust)
  const getRecaptchaVerifier = async () => {
    if (typeof window === "undefined") return null
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear()
      } catch {}
      window.recaptchaVerifier = null
    }
    const verifier = new RecaptchaVerifier("recaptcha-container", { size: "invisible" }, auth)
    await verifier.render()
    window.recaptchaVerifier = verifier
    return verifier
  }

  // send OTP
  const sendOtp = async () => {
    if (!validPhone(phone)) {
      alert("Enter a valid 10-digit phone number")
      return
    }
    setLoading(true)
    try {
      const appVerifier = await getRecaptchaVerifier()
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, appVerifier)
      setConfirmationResult(result)
      alert("OTP sent successfully!")
    } catch (err) {
      console.error("Send OTP error:", err)
      alert("Failed to send OTP: " + (err?.message || err))
    } finally {
      setLoading(false)
    }
  }

  // verify OTP
  const verifyOtp = async (e) => {
    e.preventDefault()
    if (!confirmationResult) {
      alert("Please request OTP first")
      return
    }
    setLoading(true)
    try {
      const result = await confirmationResult.confirm(otp)
      completeAuth(result.user)
    } catch (err) {
      console.error("OTP verify error:", err)
      alert("Invalid OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page"
    style = {{
      background: 'url("/images/auth-bg.avif") no-repeat center center / cover',
    }}
    >
      <div className="bg-circles" />
      
      {/* <div className="container"> */}
        <div className="auth-container animate-slide-up">
          <div className="auth-header">
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to continue your journey</p>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div>
              <label className="form-label">Continue as</label>
              <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="customer">Buyer / Customer</option>
                <option value="artisan">Local Artisan</option>
              </select>
            </div>

            <div>
              <label className="form-label">Method</label>
              <select className="form-input" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="email">Email & Password</option>
                <option value="phone">Phone (OTP)</option>
              </select>
            </div>
          </div>

          {method === "email" ? (
            <form className="auth-form" onSubmit={handleEmailSubmit}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="auth-buttons">
                <button type="button" className="btn btn-google" onClick={handleGoogle} disabled={loading}>
                  <i className="fab fa-google" style={{ marginRight: 8 }} />
                  Continue with Google
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Signing In..." : "Sign In"}
                </button>
              </div>
            </form>
          ) : (
            <form className="auth-form" onSubmit={verifyOtp}>
              <div id="recaptcha-container" />
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  className="form-input"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  required
                />
              </div>

              <button type="button" className="btn btn-secondary" onClick={sendOtp} disabled={loading}>
                Send OTP
              </button>

              <div className="form-group">
                <label className="form-label">OTP</label>
                <input
                  className="form-input"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                />
              </div>

              <div className="auth-buttons">
                <button type="button" className="btn btn-google" onClick={handleGoogle} disabled={loading}>
                  <i className="fab fa-google" style={{ marginRight: 8 }} />
                  Continue with Google
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Sign In"}
                </button>
              </div>
            </form>
          )}

          <div style={{ marginTop: 16, textAlign: "center" }}>
            <span style={{ color: "#666" }}>Don't have an account? </span>
            <button className="btn btn-ghost" onClick={() => navigate("/signup")}>
              Create one
            </button>
          </div>
        </div>
      {/* </div> */}
    </div>
  )
}

window.SignIn = SignIn
export default window.SignIn
