import React, { useState, useEffect, useRef } from 'react';
import { submitScore } from '../api';
import '../index.css';

// Synthetic F1 Engine sound generator using Web Audio API
const playF1Engine = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    
    // Engine starts at 160Hz (deep hum)
    osc1.frequency.setValueAtTime(160, ctx.currentTime);
    osc2.frequency.setValueAtTime(162, ctx.currentTime); // detuned
    
    // Revs up rapidly in 0.4 seconds (car launches)
    osc1.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.4);
    osc2.frequency.exponentialRampToValueAtTime(960, ctx.currentTime + 0.4);
    
    // Holds and slides down slightly representing Doppler effect
    osc1.frequency.linearRampToValueAtTime(700, ctx.currentTime + 1.2);
    osc2.frequency.linearRampToValueAtTime(710, ctx.currentTime + 1.2);
    
    // Engine volume fades out as the car speeds away
    gainNode.gain.setValueAtTime(0.001, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.08);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
    
    // Lowpass filter sweep to shape the engine sound
    filter.type = 'lowpass';
    filter.Q.setValueAtTime(7, ctx.currentTime);
    filter.frequency.setValueAtTime(450, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2800, ctx.currentTime + 0.4);
    filter.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 1.4);
    
    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    
    osc1.stop(ctx.currentTime + 1.5);
    osc2.stop(ctx.currentTime + 1.5);
  } catch (e) {
    console.warn("F1 audio engine failed", e);
  }
};

// Gantry light indicator sound
const playGantryBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, ctx.currentTime);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  } catch (e) {}
};

// Failure buzzer sound
const playFailBuzzer = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(120, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(90, ctx.currentTime + 0.4);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch (e) {}
};

const PILOT_BENCHMARKS = [
  { name: 'Valtteri Bottas', time: 104, desc: 'F1 Record' },
  { name: 'Lando Norris', time: 135, desc: 'Ultra Reflexes' },
  { name: 'Max Verstappen', time: 148, desc: 'Superhuman Speed' },
  { name: 'Lewis Hamilton', time: 165, desc: 'World Champion reflexes' },
  { name: 'Average F1 Pilot', time: 200, desc: 'Standard F1 starting speed' },
  { name: 'Average Human', time: 250, desc: 'Casual reaction benchmark' }
];

const F1Reaction = ({ onBack, onUnlockAchievement }) => {
  // 'idle' | 'preparing' | 'ready' | 'go' | 'result' | 'jump'
  const [gameState, setGameState] = useState('idle');
  const [countdownStage, setCountdownStage] = useState(0); // 0 (off), 1 (orange), 2 (green), 3 (red 1), 4 (red 2)
  const [orangeFlash, setOrangeFlash] = useState(false);
  const [reactionTime, setReactionTime] = useState(null);
  const [personalBest, setPersonalBest] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(0);
  
  const timeouts = useRef([]);
  const startTime = useRef(0);
  const lastStateChangeTime = useRef(0);

  // Load personal best on mount
  useEffect(() => {
    const savedPB = localStorage.getItem('f1reaction_pb');
    if (savedPB) {
      setPersonalBest(parseInt(savedPB, 10));
    }
  }, []);

  // Clean up all timeouts ONLY when component unmounts
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, []);

  // Spacebar keydown listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        triggerReaction();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameState]);

  // Monitor waiting for 10 seconds after lights out for "Internet Explorer" achievement
  useEffect(() => {
    if (gameState === 'go') {
      const timer = setTimeout(() => {
        if (onUnlockAchievement) {
          onUnlockAchievement('f1_wait_10s');
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [gameState, onUnlockAchievement]);

  // Orange blinking animation for idle and jump states
  useEffect(() => {
    let flashInterval;
    if (gameState === 'idle' || gameState === 'jump') {
      flashInterval = setInterval(() => {
        setOrangeFlash(prev => !prev);
      }, gameState === 'jump' ? 250 : 500);
    } else {
      setOrangeFlash(false);
    }
    return () => clearInterval(flashInterval);
  }, [gameState]);

  const clearAllTimeouts = () => {
    timeouts.current.forEach(t => clearTimeout(t));
    timeouts.current = [];
  };

  const startPreparation = () => {
    clearAllTimeouts();
    setGameState('preparing');
    lastStateChangeTime.current = performance.now();
    setReactionTime(null);
    setPointsEarned(0);
    setCountdownStage(0);

    // Stage 1: Orange lights (Row 1) turn on
    const t1 = setTimeout(() => {
      setCountdownStage(1);
      playGantryBeep();
    }, 800);
    timeouts.current.push(t1);

    // Stage 2: Green lights (Row 2) turn on
    const t2 = setTimeout(() => {
      setCountdownStage(2);
      playGantryBeep();
    }, 1600);
    timeouts.current.push(t2);

    // Stage 3: First Red row (Row 3) turns on
    const t3 = setTimeout(() => {
      setCountdownStage(3);
      playGantryBeep();
    }, 2400);
    timeouts.current.push(t3);

    // Stage 4: Second Red row (Row 4) turns on
    const t4 = setTimeout(() => {
      setCountdownStage(4);
      playGantryBeep();
      setGameState('ready');

      // Random delay before lights out (800ms to 3000ms)
      const randomDelay = 800 + Math.random() * 2200;
      const goTimeout = setTimeout(() => {
        setCountdownStage(0); // Lights out!
        setGameState('go');
        // Capture start time when the browser actually paints the updated lights-out screen
        requestAnimationFrame(() => {
          startTime.current = performance.now();
        });
      }, randomDelay);
      
      timeouts.current.push(goTimeout);
    }, 3200);
    timeouts.current.push(t4);
  };

  const triggerReaction = async () => {
    const now = performance.now();

    if (gameState === 'idle' || gameState === 'result' || gameState === 'jump') {
      startPreparation();
      return;
    }

    // click protection: ignore click if within 300ms of starting the preparation
    if (now - lastStateChangeTime.current < 300) {
      return;
    }

    if (gameState === 'preparing' || gameState === 'ready') {
      // Jump start! clicked too early
      clearAllTimeouts();
      setGameState('jump');
      setCountdownStage(0);
      playFailBuzzer();
      return;
    }

    if (gameState === 'go') {
      const finalTime = Math.round(now - startTime.current);
      setReactionTime(finalTime);
      setGameState('result');

      if (onUnlockAchievement) {
        if (finalTime < 200) {
          onUnlockAchievement('f1_under_200');
        }
        if (finalTime <= 104) {
          onUnlockAchievement('f1_best_of_best');
        }
        if (finalTime >= 10000) {
          onUnlockAchievement('f1_wait_10s');
        }
      }
      
      // Play F1 engine sound and move car
      playF1Engine();

      // Calculate score points based on speed
      let points = 0;
      if (finalTime < 150) points = 100;
      else if (finalTime < 200) points = 75;
      else if (finalTime < 250) points = 50;
      else if (finalTime < 300) points = 30;
      else if (finalTime < 400) points = 15;
      else if (finalTime < 600) points = 5;
      else points = 1;

      setPointsEarned(points);

      // Save personal best reaction time
      const savedPB = localStorage.getItem('f1reaction_pb');
      if (!savedPB || finalTime < parseInt(savedPB, 10)) {
        localStorage.setItem('f1reaction_pb', finalTime.toString());
        setPersonalBest(finalTime);
      }

      // Submit Score to database
      try {
        await submitScore('F1_REACTION', points, { reactionTimeMs: finalTime });
      } catch (err) {
        console.error("Failed to submit score", err);
      }
    }
  };

  const getBenchmarkComparison = () => {
    if (reactionTime === null) return null;
    
    // Find closest benchmark
    const beatPilots = PILOT_BENCHMARKS.filter(p => reactionTime <= p.time);
    if (beatPilots.length > 0) {
      const bestBeat = beatPilots[0];
      return `Awesome! You reacted faster than ${bestBeat.name} (${bestBeat.time}ms - ${bestBeat.desc})!`;
    }
    
    const nearestF1 = PILOT_BENCHMARKS.find(p => p.time === 200);
    return `You were slower than ${nearestF1.name} (${nearestF1.time}ms). Practice makes perfect!`;
  };

  return (
    <div className="game-container f1reaction-container">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>F1 Start Reaction Test</h2>

      {/* Stats Display */}
      <div className="stats-board" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-item">
          <span className="stat-label">Best Reflex</span>
          <span className="stat-value" style={{ color: 'var(--accent-neon)' }}>
            {personalBest ? `${personalBest} ms` : '---'}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Last Score</span>
          <span className="stat-value" style={{ color: 'var(--primary-neon)' }}>
            {pointsEarned ? `+${pointsEarned} pts` : '---'}
          </span>
        </div>
      </div>

      {/* 4x5 Gantry Light Grid */}
      <div className="f1-gantry-bracket">
        <div className="f1-gantry-support left" />
        <div className="f1-gantry">
          {[0, 1, 2, 3, 4].map((colIdx) => {
            // Row 1 (Orange) active during countdown stage >= 1, or blinking in idle/jump
            const isOrangeActive = 
              (gameState === 'preparing' || gameState === 'ready') ? (countdownStage >= 1) : 
              ((gameState === 'idle' || gameState === 'jump') && orangeFlash);
            
            // Row 2 (Green) active during countdown stage >= 2, or when game is go/result
            const isGreenActive = 
              (gameState === 'preparing' || gameState === 'ready') ? (countdownStage >= 2) : 
              (gameState === 'go' || gameState === 'result');
            
            // Row 3 (Red) active during countdown stage >= 3
            const isRedRow3Active = 
              (gameState === 'preparing' || gameState === 'ready') && (countdownStage >= 3);
            
            // Row 4 (Red) active during countdown stage >= 4
            const isRedRow4Active = 
              (gameState === 'preparing' || gameState === 'ready') && (countdownStage >= 4);
            
            return (
              <div key={colIdx} className="f1-light-column">
                {/* Row 1: Orange */}
                <div className={`f1-light orange ${isOrangeActive ? 'active' : ''}`} />
                {/* Row 2: Green */}
                <div className={`f1-light green ${isGreenActive ? 'active' : ''}`} />
                {/* Row 3: Red */}
                <div className={`f1-light red ${isRedRow3Active ? 'active' : ''}`} />
                {/* Row 4: Red */}
                <div className={`f1-light red ${isRedRow4Active ? 'active' : ''}`} />
              </div>
            );
          })}
        </div>
        <div className="f1-gantry-support right" />
      </div>

      {/* Race Track Screen (Right-to-Left Racer starting at Checkered Start Line) */}
      <div className="f1-track">
        <div className="track-curb top" />
        <div className="track-grid-lines" title="Checkered Start Line" />
        <div className="track-lines" />
        <div className={`f1-car ${gameState === 'result' ? 'f1-car-go' : ''}`}>🏎️</div>
        <div className="track-curb bottom" />
      </div>

      {/* Big Clickable Area */}
      <div
        className={`f1-interactive-panel ${gameState === 'go' ? 'panel-go' : ''} ${gameState === 'ready' ? 'panel-ready' : ''} ${gameState === 'preparing' ? 'panel-preparing' : ''}`}
        onPointerDown={triggerReaction}
      >
        {gameState === 'idle' && 'CLICK HERE OR PRESS SPACE BAR TO PREPARE'}
        {gameState === 'preparing' && 'LIGHTING UP GRID...'}
        {gameState === 'ready' && 'WAIT FOR LIGHTS OUT!'}
        {gameState === 'go' && 'REACT NOW!!!'}
        {gameState === 'result' && 'CLICK HERE TO TRY AGAIN'}
        {gameState === 'jump' && 'FALSE START / JUMP START! CLICK TO RETRY'}
      </div>

      {/* Results details */}
      <div className="game-over-message" style={{ minHeight: '100px', marginTop: '1rem' }}>
        {gameState === 'result' && reactionTime !== null && (
          <div className="result-display-wrapper">
            <div className="win-text" style={{ fontSize: '1.8rem', textShadow: '0 0 10px var(--accent-neon)', color: 'var(--accent-neon)' }}>
              Reaction Time: {reactionTime} ms
            </div>
            <p className="tagline" style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
              {getBenchmarkComparison()}
            </p>
          </div>
        )}
        {gameState === 'jump' && (
          <div className="lose-text" style={{ fontSize: '1.8rem' }}>
            Jump Start! Disqualified.
            <p className="tagline" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              You reacted before the lights went out. Hold your horses!
            </p>
          </div>
        )}
      </div>

      {/* Benchmarks Board */}
      <div className="benchmarks-board">
        <h3>F1 Reflex Benchmarks</h3>
        <div className="benchmarks-list">
          {PILOT_BENCHMARKS.map((benchmark, idx) => (
            <div key={idx} className="benchmark-row">
              <span className="benchmark-name">{benchmark.name}</span>
              <span className="benchmark-time">{benchmark.time} ms</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default F1Reaction;
