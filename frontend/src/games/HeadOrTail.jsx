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
      // Swoosh frequency ramp for flipping
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === 'win') {
      // High-pitched happy major chord
      const playTone = (freq, delay, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0, ctx.currentTime + delay);
        gain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + delay + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + duration);
      };
      playTone(523.25, 0, 0.12); // C5
      playTone(659.25, 0.08, 0.12); // E5
      playTone(783.99, 0.16, 0.25); // G5
    } else if (type === 'lose') {
      // Deep buzz sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    console.warn("Audio Context blocked or unsupported.", e);
  }
};

const HeadOrTail = ({ onBack, onUnlockAchievement }) => {
  const [prediction, setPrediction] = useState(null); // 'heads' | 'tails'
  const [isFlipping, setIsFlipping] = useState(false);
  const [outcome, setOutcome] = useState(null); // 'heads' | 'tails'
  const [flipClass, setFlipClass] = useState('');
  
  // Game Stats
  const [score, setScore] = useState(0);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [highStreak, setHighStreak] = useState(0);
  const [gameResult, setGameResult] = useState(null); // 'won' | 'lost'
  
  // Load high streak from localStorage on mount
  useEffect(() => {
    const savedHighStreak = localStorage.getItem('headortail_highstreak');
    if (savedHighStreak) {
      setHighStreak(parseInt(savedHighStreak, 10));
    }
  }, []);

  const handleFlip = () => {
    if (isFlipping || !prediction) return;

    setIsFlipping(true);
    setGameResult(null);
    setOutcome(null);
    
    // Play flip sound and trigger audio intervals for "spinning" effect
    playSound('flip');
    const flipSoundInterval = setInterval(() => {
      playSound('flip');
    }, 250);

    // Randomize outcome
    const roll = Math.random() < 0.5 ? 'heads' : 'tails';
    
    // Start animation class (reflow reset)
    setFlipClass('');
    setTimeout(() => {
      setFlipClass(roll === 'heads' ? 'flipping-to-heads' : 'flipping-to-tails');
    }, 10);

    // Stop coin flip after animation completes (1200ms)
    setTimeout(async () => {
      clearInterval(flipSoundInterval);
      setOutcome(roll);
      setIsFlipping(false);
      
      const didWin = prediction === roll;
      
      if (didWin) {
        setGameResult('won');
        playSound('win');
        
        // Calculate points (10 base + streak bonus)
        const nextStreak = currentStreak + 1;
        setCurrentStreak(nextStreak);
        
        if (nextStreak >= 5 && onUnlockAchievement) {
          onUnlockAchievement('coin_streak_5');
        }
        
        let streakBonus = 0;
        if (nextStreak >= 5) {
          streakBonus = 15;
        } else if (nextStreak >= 3) {
          streakBonus = 5;
        }
        
        const earnedPoints = 10 + streakBonus;
        setScore(prev => prev + earnedPoints);
        
        // Update high streak if applicable
        if (nextStreak > highStreak) {
          setHighStreak(nextStreak);
          localStorage.setItem('headortail_highstreak', nextStreak.toString());
        }

        // Submit Score
        try {
          await submitScore('HEAD_OR_TAIL', earnedPoints, {
            prediction,
            outcome: roll,
            streak: nextStreak,
            streakBonus
          });
        } catch (err) {
          console.error("Failed to submit score", err);
        }
      } else {
        setGameResult('lost');
        playSound('lose');
        setCurrentStreak(0);
      }
    }, 1200);
  };

  return (
    <div className="game-container headortail-container">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>Head or Tail</h2>

      <div className="stats-board">
        <div className="stat-item">
          <span className="stat-label">Session Score</span>
          <span className="stat-value" style={{ color: 'var(--accent-neon)', textShadow: '0 0 5px var(--accent-neon)' }}>{score}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Current Streak</span>
          <span className="stat-value">{currentStreak} 🔥</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Highest Streak</span>
          <span className="stat-value" style={{ color: 'var(--primary-neon)', textShadow: '0 0 5px var(--primary-neon)' }}>{highStreak} 👑</span>
        </div>
      </div>

      <div className="choice-selectors">
        <button
          className={`choice-btn ${prediction === 'heads' ? 'selected-heads' : ''}`}
          onClick={() => !isFlipping && setPrediction('heads')}
          disabled={isFlipping}
        >
          <span className="choice-icon">⚡</span>
          <span className="choice-text">Heads</span>
        </button>

        <button
          className={`choice-btn ${prediction === 'tails' ? 'selected-tails' : ''}`}
          onClick={() => !isFlipping && setPrediction('tails')}
          disabled={isFlipping}
        >
          <span className="choice-icon">👑</span>
          <span className="choice-text">Tails</span>
        </button>
      </div>

      {/* 3D Coin Graphic */}
      <div className="coin-wrapper">
        <div className={`coin ${flipClass}`}>
          <div className="coin-side heads">
            <span className="coin-symbol">⚡</span>
            <span className="coin-label">Heads</span>
          </div>
          <div className="coin-side tails">
            <span className="coin-symbol">👑</span>
            <span className="coin-label">Tails</span>
          </div>
        </div>
      </div>

      <button
        className="action-btn"
        onClick={handleFlip}
        disabled={isFlipping || !prediction}
        style={{ marginTop: '2rem', minWidth: '150px' }}
      >
        {isFlipping ? 'Flipping...' : 'Flip Coin'}
      </button>

      {/* Results Board */}
      <div className="game-over-message" style={{ minHeight: '80px', marginTop: '1.5rem' }}>
        {gameResult === 'won' && (
          <div className="win-text" style={{ fontSize: '1.5rem' }}>
            Correct! It was {outcome === 'heads' ? 'Heads' : 'Tails'}. (+10 pts)
            {currentStreak >= 3 && (
              <div style={{ fontSize: '1.1rem', color: 'var(--accent-neon)', marginTop: '5px' }}>
                Streak Bonus Active! (+{currentStreak >= 5 ? '15' : '5'} pts)
              </div>
            )}
          </div>
        )}
        {gameResult === 'lost' && (
          <div className="lose-text" style={{ fontSize: '1.5rem' }}>
            Wrong! It was {outcome === 'heads' ? 'Heads' : 'Tails'}. Streak Reset.
          </div>
        )}
        {!gameResult && !isFlipping && prediction && (
          <div className="tagline" style={{ fontSize: '1.1rem' }}>
            Predicted: <span style={{ color: prediction === 'heads' ? 'var(--primary-neon)' : 'var(--secondary-neon)', fontWeight: 'bold' }}>{prediction.toUpperCase()}</span>. Flip to see results!
          </div>
        )}
        {!prediction && !isFlipping && (
          <div className="tagline" style={{ fontSize: '1.1rem' }}>
            Make a prediction to start flipping!
          </div>
        )}
      </div>
    </div>
  );
};

export default HeadOrTail;
