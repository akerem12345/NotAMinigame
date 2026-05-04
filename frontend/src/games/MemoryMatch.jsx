import React, { useState, useEffect } from 'react';
import { submitScore } from '../api';
import '../index.css';

const difficulties = {
  easy: { name: 'Easy', rows: 4, cols: 4, time: 60, multiplier: 1 },
  medium: { name: 'Medium', rows: 6, cols: 6, time: 120, multiplier: 2 },
  hard: { name: 'Hard', rows: 8, cols: 8, time: 180, multiplier: 3 },
};

const emojis = ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐜'];

const MemoryMatch = ({ onBack }) => {
  const [gameMode, setGameMode] = useState('countdown'); // 'countdown' | 'timeChallenge'
  const [diff, setDiff] = useState('easy');
  const [cards, setCards] = useState([]);
  const [flippedIndices, setFlippedIndices] = useState([]);
  const [matchedIndices, setMatchedIndices] = useState([]);
  const [time, setTime] = useState(0); 
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [winStatus, setWinStatus] = useState(null);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  const initGame = (selectedDiff, mode) => {
    const config = difficulties[selectedDiff];
    const pairsCount = (config.rows * config.cols) / 2;
    
    let selectedEmojis = [];
    let emojiPool = [...emojis].sort(() => 0.5 - Math.random());
    for(let i = 0; i < pairsCount; i++) {
        selectedEmojis.push(emojiPool[i]);
    }
    
    let deck = [...selectedEmojis, ...selectedEmojis]
        .sort(() => 0.5 - Math.random())
        .map((e, idx) => ({ id: idx, value: e }));
        
    setCards(deck);
    setFlippedIndices([]);
    setMatchedIndices([]);
    setTime(mode === 'countdown' ? config.time : 0);
    setIsPlaying(true);
    setGameOver(false);
    setWinStatus(null);
    setIsNewRecord(false);
    setFinalScore(0);
  };

  useEffect(() => {
    if (!isPlaying || gameOver) return;
    const timer = setInterval(() => {
      setTime(prev => {
        if (gameMode === 'countdown') {
          if (prev <= 1) {
            clearInterval(timer);
            handleGameOver(false, 0);
            return 0;
          }
          return prev - 1;
        } else {
          return prev + 1;
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, gameOver, gameMode]);

  const handleCardClick = (idx) => {
    if (!isPlaying || gameOver || flippedIndices.length >= 2 || flippedIndices.includes(idx) || matchedIndices.includes(idx)) {
      return;
    }

    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].value === cards[second].value) {
        const newMatched = [...matchedIndices, first, second];
        setMatchedIndices(newMatched);
        setFlippedIndices([]);
        
        if (newMatched.length === cards.length) {
          handleGameOver(true, time);
        }
      } else {
        setTimeout(() => setFlippedIndices([]), 400);
      }
    }
  };

  const handleGameOver = async (won, endingTime) => {
    setGameOver(true);
    setWinStatus(won);
    setIsPlaying(false);

    if (won) {
      const config = difficulties[diff];
      let score = 0;
      
      if (gameMode === 'countdown') {
         score = endingTime * config.multiplier;
      } else {
         score = Math.max(0, (1000 - endingTime) * config.multiplier);
      }
      
      setFinalScore(score);

      const pbKey = `memory_pb_${gameMode}_${diff}`;
      const prevBest = localStorage.getItem(pbKey);
      
      if (!prevBest || score > parseInt(prevBest)) {
         localStorage.setItem(pbKey, score.toString());
         setIsNewRecord(true);
      }

      try {
        await submitScore('MEMORY', score, { difficulty: config.name, gameMode, endingTime });
      } catch (e) {
        console.error("Score save failed", e);
      }
    }
  };

  return (
    <div className="game-container memory-container">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>Memory Match</h2>

      {!isPlaying && !gameOver ? (
        <div className="diff-selector">
          <h3>Select Game Mode</h3>
          <div style={{display:'flex', gap:'10px', justifyContent:'center', marginBottom:'1.5rem'}}>
             <button className={`action-btn ${gameMode === 'countdown' ? 'active-neon' : ''}`} onClick={() => setGameMode('countdown')}>Countdown</button>
             <button className={`action-btn ${gameMode === 'timeChallenge' ? 'active-neon' : ''}`} onClick={() => setGameMode('timeChallenge')}>Time Challenge</button>
          </div>
          
          <h3>Select Difficulty</h3>
          <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
             {Object.entries(difficulties).map(([k, v]) => (
                <button key={k} className="action-btn" onClick={() => { setDiff(k); initGame(k, gameMode); }}>
                  {v.name} ({v.rows}x{v.cols})
                </button>
             ))}
          </div>
        </div>
      ) : (
        <>
          <div className="memory-header">
            <span className="timer">
               {gameMode === 'countdown' ? `Time Left: ${time}s` : `Time Elapsed: ${time}s`}
            </span>
          </div>
          
          <div 
            className="memory-grid" 
            style={{ 
              gridTemplateColumns: `repeat(${difficulties[diff].cols}, 1fr)` 
            }}
          >
            {cards.map((card, idx) => {
              const isFlipped = flippedIndices.includes(idx) || matchedIndices.includes(idx);
              return (
                <div 
                  key={card.id} 
                  className={`memory-card ${isFlipped ? 'flipped' : ''}`}
                  onClick={() => handleCardClick(idx)}
                >
                  <div className="card-inner">
                    <div className="card-front">?</div>
                    <div className="card-back">{card.value}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {gameOver && (
            <div className="game-over-message">
              {winStatus ? (
                <>
                   <div className="win-text">You Won! Score: {finalScore}</div>
                   {isNewRecord && <div className="record-badge" style={{color: '#39ff14', fontSize:'1.2rem', marginTop:'5px', textShadow:'0 0 10px #39ff14'}}>🎉 NEW PERSONAL BEST! 🎉</div>}
                </>
              ) : (
                <div className="lose-text">Time's Up! Game Over.</div>
              )}
              <div style={{marginTop:'1.5rem'}}>
                 <button className="action-btn" onClick={() => initGame(diff, gameMode)}>Play Again</button>
                 <button className="action-btn" style={{marginLeft:'10px'}} onClick={() => { setIsPlaying(false); setGameOver(false); }}>Change Mode/Difficulty</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MemoryMatch;
