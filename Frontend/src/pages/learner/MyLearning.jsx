import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import useInfiniteScroll from '../../hooks/useInfiniteScroll';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EndMessage from '../../components/common/EndMessage';
import './MyLearning.css';

const MyLearning = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchEnrollments = useCallback(async (page) => {
    const params = { page, limit: 10 };
    const { data } = await api.get('/enrollments/me', { params });
    return data; // { data: [...], pagination: {...} }
  }, []);

  const { items: enrollments, isLoading, hasMore, sentinelRef } =
    useInfiniteScroll(fetchEnrollments, []);

  // Show spinner only on very first load
  const showInitialLoading = isLoading && enrollments.length === 0;

  return (
    <div className="my-learning">
      <Navbar />

      <div className="container">
        <div className="my-learning-header">
          <h1 className="gradient-text">My Learning</h1>
          <p>Track your progress and continue where you left off.</p>
        </div>

        {showInitialLoading ? (
          <div className="loading-container"><div className="spinner" /></div>
        ) : enrollments.length === 0 && !isLoading ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>You haven't enrolled in any courses yet</h3>
            <p>Browse courses and start learning today!</p>
            <button className="btn btn-primary" onClick={() => navigate('/dashboard')} style={{ marginTop: '1rem' }}>
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="kanban-board">
            {[
              { id: 'yet_to_start', title: 'Yet to Start', label: 'Yet to Start', filter: 'yet_to_start', icon: '📝' },
              { id: 'in_progress', title: 'In Progress', label: 'In Progress', filter: 'in_progress', icon: '⏳' },
              { id: 'completed', title: 'Completed', label: 'Completed', filter: 'completed', icon: '✅' }
            ].map(col => {
              const colEnrollments = enrollments.filter(e => e.status === col.filter);
              return (
                <div key={col.id} className="kanban-column">
                  <div className={`kanban-header ${col.id}`}>
                    <div className="kanban-title">
                      <span className="kanban-icon">{col.icon}</span>
                      <h3>{col.title}</h3>
                    </div>
                    <span className="kanban-count">{colEnrollments.length}</span>
                  </div>
                  
                  <div className="kanban-cards">
                    {colEnrollments.length === 0 ? (
                      <div className="kanban-empty">No courses in this state</div>
                    ) : (
                      colEnrollments.map((enrollment, i) => (
                        <div
                          key={enrollment._id}
                          className="enrollment-card animate-fade-in-up"
                          style={{ animationDelay: `${i * 0.08}s` }}
                          onClick={() => navigate(`/learn/${enrollment.course?._id}`)}
                        >
                          <div
                            className="enroll-banner"
                            style={enrollment.course?.coverImage ? { backgroundImage: `url(${enrollment.course.coverImage})` } : {}}
                          >
                            <span className={`enroll-status ${enrollment.status}`}>
                              {col.label}
                            </span>
                          </div>
                          <div className="enroll-body">
                            <h4 className="enroll-title">{enrollment.course?.title || 'Untitled Course'}</h4>
                            <p className="enroll-desc">{enrollment.course?.description || ''}</p>
                            <div className="enroll-progress">
                              <div className="enroll-progress-bar">
                                <div className="enroll-progress-fill" style={{ width: `${enrollment.completionPct || 0}%` }} />
                              </div>
                              <div className="enroll-progress-text">
                                <span>{enrollment.completionPct || 0}% complete</span>
                                <span>{enrollment.status === 'completed' ? '✅' : '📖'}</span>
                              </div>
                            </div>
                            <button className="btn btn-primary enroll-action btn-sm">
                              {enrollment.status === 'completed' ? 'Review Course' : enrollment.status === 'in_progress' ? 'Continue Learning' : 'Start Learning'}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sentinel + infinite scroll states */}
        <div ref={sentinelRef} style={{ height: '1rem' }} />
        {isLoading && enrollments.length > 0 && <LoadingSpinner />}
        {!hasMore && enrollments.length > 0 && <EndMessage message="All courses loaded" />}
      </div>
    </div>
  );
};

export default MyLearning;
