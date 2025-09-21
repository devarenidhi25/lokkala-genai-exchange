"use client"

import { useState } from "react"
import emailjs from "emailjs-com"
import "./Footer.css"

const Footer = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // Replace with your own EmailJS credentials
    const SERVICE_ID = "service_kmjaiki"
    const TEMPLATE_ID = "template_f3x9e6o"
    const USER_ID = "p0UfgKtbRqc-ICVJL"

    emailjs.send(SERVICE_ID, TEMPLATE_ID, formData, USER_ID)
      .then(
        (result) => {
          alert("Message sent successfully!")
          setFormData({ name: "", email: "", message: "" })
        },
        (error) => {
          alert("Failed to send message. Please try again later.")
          console.error("EmailJS error:", error)
        }
      )
  }

  return (
    <footer id="contact" className="footer">
      <div className="footer-content">
        <div className="footer-section contact-section">
          <h3>Contact Us</h3>
          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-group">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your Name"
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Your Email"
                required
                className="form-input"
              />
            </div>
            <div className="form-group">
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Your Message"
                required
                className="form-textarea"
                rows="4"
              ></textarea>
            </div>
            <button type="submit" className="submit-button">
              Send Message
            </button>
          </form>
        </div>

        <div className="footer-section info-section">
          <h3>Quick Links</h3>
          <ul className="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="/products">Explore Products</a></li>
          </ul>
          {/* <div className="contact-info">
            <h4>Get in Touch</h4>
            <p>📧 support@homedocai.com</p>
          </div> */}
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; 2025 LokKala. All rights reserved.</p>
          <div className="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Medical Disclaimer</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
