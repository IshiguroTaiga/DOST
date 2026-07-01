import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Star, X, CheckCircle, ChatCircleText, User } from '@phosphor-icons/react'
import api from '../lib/api'
import '../styles/components/FeedbackModal.css'

export default function FeedbackModal({ isOpen, onClose, user, socket }) {
  const [activeTab, setActiveTab] = useState('rate') // 'rate' | 'reviews'
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [feedbacks, setFeedbacks] = useState([])
  const [stats, setStats] = useState({ average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const modalRef = useRef(null)

  // Fetch feedback history and stats
  const fetchFeedback = async () => {
    setIsLoadingHistory(true)
    setErrorMsg('')
    try {
      const { data } = await api.get('/feedback')
      if (data) {
        setFeedbacks(data.feedbacks || [])
        setStats(data.stats || { average: 0, total: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } })
      }
    } catch (err) {
      console.error('Error fetching feedback:', err)
      setErrorMsg('Failed to load reviews. Please try again.')
    } finally {
      setIsLoadingHistory(false)
    }
  }

  // Load reviews when modal opens or when feedback:changed is received
  useEffect(() => {
    if (isOpen) {
      fetchFeedback()
      setActiveTab('rate')
      setRating(0)
      setComment('')
      setShowSuccess(false)
      setErrorMsg('')

      // Keyboard ESC handler
      const handleEsc = (e) => {
        if (e.key === 'Escape') onClose()
      }
      window.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'

      return () => {
        window.removeEventListener('keydown', handleEsc)
        document.body.style.overflow = 'unset'
      }
    }
  }, [isOpen])

  // Listen to real-time feedback changes via socket if available
  useEffect(() => {
    if (socket) {
      const handleFeedbackChange = () => {
        fetchFeedback()
      }
      socket.on('feedback:changed', handleFeedbackChange)
      return () => {
        socket.off('feedback:changed', handleFeedbackChange)
      }
    }
  }, [socket])

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (rating === 0) {
      setErrorMsg('Please select a rating before submitting.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg('')
    try {
      await api.post('/feedback', { rating, comment })
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setRating(0)
        setComment('')
        // Refresh feedback list and switch to reviews tab
        fetchFeedback()
        setActiveTab('reviews')
      }, 1500)
    } catch (err) {
      console.error('Error submitting feedback:', err)
      setErrorMsg(err.response?.data?.error || 'Failed to submit feedback. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate relative time / human date
  const formatTime = (dateStr) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now - d
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const getInitials = (fName, lName, email) => {
    if (fName && lName) return `${fName[0]}${lName[0]}`.toUpperCase()
    if (email) return email.slice(0, 2).toUpperCase()
    return 'U'
  }

  return createPortal(
    <div className="feedback-overlay" onClick={onClose}>
      <div 
        className="feedback-modal glass-modal-premium" 
        onClick={(e) => e.stopPropagation()}
        ref={modalRef}
      >
        {/* Modal Header */}
        <div className="feedback-header">
          <div className="feedback-header-title-area">
            <ChatCircleText className="feedback-icon-accent" size={24} weight="duotone" />
            <div>
              <h2>SIREN Feedback</h2>
              <p className="feedback-subtitle">Help us improve your system experience</p>
            </div>
          </div>
          <button className="feedback-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="feedback-tabs">
          <button 
            className={`feedback-tab ${activeTab === 'rate' ? 'active' : ''}`}
            onClick={() => { setActiveTab('rate'); setErrorMsg(''); }}
          >
            Rate & Comment
          </button>
          <button 
            className={`feedback-tab ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reviews'); setErrorMsg(''); }}
          >
            Review History ({stats.total})
          </button>
        </div>

        {/* Modal Content */}
        <div className="feedback-body">
          {errorMsg && <div className="feedback-error-banner">{errorMsg}</div>}

          {activeTab === 'rate' ? (
            <div className="feedback-form-view">
              {showSuccess ? (
                <div className="feedback-success-state">
                  <div className="success-checkmark-bounce">
                    <CheckCircle size={64} weight="fill" color="var(--success-color, #10b981)" />
                  </div>
                  <h3>Thank You!</h3>
                  <p>Your feedback has been submitted successfully.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="feedback-form">
                  <div className="rating-prompt-section">
                    <span className="rating-prompt-title">How was your experience today?</span>
                    <div className="star-rating-container">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`star-btn ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star 
                            size={42} 
                            weight={star <= (hoverRating || rating) ? "fill" : "regular"} 
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <span className="rating-verbal-feedback">
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent!'}
                      </span>
                    )}
                  </div>

                  <div className="comment-input-section">
                    <label htmlFor="feedback-comment">Tell us more details (optional)</label>
                    <textarea
                      id="feedback-comment"
                      rows="4"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="What do you like? What can be improved? Write your remarks..."
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="feedback-submit-btn premium-glow-btn"
                    disabled={rating === 0 || isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="mini-spinner"></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <div className="feedback-history-view">
              {isLoadingHistory ? (
                <div className="feedback-loading-state">
                  <span className="feedback-spinner"></span>
                  <p>Loading reviews...</p>
                </div>
              ) : (
                <>
                  {/* Rating Dashboard Stats */}
                  <div className="feedback-stats-card">
                    <div className="stats-score-left">
                      <span className="big-score">{stats.average}</span>
                      <div className="score-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={16}
                            weight={s <= Math.round(stats.average) ? 'fill' : 'regular'}
                            color="#fbbf24"
                          />
                        ))}
                      </div>
                      <span className="stats-reviews-count">{stats.total} {stats.total === 1 ? 'review' : 'reviews'}</span>
                    </div>

                    {/* Progress Breakdown Bars */}
                    <div className="stats-breakdown-right">
                      {[5, 4, 3, 2, 1].map((s) => {
                        const count = stats.breakdown[s] || 0;
                        const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                        return (
                          <div key={s} className="breakdown-row">
                            <span className="breakdown-star-num">{s}</span>
                            <div className="breakdown-bar-bg">
                              <div 
                                className="breakdown-bar-fill" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="breakdown-count">{count}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* List of Feedback */}
                  <div className="feedback-list-container">
                    {feedbacks.length === 0 ? (
                      <div className="empty-reviews-state">
                        <User size={36} weight="duotone" />
                        <p>No feedback submitted yet. Be the first to share your thoughts!</p>
                      </div>
                    ) : (
                      feedbacks.map((f) => (
                        <div key={f.id} className="review-item">
                          <div className="review-item-header">
                            <div className="review-user-avatar">
                              {getInitials(f.first_name, f.last_name, f.email)}
                            </div>
                            <div className="review-user-info">
                              <span className="review-user-name">
                                {f.first_name && f.last_name 
                                  ? `${f.first_name} ${f.last_name}` 
                                  : f.email || 'Anonymous'}
                              </span>
                              <span className="review-user-role">
                                {f.role || 'Viewer'}
                              </span>
                            </div>
                            <span className="review-time">{formatTime(f.created_at)}</span>
                          </div>
                          
                          <div className="review-stars">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={12}
                                weight={s <= f.rating ? 'fill' : 'regular'}
                                color="#fbbf24"
                              />
                            ))}
                          </div>

                          {f.comment && (
                            <p className="review-comment-text">{f.comment}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
