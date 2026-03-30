import React from 'react';
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
