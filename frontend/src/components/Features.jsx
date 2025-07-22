import React from 'react'

const Features = () => {
  const features = [
    {
      icon: '📚',
      title: 'Course Creation',
      description: 'Build engaging courses with our intuitive drag-and-drop editor'
    },
    {
      icon: '👥',
      title: 'Student Management',
      description: 'Track progress, manage enrollments, and engage learners effectively'
    },
    {
      icon: '📊',
      title: 'Analytics & Reporting',
      description: 'Get detailed insights into learning outcomes and performance metrics'
    },
    {
      icon: '🤖',
      title: 'AI-Powered Tools',
      description: 'Leverage artificial intelligence for personalized learning experiences'
    }
  ]

  return (
    <section className="features-section" id="features">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 className="section-title">
            Complete Learning
            <span style={{
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              display: 'block'
            }}>
              Management Suite
            </span>
          </h2>
          <p className="section-description">
            Traditional LMS features enhanced with blockchain technology and Web3 capabilities
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div 
                className="feature-icon" 
                style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}
              >
                {feature.icon}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features
