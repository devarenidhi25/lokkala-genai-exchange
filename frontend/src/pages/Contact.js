function ContactPage() {
  return (
    <main className="container">
      <section className="mt-4 card">
        <div className="card-body">
          <h2 className="bold">Contact Us</h2>
          <p className="small text-muted">We’d love to hear from you. Share feedback or partnership ideas.</p>
          <div className="row mt-3">
            <div>
              <label className="label">Your Name</label>
              <input className="input" placeholder="Full name" />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" />
            </div>
          </div>
          <div className="mt-3">
            <label className="label">Message</label>
            <textarea className="textarea" rows="5" placeholder="Type your message..."></textarea>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" title="Send your message to our team">Send</button>
          </div>
        </div>
      </section>
    </main>
  )
}

window.ContactPage = ContactPage
export default ContactPage