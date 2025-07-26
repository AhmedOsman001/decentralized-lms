import React, { useState } from 'react'

const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <nav className="nav">
      <div className="nav-container">
        <div className="logo">
          <div className="logo-icon">
            <span className="icon">📚</span>
          </div>
          <span className="logo-text">ChainHub</span>
        </div>
        
        <div className="nav-links">
          <a href="#features" className="nav-link">Features</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a href="#about" className="nav-link">About</a>
          <button className="nav-button">Get Started</button>
        </div>

        <button className="menu-toggle" onClick={toggleMenu}>☰</button>
      </div>

      <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
        <a href="#features">Features</a>
        <a href="#pricing">Pricing</a>
        <a href="#about">About</a>
        <button>Get Started</button>
      </div>
    </nav>
  )
}

export default Navigation
