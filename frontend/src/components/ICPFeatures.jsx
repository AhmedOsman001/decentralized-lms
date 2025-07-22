import React from 'react'

const ICPFeatures = () => {
  const features = [
    {
      icon: '🛡️',
      title: 'Tamper-Proof Credentials',
      description: 'Issue blockchain-verified certificates and credentials that can\'t be forged or manipulated'
    },
    {
      icon: '🌐',
      title: 'Decentralized Access',
      description: 'No single point of failure - your LMS runs on the Internet Computer\'s distributed network'
    },
    {
      icon: '⚡',
      title: 'Web Speed Performance',
      description: 'Lightning-fast loading with ICP\'s web-speed blockchain technology'
    },
    {
      icon: '💾',
      title: 'Permanent Data Storage',
      description: 'Course content and progress stored permanently on-chain with guaranteed availability'
    }
  ]

  return (
    <section className="icp-section">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <div className="section-badge">Built on Internet Computer Protocol</div>
          <h2 className="section-title">
            Web3-Native Learning
            <span className="section-subtitle">Management System</span>
          </h2>
          <p className="section-description">
            Harness the power of blockchain technology for secure, transparent, and future-proof education
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="icp-stats">
          <div className="icp-stats-grid">
            <div>
              <div className="icp-stat-number blue">100%</div>
              <div className="icp-stat-label">On-Chain Storage</div>
            </div>
            <div>
              <div className="icp-stat-number cyan">Sub-Second</div>
              <div className="icp-stat-label">Query Response</div>
            </div>
            <div>
              <div className="icp-stat-number purple">Zero</div>
              <div className="icp-stat-label">Gas Fees</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ICPFeatures
