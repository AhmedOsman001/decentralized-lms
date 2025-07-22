import React from 'react'
import Navigation from './components/Navigation'
import Hero from './components/Hero'
import ICPFeatures from './components/ICPFeatures'
import Features from './components/Features'
import SocialProof from './components/SocialProof'
import CTA from './components/CTA'
import Footer from './components/Footer'
import './App.css'

function App() {
  return (
    <div className="App">
      <Navigation />
      <Hero />
      <ICPFeatures />
      <Features />
      <SocialProof />
      <CTA />
      <Footer />
    </div>
  )
}

export default App
