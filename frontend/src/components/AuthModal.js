"use client"
import React, { useState, useEffect } from "react"
import { auth, googleProvider } from "../firebase"
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
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
        await createUserWithEmailAndPassword(auth, email, password)
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

  const getRecaptchaVerifier = async () => {
    if (typeof window === "undefined") return null;

    // Clear old verifier if exists
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn("Old reCAPTCHA could not be cleared:", e);
      }
      window.recaptchaVerifier = null;
    }

    const verifier = new RecaptchaVerifier(
      "recaptcha-container",
      {
        size: "invisible",
        callback: (response) => {
          console.log("reCAPTCHA solved:", response);
        },
        "expired-callback": () => {
          console.warn("reCAPTCHA expired. Try again.");
        },
      },
      auth
    );

    await verifier.render(); // ✅ Important: wait for render
    window.recaptchaVerifier = verifier;
    return verifier;
  };


  const sendOtp = async () => {
    if (!validPhone(phone)) {
      alert("Enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    try {
      const appVerifier = await getRecaptchaVerifier(); // ✅ await here
      if (!appVerifier) throw new Error("RecaptchaVerifier not initialized");

      const result = await signInWithPhoneNumber(auth, `+91${phone}`, appVerifier);
      setConfirmationResult(result);
      alert("OTP sent successfully!");
    } catch (err) {
      console.error("Send OTP error:", err);
      alert("Failed to send OTP: " + err.message);
    } finally {
      setLoading(false);
    }
  };


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

          {tab === "signup" && (
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
                  {tab === "signin" ? "Sign in" : "Create account"}
                </button>
              </div>
            </form>
          ) : (
            <form className="mt-3" onSubmit={verifyOtp}>
              <div id="recaptcha-container"></div>
              <label className="label">Phone (10 digits)</label>
              <input
                className="input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
              />
              <button
                type="button"
                className="btn mt-2"
                onClick={sendOtp}
                disabled={loading}
              >
                Send OTP
              </button>
              <label className="label mt-3">OTP</label>
              <input
                className="input"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
              />
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
                  {tab === "signin" ? "Verify & Sign in" : "Verify & Sign up"}
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
