import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import './Profile.css';

const BADGES = [
  { name: 'Newbie', points: 0 },
  { name: 'Explorer', points: 20 },
  { name: 'Achiever', points: 40 },
  { name: 'Specialist', points: 60 },
  { name: 'Expert', points: 80 },
  { name: 'Master', points: 120 }
];

const Profile = () => {
  const { user } = useAuth();

  if (!user) return null;

  const points = user.totalPoints || 0;
  const badge = user.badgeLevel || 'Newbie';

  return (
    <div className="profile-page">
      <Navbar />
      <div className="profile-container">
        <div className="profile-card animate-fade-in-up">
          <div className="profile-avatar-large">
            {user.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              user.name?.charAt(0).toUpperCase()
            )}
          </div>
          <div className="profile-name">{user.name}</div>
          <div className="profile-email">{user.email}</div>
          <span className="profile-role">{user.role}</span>
        </div>

        <div className="profile-gamification animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <h3>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '20px', height: '20px', display: 'inline-block', verticalAlign: 'middle', marginRight: '8px' }}>
              <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
              <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
              <path d="M4 22h16"/>
              <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
              <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
              <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
            </svg>
            Gamification
          </h3>
          <div className="gamification-stats">
            <div className="gamification-stat">
              <div className="g-value">{points}</div>
              <div className="g-label">Total Points</div>
            </div>
            <div className="gamification-stat">
              <div className="g-value">{badge}</div>
              <div className="g-label">Current Badge</div>
            </div>
          </div>

          <div className="badge-progress">
            <h4>Badge Progression</h4>
            <div className="badge-track">
              {BADGES.map((b, i) => {
                const isCurrent = badge === b.name;
                const isUnlocked = points >= b.points;
                return (
                  <div
                    key={i}
                    className={`badge-node ${isCurrent ? 'current' : isUnlocked ? 'unlocked' : ''}`}
                  >
                    <div className="badge-dot">
                      {isCurrent ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"/>
                        </svg>
                      ) : isUnlocked ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                          <polyline points="22 4 12 14.01 9 11.01"/>
                        </svg>
                      ) : (
                        <span className="badge-points">{b.points}</span>
                      )}
                    </div>
                    <span className="badge-label">{b.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
