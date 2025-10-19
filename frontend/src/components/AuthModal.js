"use client"
import React, { useState, useEffect } from "react"
import { auth, googleProvider } from "../firebase"
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from "firebase/auth"

const PasswordStrength = typeof window !== "undefined" ? window.PasswordStrength : null
const validPhone = (phone) => /^\d{10}$/.test(phone)

function AuthModal({ open, onClose, onAuthed, initialTab = "signin", initialMethod = "email", initialRole = "customer" }) {
  const [tab, setTab] = useState(initialTab)
  const [method, setMethod] = useState(initialMethod)
  const [role, setRole] = useState(initialRole)
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

  // --- GOOGLE SIGN-IN ---
  async function handleGoogle() {
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      onAuthed?.(result.user)
      onClose?.()
    } catch (err) {
      console.error(err)
      alert("Google sign-in failed: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- EMAIL SIGNUP / SIGNIN ---
  async function handleEmailSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (tab === "signup") {
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
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      onAuthed?.(auth.currentUser)
      onClose?.()
    } catch (err) {
      console.error("Email auth error:", err)
      if (err.code === "auth/user-not-found") {
        alert("No account found. Please sign up first.")
      } else if (err.code === "auth/wrong-password") {
        alert("Incorrect password. Try again.")
      } else if (err.code === "auth/weak-password") {
        alert("Password should be at least 6 characters.")
      } else {
        alert(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  // --- PHONE OTP SEND ---
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
        msg += "Invalid phone number."
      } else if (err.code === "auth/too-many-requests") {
        msg += "Too many attempts. Try later."
      } else {
        msg += err.message
      }
      alert(msg)
    } finally {
      setLoading(false)
    }
  }

  // --- PHONE OTP VERIFY ---
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
      
      onAuthed?.(result.user)
      onClose?.()
    } catch (err) {
      console.error("OTP verify error:", err)
      alert("Invalid OTP. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className={`btn ${tab === "signin" ? "btn-primary" : ""}`}
              onClick={() => setTab("signin")}
            >
              Sign in
            </button>
            <button
              className={`btn ${tab === "signup" ? "btn-primary" : ""}`}
              onClick={() => setTab("signup")}
            >
              Sign up
            </button>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="row">
            <div>
              <label className="label">Continue as</label>
              <select
                className="select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="customer">Buyer / Customer</option>
                <option value="artisan">Local Artisan</option>
              </select>
            </div>
            <div>
              <label className="label">Method</label>
              <select
                className="select"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="email">Email & Password</option>
                <option value="phone">Phone (OTP)</option>
              </select>
            </div>
          </div>

          {tab === "signup" && method === "email" && (
            <div className="mt-3">
              <label className="label">Full Name</label>
              <input
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>
          )}

          {method === "email" ? (
            <form className="mt-3" onSubmit={handleEmailSubmit}>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
              <label className="label mt-3">Password</label>
              <input
                className="input"
                type="password"
                required={tab === "signup"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              {tab === "signup" && PasswordStrength && (
                <PasswordStrength value={password} />
              )}
              <div className="form-actions">
                <button
                  className="btn"
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  Continue with Google
                </button>
                <button className="btn btn-primary" type="submit" disabled={loading}>
                  {loading ? (tab === "signin" ? "Signing in..." : "Creating...") : (tab === "signin" ? "Sign in" : "Create account")}
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-3" onSubmit={verifyOtp}>
              <div id="recaptcha-container" style={{ marginBottom: 16 }}></div>
              
              {tab === "signup" && (
                <div className="mt-3">
                  <label className="label">Full Name (Optional)</label>
                  <input
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
              )}
              
              <label className="label">Phone (10 digits)</label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                maxLength="10"
              />
              <button
                type="button"
                className="btn mt-2"
                onClick={sendOtp}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>
              
              {confirmationResult && (
                <>
                  <label className="label mt-3">OTP</label>
                  <input
                    className="input"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength="6"
                  />
                </>
              )}
              
              <div className="form-actions">
                <button
                  className="btn"
                  type="button"
                  onClick={handleGoogle}
                  disabled={loading}
                >
                  Continue with Google
                </button>
                <button className="btn btn-primary" type="submit" disabled={loading || !confirmationResult}>
                  {loading ? "Verifying..." : (tab === "signin" ? "Verify & Sign in" : "Verify & Sign up")}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default AuthModal