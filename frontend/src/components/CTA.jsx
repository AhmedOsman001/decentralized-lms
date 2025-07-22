import React from 'react'

const CTA = () => {
  const handleBookDemo = () => {
    alert('Demo booking functionality would be integrated here!')
  }

  const handleContactSales = () => {
    alert('Contact form would be opened here!')
  }

  return (
    <section className="cta-section">
      <div className="container">
        <div className="cta-card">
          <h2 className="section-title" style={{ marginBottom: '24px' }}>
            Ready for Web3 Education?
          </h2>
          <p style={{
            fontSize: '20px',
            color: 'rgba(255, 255, 255, 0.8)',
            marginBottom: '32px',
            maxWidth: '512px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}>
            Join the future of learning with blockchain-verified credentials, decentralized storage, 
            and tamper-proof academic records on the Internet Computer
          </p>
          
          <div className="cta-buttons-row">
            <button className="btn-primary" onClick={handleBookDemo}>
              Book Your Demo Today
              <span className="icon">→</span>
            </button>
            <button className="btn-white" onClick={handleContactSales}>
              Contact Sales
            </button>
          </div>
          
          <div className="trust-indicator">
            <span className="icon">✓</span>
            Built on Internet Computer • Blockchain-verified certificates • Zero gas fees
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA
