import React, { useState, useEffect } from 'react';
import { submitScore } from '../api';
import '../index.css';

// Synthetic sound generator using Web Audio API
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'flip') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(450, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'match-success') {
      const playTone = (freq, delay, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + delay + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };
      playTone(587.33, 0, 0.08); // D5
      playTone(880, 0.06, 0.15); // A5
    } else if (type === 'match-fail') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'win') {
      const playTone = (freq, delay, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };
      playTone(523.25, 0, 0.15); // C5
      playTone(659.25, 0.08, 0.15); // E5
      playTone(783.99, 0.16, 0.3); // G5
    } else if (type === 'lose') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    }
  } catch (e) {
    console.warn("Audio Context failed", e);
  }
};

const difficulties = {
  easy: { name: 'Easy', rows: 4, cols: 4, time: 60, multiplier: 1 },
  medium: { name: 'Medium', rows: 6, cols: 6, time: 180, multiplier: 2 },
  hard: { name: 'Hard', rows: 8, cols: 8, time: 360, multiplier: 3 },
};

const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜'];

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
    for (let i = 0; i < pairsCount; i++) {
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

    // Play flip sound
    playSound('flip');

    const newFlipped = [...flippedIndices, idx];
    setFlippedIndices(newFlipped);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (cards[first].value === cards[second].value) {
        const newMatched = [...matchedIndices, first, second];
        setMatchedIndices(newMatched);
        setFlippedIndices([]);
        
        // Play match success sound
        playSound('match-success');

        if (newMatched.length === cards.length) {
          handleGameOver(true, time);
        }
      } else {
        setTimeout(() => {
          setFlippedIndices([]);
          // Play match fail sound
          playSound('match-fail');
        }, 400);
      }
    }
  };

  const handleGameOver = async (won, endingTime) => {
    setGameOver(true);
    setWinStatus(won);
    setIsPlaying(false);

    // Play game over sounds
    if (won) {
      playSound('win');
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
    } else {
      playSound('lose');
    }
  };

  const handleSelectMode = (mode) => {
    playSound('click');
    setGameMode(mode);
  };

  const handleSelectDiff = (k) => {
    playSound('click');
    setDiff(k);
    initGame(k, gameMode);
  };

  return (
    <div className="game-container memory-container">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>Memory Match</h2>

      {!isPlaying && !gameOver ? (
        <div className="diff-selector">
          <h3>Select Game Mode</h3>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <button className={`action-btn ${gameMode === 'countdown' ? 'active-neon' : ''}`} onClick={() => handleSelectMode('countdown')}>Countdown</button>
            <button className={`action-btn ${gameMode === 'timeChallenge' ? 'active-neon' : ''}`} onClick={() => handleSelectMode('timeChallenge')}>Time Challenge</button>
          </div>

          <h3>Select Difficulty</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.entries(difficulties).map(([k, v]) => (
              <button key={k} className="action-btn" onClick={() => handleSelectDiff(k)}>
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
                  {isNewRecord && <div className="record-badge" style={{ color: '#39ff14', fontSize: '1.2rem', marginTop: '5px', textShadow: '0 0 10px #39ff14' }}>🎉 NEW PERSONAL BEST! 🎉</div>}
                </>
              ) : (
                <div className="lose-text">Time's Up! Game Over.</div>
              )}
              <div style={{ marginTop: '1.5rem' }}>
                <button className="action-btn" onClick={() => { playSound('click'); initGame(diff, gameMode); }}>Play Again</button>
                <button className="action-btn" style={{ marginLeft: '10px' }} onClick={() => { playSound('click'); setIsPlaying(false); setGameOver(false); }}>Change Mode/Difficulty</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MemoryMatch;
