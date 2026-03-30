import React, { useState } from 'react';
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

function App() {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

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
      {/* Top Right Auth Button */}
      <div className="auth-btn-container">
        <button className="auth-btn" onClick={() => setShowAuthModal(true)}>
          Login / Register
        </button>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowAuthModal(false)}>✕</button>
            <h2>{isLogin ? 'Welcome Back' : 'Join NotAMinigame'}</h2>
            
            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); alert("Auth logic will be connected later!"); }}>
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
            
            <p className="auth-switch">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span onClick={() => setIsLogin(!isLogin)}>
                {isLogin ? 'Register' : 'Login'}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowForgotPasswordModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowForgotPasswordModal(false)}>✕</button>
            <h2>Reset Password</h2>
            <p className="tagline" style={{ textAlign: 'center', marginBottom: '1.5rem', fontSize: '1rem' }}>
              Enter your email to receive a password reset link.
            </p>
            
            <form className="auth-form" onSubmit={(e) => { e.preventDefault(); alert("Geçici simülasyon: Şifre sıfırlama linki e-postanıza gönderildi!"); setShowForgotPasswordModal(false); }}>
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

      {/* Header */}
      <header className="header">
        <h1 className="logo-text">NotAMinigame</h1>
        <p className="tagline">Select a mini-game to begin</p>
      </header>

      {/* Main Content */}
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

      {/* Footer */}
      <footer className="footer">
        <p>Built: Aki and Onur. <span className="footer-highlight">Ready for action.</span></p>
      </footer>
    </div>
  );
}

export default App;
