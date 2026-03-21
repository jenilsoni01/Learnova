import { useNavigate } from 'react-router-dom';
import './CourseCard.css';

const CourseCard = ({ course, progress, showProgress = false }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/courses/${course._id}`);
  };

  const isFree = !course.price || course.price === 0;
  const coverImg = course.coverImage || '';

  return (
    <div className="course-card" onClick={handleClick}>
      <div
        className="card-banner"
        style={coverImg ? { backgroundImage: `url(${coverImg})` } : {}}
      >
        <div className="card-banner-overlay" />
        <span className={`card-price-badge ${isFree ? 'free' : 'paid'}`}>
          {isFree ? 'Free' : `₹${course.price}`}
        </span>
      </div>

      <div className="card-body">
        {course.tags?.length > 0 && (
          <div className="card-tags">
            {course.tags.slice(0, 3).map((tag, i) => (
              <span className="tag" key={i}>{tag}</span>
            ))}
          </div>
        )}

        <h4 className="card-title">{course.title}</h4>
        <p className="card-description">{course.description}</p>

        <div className="card-meta">
          <span className="card-meta-item">
            📚 {course.lessonsCount || 0} Lessons
          </span>
          {course.accessRule && (
            <span className="card-meta-item" style={{ textTransform: 'capitalize' }}>
              🔓 {course.accessRule}
            </span>
          )}
        </div>

        {showProgress && progress !== undefined && (
          <div className="card-progress">
            <div className="card-progress-bar">
              <div 
                className="card-progress-fill" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            <span className="card-progress-text">{progress}% complete</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
