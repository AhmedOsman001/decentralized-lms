import React from 'react'

const SocialProof = () => {
  return (
    <section className="social-proof">
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h2 className="section-title" style={{ marginBottom: '24px' }}>
            Trusted by Industry Leaders
          </h2>
          <div className="stars">
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
            <span className="star">★</span>
            <span style={{ color: 'rgba(255, 255, 255, 0.8)', marginLeft: '8px' }}>
              4.9/5 from 2,500+ reviews
            </span>
          </div>
        </div>

        <div className="testimonial">
          <blockquote className="testimonial-text">
            "The ICP-powered LMS gave us tamper-proof certifications and eliminated our concerns about 
            data security. Our students love the instant verification of their achievements."
          </blockquote>
          <div className="testimonial-author">
            <div className="author-name">Dr. Michael Chen</div>
            <div className="author-title">Director of Digital Education, BlockEdu University</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SocialProof
