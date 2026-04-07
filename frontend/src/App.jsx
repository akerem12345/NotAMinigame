import React, { useState, useEffect } from 'react';
import './index.css';

const GameCard = ({ icon, title, desc, onPlay }) => {
  return (
    <div className="game-card" onClick={onPlay}>
      <div className="game-icon">{icon}</div>
      <h3 className="game-title">{title}</h3>
      <p className="game-desc">{desc}</p>
      <button className="play-btn">Play Now</button>
    </div>
  );
};

// --- View 1: Splash Screen Component ---
const SplashScreen = ({ onComplete }) => {
  useEffect(() => {
    // Transition to the gateway after 2.5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="splash-screen">
      <img src="/favicon.svg" alt="Lightning Bolt Logo" className="splash-logo" />
      <h1 className="splash-title">NotAMinigame</h1>
    </div>
  );
};

// --- View 2: Gateway / Auth Screen Component ---
const Gateway = ({ onLogin, onGuest }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  return (
    <div className="gateway-container">
      <div className="modal-content" style={{ animation: 'none' }}>
        <h2>{isLogin ? 'Welcome Back' : 'Join NotAMinigame'}</h2>
        
        <form className="auth-form" onSubmit={(e) => { 
            e.preventDefault(); 
            // Mock authentication success
            onLogin(); 
        }}>
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="Enter your email" required />
          </div>
          <div className="input-group password-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter your password" 
                required
              />
              <button 
                type="button" 
                className="eye-btn" 
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {isLogin && (
              <div className="forgot-password">
                <span onClick={() => setShowForgotPasswordModal(true)}>Forgot password?</span>
              </div>
            )}
          </div>
          <button className="submit-btn" type="submit">
            {isLogin ? 'Login' : 'Register'}
          </button>
        </form>
        
        <div className="gateway-guest-divider">OR</div>
        
        <button className="guest-btn" onClick={onGuest}>
          Play as a Guest
        </button>

        <p className="auth-switch">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register' : 'Login'}
          </span>
        </p>
      </div>

      {/* Forgot Password Modal (Still pop-up inside Gateway) */}
      {showForgotPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowForgotPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowForgotPasswordModal(false)}>✕</button>
            <h2>Reset Password</h2>
            <p className="tagline" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Enter your email to receive a password reset link.
            </p>
            
            <form className="auth-form" onSubmit={(e) => { 
                e.preventDefault(); 
                alert("Şifre sıfırlama e-postası gönderildi (Simülasyon)!"); 
                setShowForgotPasswordModal(false); 
            }}>
              <div className="input-group">
                <label>Email</label>
                <input type="email" placeholder="Enter your email" required />
              </div>
              <button className="submit-btn" type="submit" style={{ marginTop: '1rem' }}>
                Send Reset Link
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- View 4: Profile Screen Component ---
const ProfileScreen = ({ onBack }) => {
  const [avatarColor, setAvatarColor] = useState('#bc13fe');
  const [bannerColor1, setBannerColor1] = useState('#bc13fe');
  const [bannerColor2, setBannerColor2] = useState('#00f0ff');
  const colorInputRef = React.useRef(null);

  return (
    <div className="profile-container">
      <button className="back-btn" onClick={onBack}>←</button>
      <div className="profile-card">
        <div 
          className="profile-banner"
          style={{ background: `linear-gradient(135deg, ${bannerColor1}, ${bannerColor2})` }}
        >
          <div className="banner-color-picker">
            <span className="banner-color-label">Color 1</span>
            <div className="banner-color-btn" style={{ backgroundColor: bannerColor1 }} title="Choose Banner Color 1">
              <input 
                type="color" 
                value={bannerColor1} 
                onChange={(e) => setBannerColor1(e.target.value)} 
              />
            </div>
          </div>
          <div className="banner-color-picker">
            <div className="banner-color-btn" style={{ backgroundColor: bannerColor2 }} title="Choose Banner Color 2">
              <input 
                type="color" 
                value={bannerColor2} 
                onChange={(e) => setBannerColor2(e.target.value)} 
              />
            </div>
            <span className="banner-color-label">Color 2</span>
          </div>
        </div>
        <div 
          className="profile-avatar" 
          style={{ 
            backgroundColor: avatarColor, 
            boxShadow: `0 0 20px ${avatarColor}80`,
            position: 'relative',
            overflow: 'hidden'
          }}
          title="Change Avatar Color"
        >
          <input 
            type="color"
            value={avatarColor}
            onChange={(e) => setAvatarColor(e.target.value)}
            style={{ 
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              border: 'none',
              padding: 0
            }}
          />
        </div>
        <h3 className="profile-username">PlayerOne</h3>
        <div className="profile-score">Score: <span style={{ opacity: 0.5 }}>null</span></div>
      </div>
    </div>
  );
};

// --- View 3: Main Menu Component ---
const MainMenu = ({ onProfile }) => {
  const games = [
    {
      id: 1,
      icon: '❌⭕',
      title: 'Tic Tac Toe',
      desc: 'The classic X and O game. Can you beat the AI?',
    },
    {
      id: 2,
      icon: '🧠',
      title: 'Memory Match',
      desc: 'Test your brain and find the matching pairs.',
    },
    {
      id: 3,
      icon: '🐍',
      title: 'Retro Snake',
      desc: 'Eat, grow, and avoid the walls in this arcade classic.',
    },
    {
      id: 4,
      icon: '👾',
      title: 'Space Invaders',
      desc: 'Defend earth from the invading alien horde.',
    }
  ];

  const handlePlayGame = (title) => {
    alert(`Starting game: ${title}\n(Game windows will be connected later!)`);
  };

  return (
    <div className="app-container">
      <div className="header-actions">
        <button className="profile-btn" onClick={onProfile}>👤 Profile</button>
      </div>
      <header className="header">
        <h1 className="logo-text">NotAMinigame</h1>
        <p className="tagline">Select a mini-game to begin</p>
      </header>

      <main className="main-menu">
        <div className="games-grid">
          {games.map((game) => (
            <GameCard
              key={game.id}
              icon={game.icon}
              title={game.title}
              desc={game.desc}
              onPlay={() => handlePlayGame(game.title)}
            />
          ))}
        </div>
      </main>

      <footer className="footer">
        <p>Built: Aki and Onur. <span className="footer-highlight">Ready for action.</span></p>
      </footer>
    </div>
  );
};

// --- Main App Controller ---
function App() {
  // State handles application navigation: 'splash', 'gateway', 'menu', 'profile'
  const [view, setView] = useState('splash');

  return (
    <>
      {view === 'splash' && <SplashScreen onComplete={() => setView('gateway')} />}
      {view === 'gateway' && <Gateway onLogin={() => setView('menu')} onGuest={() => setView('menu')} />}
      {view === 'menu' && <MainMenu onProfile={() => setView('profile')} />}
      {view === 'profile' && <ProfileScreen onBack={() => setView('menu')} />}
    </>
  );
}

export default App;
