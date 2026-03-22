import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useRazorpay } from '../../hooks/useRazorpay';
import Navbar from '../../components/common/Navbar';
import Toast from '../../components/common/Toast';
import './CourseDetail.css';

const CourseDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { initiatePayment, loading: paymentLoading } = useRazorpay();
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [toast, setToast] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, reviewText: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [courseRes, reviewsRes] = await Promise.all([
          api.get(`/courses/${id}`),
          api.get(`/reviews/course/${id}`)
        ]);
        setCourse(courseRes.data);
        setReviews(Array.isArray(reviewsRes.data) ? reviewsRes.data : []);

        // Fetch lessons if user is logged in
        if (user) {
          try {
            const lessonsRes = await api.get(`/lessons/course/${id}`);
            setLessons(Array.isArray(lessonsRes.data) ? lessonsRes.data : []);
          } catch { /* not enrolled or no access */ }

          // Check enrollment
          try {
            const enrollRes = await api.get('/enrollments/me');
            const myEnrollments = Array.isArray(enrollRes.data) ? enrollRes.data : [];
            setEnrolled(myEnrollments.some(e => e.course?._id === id));
          } catch { /* ignore */ }
        }
      } catch (err) {
        setToast({ message: 'Failed to load course details', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, user]);

  const handleEnroll = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Check if course requires payment
    const requiresPayment = course.accessRule === 'payment' && course.price > 0;

    if (requiresPayment) {
      // Use Razorpay payment flow
      setEnrolling(true);
      initiatePayment(
        id,
        course.title,
        { name: user.name, email: user.email },
        async (result) => {
          // Success callback
          setEnrolling(false);
          if (result.enrolled) {
            setEnrolled(true);
            setToast({ message: result.message || 'Successfully enrolled!', type: 'success' });
            // Fetch lessons after enrolling
            try {
              const lessonsRes = await api.get(`/lessons/course/${id}`);
              setLessons(Array.isArray(lessonsRes.data) ? lessonsRes.data : []);
            } catch {}
          }
        },
        (errorMessage) => {
          // Error callback
          setEnrolling(false);
          if (errorMessage !== 'Payment cancelled') {
            setToast({ message: errorMessage, type: 'error' });
          }
        }
      );
    } else {
      // Free course - direct enrollment
      try {
        setEnrolling(true);
        await api.post(`/enrollments/${id}`);
        setEnrolled(true);
        setToast({ message: 'Successfully enrolled!', type: 'success' });
        // Fetch lessons after enrolling
        try {
          const lessonsRes = await api.get(`/lessons/course/${id}`);
          setLessons(Array.isArray(lessonsRes.data) ? lessonsRes.data : []);
        } catch {}
      } catch (err) {
        setToast({ message: err.response?.data?.message || 'Enrollment failed', type: 'error' });
      } finally {
        setEnrolling(false);
      }
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (reviewForm.reviewText.trim().length < 10) {
      setToast({ message: 'Review must be at least 10 characters', type: 'error' });
      return;
    }
    try {
      setSubmittingReview(true);
      const res = await api.post(`/reviews/course/${id}`, reviewForm);
      setReviews(prev => {
        const existing = prev.findIndex(r => r.learner?._id === user._id);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = res.data;
          return updated;
        }
        return [res.data, ...prev];
      });
      setReviewForm({ rating: 5, reviewText: '' });
      setToast({ message: 'Review submitted! ✨', type: 'success' });
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to submit review', type: 'error' });
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="course-detail">
        <Navbar />
        <div className="loading-container"><div className="spinner" /></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail">
        <Navbar />
        <div className="container" style={{ paddingTop: '120px', textAlign: 'center' }}>
          <h2>Course not found</h2>
        </div>
      </div>
    );
  }

  const instructor = course.createdBy || course.responsible;
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="course-detail">
      <Navbar />

      {/* Hero */}
      <div className="course-detail-hero">
        <div className="container">
          <div className="course-hero-info">
            {course.tags?.length > 0 && (
              <div className="course-hero-tags">
                {course.tags.map((t, i) => <span className="tag" key={i}>{t}</span>)}
              </div>
            )}
            <h1>{course.title}</h1>
            <p className="course-desc">{course.description}</p>
            <div className="course-hero-meta">
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
                </svg>
                {lessons.length || course.lessonsCount || 0} Lessons
              </span>
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                {course.totalDurationMins || 0} min
              </span>
              {avgRating && (
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                  </svg>
                  {avgRating} ({reviews.length} reviews)
                </span>
              )}
              {instructor && (
                <span>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  {instructor.name}
                </span>
              )}
              <span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '16px', height: '16px', display: 'inline-block', verticalAlign: 'middle', marginRight: '6px' }}>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                {course.viewsCount || 0} views
              </span>
            </div>
            <div className="course-hero-actions">
              {enrolled ? (
                <button className="btn btn-primary btn-lg" onClick={() => navigate(`/learn/${id}`)}>
                  Continue Learning
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={handleEnroll}
                    disabled={enrolling || paymentLoading}
                  >
                    {enrolling || paymentLoading
                      ? 'Processing...'
                      : course.accessRule === 'payment' && course.price > 0
                        ? `Buy Now - ${course.currency === 'INR' ? '₹' : course.currency}${course.price}`
                        : 'Enroll Now - Free'}
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="course-hero-cover">
            {course.coverImage && <img src={course.coverImage} alt={course.title} />}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="course-detail-content">
        <div className="container">
          <div className="course-main">
            {/* Syllabus */}
            <div className="detail-section">
              <h2>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                  <rect width="8" height="4" x="8" y="2" rx="1" ry="1"/>
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
                  <path d="M12 11h4"/>
                  <path d="M12 16h4"/>
                  <path d="M8 11h.01"/>
                  <path d="M8 16h.01"/>
                </svg>
                Syllabus
              </h2>
              {lessons.length > 0 ? (
                <ul className="syllabus-list">
                  {lessons.map((lesson, i) => (
                    <li key={lesson._id} className="syllabus-item">
                      <span className="lesson-number">{i + 1}</span>
                      <div className="lesson-info">
                        <div className="lesson-title">{lesson.title}</div>
                        <div className="lesson-meta">
                          {lesson.type} {lesson.durationMins ? `• ${lesson.durationMins} min` : ''}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text)', fontSize: '0.9rem' }}>
                  {enrolled ? 'No lessons yet.' : 'Enroll to see the full syllabus.'}
                </p>
              )}
            </div>

            {/* Reviews */}
            <div className="detail-section">
              <h2>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                </svg>
                Reviews {reviews.length > 0 && `(${reviews.length})`}
              </h2>
              {reviews.length > 0 ? (
                <div className="reviews-list">
                  {reviews.map(review => (
                    <div key={review._id} className="review-item">
                      <div className="review-header">
                        <div className="review-avatar">
                          {review.learner?.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <div className="review-name">{review.learner?.name || 'Anonymous'}</div>
                          <div className="review-rating">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
                        </div>
                      </div>
                      <p className="review-text">{review.reviewText}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--text)', fontSize: '0.9rem' }}>No reviews yet.</p>
              )}

              {/* Review form */}
              {enrolled && user?.role === 'learner' && (
                <form className="review-form" onSubmit={handleReviewSubmit}>
                  <div className="star-selector">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm(p => ({ ...p, rating: star }))}
                      >
                        {star <= reviewForm.rating ? '★' : '☆'}
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="form-input"
                    placeholder="Write your review (min 10 characters)..."
                    value={reviewForm.reviewText}
                    onChange={e => setReviewForm(p => ({ ...p, reviewText: e.target.value }))}
                    rows={3}
                  />
                  <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Aside */}
          <div className="course-aside">
            {/* Instructor card */}
            {instructor && (
              <div className="detail-section">
                <h2>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Instructor
                </h2>
                <div className="instructor-card">
                  <div className="instructor-avatar">
                    {instructor.avatar
                      ? <img src={instructor.avatar} alt={instructor.name} />
                      : instructor.name?.charAt(0)
                    }
                  </div>
                  <div className="instructor-info">
                    <div className="instructor-name">{instructor.name}</div>
                    {instructor.email && <div className="instructor-email">{instructor.email}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Course info */}
            <div className="detail-section">
              <h2>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4"/>
                  <path d="M12 8h.01"/>
                </svg>
                Course Info
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text)' }}>Access</span>
                  <span style={{ color: 'var(--text-h)', fontWeight: 600, textTransform: 'capitalize' }}>{course.accessRule || 'Open'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text)' }}>Visibility</span>
                  <span style={{ color: 'var(--text-h)', fontWeight: 600, textTransform: 'capitalize' }}>{course.visibility || 'Everyone'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text)' }}>Price</span>
                  <span style={{ color: 'var(--text-h)', fontWeight: 600 }}>
                    {course.accessRule !== 'payment' || !course.price || course.price === 0 ? 'Free' : `₹${course.price}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default CourseDetail;
