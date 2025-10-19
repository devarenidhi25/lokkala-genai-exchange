"use client"

import React, { useState, useEffect } from "react"
import { auth, googleProvider } from "../firebase"
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  updateProfile,
} from "firebase/auth"
import { useNavigate } from "react-router-dom"
import { AppStore } from "../utils/storage"

const PasswordStrength = typeof window !== "undefined" ? window.PasswordStrength : null
const validPhone = (phone) => /^\d{10}$/.test(phone)

function SignUp() {
  const navigate = useNavigate()
  const [method, setMethod] = useState("email")
  const [role, setRole] = useState("customer")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [otp, setOtp] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [confirmationResult, setConfirmationResult] = useState(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear()
        } catch (e) {}
        window.recaptchaVerifier = null
      }
    }
  }, [])

  // helper to route to profile setup
  function completeAuth(user) {
    const r = role || (user?.role) || "customer"
    const userData = {
      uid: user?.uid,
      email: user?.email || "",
      name: user?.displayName || name || "Guest",
      role: r,
    }
    AppStore.setUser(userData)

    // go to profile setup page according to role
    const route = r === "artisan" ? "/profile-setup/artisan" : "/profile-setup/customer"
    navigate(route)

    try {
      window.location.reload()
    } catch (e) {}
  }

  // Google
  async function handleGoogle() {
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      completeAuth(result.user)
    } catch (err) {
      console.error(err)
      alert("Google sign-up failed: " + (err?.message || err))
    } finally {
      setLoading(false)
    }
  }

  // Email signup
  async function handleEmailSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const methods = await fetchSignInMethodsForEmail(auth, email)
      if (methods.includes("password")) {
        alert("Email already exists. Please sign in instead.")
        setLoading(false)
        return
      }
      const result = await createUserWithEmailAndPassword(auth, email, password)

      // set displayName if provided
      try {
        if (name) {
          await updateProfile(result.user, { displayName: name })
        }
      } catch (err) {
        console.warn("Could not update displayName:", err)
      }

      completeAuth(result.user)
    } catch (err) {
      console.error("Email signup error:", err)
      if (err.code === "auth/weak-password") {
        alert("Password should be at least 6 characters.")
      } else {
        alert(err.message || "Sign up failed.")
      }
    } finally {
      setLoading(false)
    }
  }

  // send OTP
  const sendOtp = async () => {
    if (!validPhone(phone)) {
      alert("Enter a valid 10-digit phone number")
      return
    }
    
    setLoading(true)
    
    try {
      // Clear existing verifier COMPLETELY
      if (window.recaptchaVerifier) {
        try {
          await window.recaptchaVerifier.clear()
        } catch (e) {
          console.warn("Could not clear existing verifier:", e)
        }
        window.recaptchaVerifier = null
      }

      // Wait for any cleanup to finish
      await new Promise(resolve => setTimeout(resolve, 100))

      // Make sure container exists and is empty
      const container = document.getElementById("recaptcha-container")
      if (!container) {
        throw new Error("Recaptcha container not found!")
      }
      
      // Remove all child elements
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }

      console.log("Creating RecaptchaVerifier...")

      // Create verifier with explicit settings
      const recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "normal",
        callback: (response) => {
          console.log("✅ reCAPTCHA solved successfully!")
        },
        "expired-callback": () => {
          console.warn("⚠️ reCAPTCHA expired")
          alert("reCAPTCHA expired. Please try again.")
        }
      })

      // Store in window
      window.recaptchaVerifier = recaptchaVerifier

      console.log("Sending OTP to: +91" + phone)

      // Send OTP - this will show the reCAPTCHA
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, recaptchaVerifier)
      
      console.log("✅ OTP sent successfully!")
      setConfirmationResult(result)
      alert("OTP sent successfully! Check your phone.")
      
    } catch (err) {
      console.error("❌ Send OTP error:", err)
      console.error("Error code:", err.code)
      console.error("Error message:", err.message)
      
      // Clear verifier on error
      if (window.recaptchaVerifier) {
        try {
          await window.recaptchaVerifier.clear()
        } catch (e) {
          console.warn("Could not clear verifier after error:", e)
        }
        window.recaptchaVerifier = null
      }
      
      let msg = "Failed to send OTP. "
      if (err.code === "auth/invalid-phone-number") {
        msg += "Invalid phone number format."
      } else if (err.code === "auth/too-many-requests") {
        msg += "Too many attempts. Please try again later."
      } else if (err.code === "auth/invalid-app-credential") {
        msg += "App verification failed. Please make sure:\n1. Phone authentication is enabled in Firebase Console\n2. Your domain is authorized\n3. Try refreshing the page"
      } else if (err.code === "auth/captcha-check-failed") {
        msg += "Please complete the reCAPTCHA verification."
      } else {
        msg += err.message
      }
      alert(msg)
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
      console.log("User signed in:", result.user)

      // set displayName if provided
      try {
        if (name && auth.currentUser) {
          await updateProfile(auth.currentUser, { displayName: name })
        }
      } catch (err) {
        console.warn("Could not update displayName:", err)
      }

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
      <div className="auth-container animate-slide-up">
        <div className="auth-header">
          <h1 className="auth-title">Join LokKala</h1>
          <p className="auth-subtitle">Connect with local artisans and discover authentic crafts</p>
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
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>

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
              {PasswordStrength && <PasswordStrength value={password} />}
            </div>

            <div className="auth-buttons">
              <button type="button" className="btn btn-google" onClick={handleGoogle} disabled={loading}>
                <i className="fa fa-google" style={{ marginRight: 8 }} />
                Google
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </div>
          </form>
        ) : (
          <form className="auth-form" onSubmit={verifyOtp}>
            <div id="recaptcha-container" style={{ marginBottom: 16 }} />
            
            <div className="form-group">
              <label className="form-label">Full Name (Optional)</label>
              <input
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                className="form-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                maxLength="10"
                required
              />
            </div>

            <button type="button" className="btn btn-secondary" onClick={sendOtp} disabled={loading}>
              {loading ? "Sending..." : "Send OTP"}
            </button>

            {confirmationResult && (
              <div className="form-group" style={{ marginTop: 12 }}>
                <label className="form-label">Enter OTP</label>
                <input
                  className="form-input"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength="6"
                />
              </div>
            )}

            <div className="auth-buttons">
              <button type="button" className="btn btn-google" onClick={handleGoogle} disabled={loading}>
                <i className="fa fa-google" style={{ marginRight: 8 }} />
                Google
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || !confirmationResult}>
                {loading ? "Verifying..." : "Verify & Sign Up"}
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: 16, textAlign: "center" }}>
          <span style={{ color: "#666" }}>Already have an account? </span>
          <button className="btn btn-ghost" onClick={() => navigate("/signin")}>
            Sign in
          </button>
        </div>
      </div>
    </div>
  )
}

window.SignUp = SignUp
export default window.SignUp