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
          <h3>🏆 Gamification</h3>
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
                      {isCurrent ? '★' : isUnlocked ? '✓' : b.points}
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
