import React from 'react'

const Hero = () => {
  const handleBookDemo = () => {
    alert('Demo booking functionality would be integrated here!')
  }

  const handleWatchDemo = () => {
    alert('Demo video would be opened here!')
  }

  return (
    <section className="hero">
      <div className="container">
        <div className="hero-content">
          <h1 className="hero-title">
            Next-Gen Learning
            <span className="hero-subtitle">Powered by ICP</span>
          </h1>
          <p className="hero-description">
            Experience the future of education with our blockchain-powered LMS built on the Internet Computer. 
            Secure, decentralized, and lightning-fast learning management for the Web3 era.
          </p>
          
          <div className="cta-buttons">
            <button className="btn-primary" onClick={handleBookDemo}>
              Book a Demo
              <span className="icon">→</span>
            </button>
            <button className="btn-secondary" onClick={handleWatchDemo}>
              <span className="icon">▶</span>
              Watch Demo
            </button>
          </div>

          <div className="stats-container">
            <div className="stats-bg"></div>
            <div className="stats-card">
              <div className="stats-grid">
                <div>
                  <div className="stat-number">50K+</div>
                  <div className="stat-label">Active Learners</div>
                </div>
                <div>
                  <div className="stat-number">1,200+</div>
                  <div className="stat-label">Courses Created</div>
                </div>
                <div>
                  <div className="stat-number">98%</div>
                  <div className="stat-label">Satisfaction Rate</div>
                </div>
                <div>
                  <div className="stat-number">24/7</div>
                  <div className="stat-label">Support Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
