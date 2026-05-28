import React, { useState, useEffect } from 'react';
import './index.css';
import { apiFetch } from './api';

import DiceRoller from './games/DiceRoller';
import TicTacToe from './games/TicTacToe';
import Hangman from './games/Hangman';
import MemoryMatch from './games/MemoryMatch';
import HeadOrTail from './games/HeadOrTail';
import F1Reaction from './games/F1Reaction';

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
    // Transition to the next screen after 2.5 seconds
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
const Gateway = ({ onAuthSuccess, onGuest }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [authError, setAuthError] = useState('');
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordStatus, setForgotPasswordStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLogin) {
        const { token } = await apiFetch('/users/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('jwt_token', token);
      } else {
        await apiFetch('/users/register', {
          method: 'POST',
          body: JSON.stringify({ username, email, password })
        });
        // Auto login after register
        const { token } = await apiFetch('/users/login', {
          method: 'POST',
          body: JSON.stringify({ email, password })
        });
        localStorage.setItem('jwt_token', token);
      }

      // Fetch user profile after getting token
      const profile = await apiFetch('/users/me');
      onAuthSuccess(profile);

    } catch (error) {
      setAuthError(error.message);
    }
  };

  return (
    <div className="gateway-container">
      <div className="modal-content" style={{ animation: 'none' }}>
        <h2>{isLogin ? 'Welcome Back' : 'Join NotAMinigame'}</h2>

        {authError && <div className="auth-error" style={{ color: '#ff3366', background: 'rgba(255,51,102,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '15px', textAlign: 'center', fontSize: '0.9rem', border: '1px solid #ff3366' }}>{authError}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>Username</label>
              <input type="text" placeholder="Enter your username" required value={username} onChange={e => setUsername(e.target.value)} />
            </div>
          )}
          <div className="input-group">
            <label>Email</label>
            <input type="email" placeholder="Enter your email" required value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div className="input-group password-group">
            <label>Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
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

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowForgotPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowForgotPasswordModal(false)}>✕</button>
            <h2>Reset Password</h2>
            <p className="tagline" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Enter your email to receive a password reset link.
            </p>

            <form className="auth-form" onSubmit={async (e) => {
              e.preventDefault();
              setForgotPasswordStatus('Gönderiliyor...');
              try {
                const res = await apiFetch('/users/forgot-password', {
                  method: 'POST',
                  body: JSON.stringify({ email: forgotPasswordEmail })
                });
                setForgotPasswordStatus(res.message || "Şifre sıfırlama e-postası e-posta adresinize gönderildi!");
              } catch (err) {
                setForgotPasswordStatus("Hata: " + err.message);
              }
            }}>
              {forgotPasswordStatus && <div style={{ color: '#bc13fe', marginBottom: '10px', fontSize: '0.9rem' }}>{forgotPasswordStatus}</div>}
              <div className="input-group">
                <label>Email</label>
                <input type="email" placeholder="Enter your email" required value={forgotPasswordEmail} onChange={e => setForgotPasswordEmail(e.target.value)} />
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
const ProfileScreen = ({ user, onUserUpdate, onBack }) => {
  const [avatarColor, setAvatarColor] = useState(user?.pphex || '#bc13fe');
  const [bannerColor1, setBannerColor1] = useState(user?.bannerhex_1 || '#bc13fe');
  const [bannerColor2, setBannerColor2] = useState(user?.bannerhex_2 || '#00f0ff');

  const handleBack = async () => {
    if (user && user.id) {
      try {
        const updatedProfile = await apiFetch(`/users/${user.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            pphex: avatarColor,
            bannerhex_1: bannerColor1,
            bannerhex_2: bannerColor2
          })
        });
        onUserUpdate(updatedProfile);
      } catch (e) {
        console.error("Failed to save colors", e);
      }
    }
    onBack();
  };

  return (
    <div className="profile-container">
      <button className="back-btn" onClick={handleBack}>←</button>
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
        <h3 className="profile-username">{user?.username || 'Guest'}</h3>
        <div className="profile-scores-container" style={{ marginTop: '1rem', width: '100%', padding: '0 2rem', boxSizing: 'border-box' }}>
          <div className="profile-score" style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            <span>Hangman:</span> <span style={{ color: 'var(--secondary-neon)' }}>{user?.hangmanScore || 0}</span>
          </div>
          <div className="profile-score" style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            <span>Memory Match (Countdown):</span> <span style={{ color: 'var(--primary-neon)' }}>{user?.memoryMatchCountdownScore || 0}</span>
          </div>
          <div className="profile-score" style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            <span>Memory Match (Time Challenge):</span> <span style={{ color: 'var(--primary-neon)' }}>{user?.memoryMatchTimeChallengeScore || 0}</span>
          </div>
          <div className="profile-score" style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            <span>Tic-Tac-Toe:</span> <span style={{ color: '#00f0ff' }}>{user?.tictactoeScore || 0}</span>
          </div>
          <div className="profile-score" style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
            <span>Head or Tail:</span> <span style={{ color: 'var(--accent-neon)' }}>{user?.headOrTailScore || 0}</span>
          </div>
          <div className="profile-score" style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0' }}>
            <span>F1 Start Reaction:</span> <span style={{ color: '#ff3366' }}>{user?.f1ReactionScore || 0} pts</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- View 3: Main Menu Component ---
const MainMenu = ({ user, onProfile, onLogout, onPlay }) => {
  const [showSdmMsg, setShowSdmMsg] = useState(false);

  const games = [
    {
      id: 1,
      icon: '🎲',
      title: 'Dice Roller',
      desc: 'Roll the dice and test your luck for points!',
      view: 'diceroller'
    },
    {
      id: 2,
      icon: '❌⭕',
      title: 'Tic Tac Toe',
      desc: 'The classic X and O game. Play with a friend locally.',
      view: 'tictactoe'
    },
    {
      id: 3,
      icon: '🪓',
      title: 'Hangman',
      desc: 'Guess the word before the man hangs.',
      view: 'hangman'
    },
    {
      id: 4,
      icon: '🧠',
      title: 'Memory Match',
      desc: 'Test your brain and find the matching pairs.',
      view: 'memorymatch'
    },
    {
      id: 5,
      icon: '🪙',
      title: 'Head or Tail',
      desc: 'Flip the neon coin and guess the outcome!',
      view: 'headortail'
    },
    {
      id: 6,
      icon: '🏎️',
      title: 'F1 Start Reaction',
      desc: 'Test your reflexes on the F1 grid against pilot times!',
      view: 'f1reaction'
    }
  ];

  const handlePlayGame = (viewName) => {
    onPlay(viewName);
  };

  return (
    <div className="app-container">
      <div className="header-actions">
        {user ? (
          <>
            <button className="auth-btn" onClick={onLogout} style={{ marginRight: '10px' }}>Logout</button>
            <button className="profile-btn" onClick={onProfile}>👤 Profile</button>
          </>
        ) : (
          <button className="auth-btn" onClick={onLogout}>Login / Register</button>
        )}
      </div>
      <header className="header">
        <h1 className="logo-text">NotAMinigame</h1>
        <p className="tagline">Welcome, {user ? user.username : 'Guest'}! Select a mini-game to begin</p>
      </header>

      <main className="main-menu">
        <div className="games-grid">
          {games.map((game) => (
            <GameCard
              key={game.id}
              icon={game.icon}
              title={game.title}
              desc={game.desc}
              onPlay={() => handlePlayGame(game.view)}
            />
          ))}
        </div>
      </main>

      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', paddingLeft: '2rem', position: 'relative' }}>
        <img
          src="/resources/images/sdm.png"
          alt="SDM"
          width="144"
          height="24"
          style={{ cursor: 'pointer' }}
          onClick={() => setShowSdmMsg(!showSdmMsg)}
        />
        {showSdmMsg && (
          <div style={{
            position: 'absolute',
            bottom: '35px',
            left: '2rem',
            background: '#bc13fe',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '12px',
            fontSize: '0.9rem',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.5)',
            zIndex: 10,
            whiteSpace: 'nowrap'
          }}>
            congratulations you found me
            <div style={{
              position: 'absolute',
              bottom: '-8px',
              left: '20px',
              borderWidth: '8px 8px 0',
              borderStyle: 'solid',
              borderColor: '#bc13fe transparent transparent transparent'
            }} />
          </div>
        )}
      </div>

      <footer className="footer">
        <p>Built by: Aki and Onur. <span className="footer-highlight">No rights reserved.</span></p>
      </footer>
    </div>
  );
};

// --- Main App Controller ---
function App() {
  const [view, setView] = useState('splash');
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('jwt_token');
      if (token) {
        try {
          const profile = await apiFetch('/users/me');
          setUser(profile);
        } catch (e) {
          localStorage.removeItem('jwt_token');
        }
      }
      setIsInitializing(false);
    };
    initAuth();
  }, []);

  const handleAuthSuccess = (profile) => {
    setUser(profile);
    setView('menu');
  };

  const handleLogout = () => {
    localStorage.removeItem('jwt_token');
    setUser(null);
    setView('gateway');
  };

  if (isInitializing) {
    return <SplashScreen onComplete={() => { }} />; // Keep splash visible while init
  }

  return (
    <>
      {view === 'splash' && <SplashScreen onComplete={() => setView(user ? 'menu' : 'gateway')} />}
      {view === 'gateway' && <Gateway onAuthSuccess={handleAuthSuccess} onGuest={() => setView('menu')} />}
      {view === 'menu' && <MainMenu user={user} onProfile={async () => {
        const token = localStorage.getItem('jwt_token');
        if (token) {
          try {
            const profile = await apiFetch('/users/me');
            setUser(profile);
          } catch (e) {
            console.error("Failed to refresh profile details", e);
          }
        }
        setView('profile');
      }} onLogout={handleLogout} onPlay={setView} />}
      {view === 'profile' && <ProfileScreen user={user} onUserUpdate={setUser} onBack={() => setView('menu')} />}

      {/* Games */}
      {view === 'diceroller' && <DiceRoller onBack={() => setView('menu')} />}
      {view === 'tictactoe' && <TicTacToe onBack={() => setView('menu')} />}
      {view === 'hangman' && <Hangman onBack={() => setView('menu')} />}
      {view === 'memorymatch' && <MemoryMatch onBack={() => setView('menu')} />}
      {view === 'headortail' && <HeadOrTail onBack={() => setView('menu')} />}
      {view === 'f1reaction' && <F1Reaction onBack={() => setView('menu')} />}
    </>
  );
}

export default App;
