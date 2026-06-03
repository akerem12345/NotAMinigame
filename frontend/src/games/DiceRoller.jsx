import React, { useState, useEffect } from 'react';
import { submitScore } from '../api';
import '../index.css';

const DiceRoller = ({ onBack, onUnlockAchievement }) => {
  const [diceCount, setDiceCount] = useState(2); // Start with 2 dice for a richer default view
  const [previousRoll, setPreviousRoll] = useState(null);
  const [diceType, setDiceType] = useState(6);
  const [results, setResults] = useState([]);
  const [tempResults, setTempResults] = useState([]);
  const [message, setMessage] = useState('');
  const [luckPoints, setLuckPoints] = useState(0);
  const [scoreSum, setScoreSum] = useState(0);
  const [maxScore, setMaxScore] = useState(0);

  // States: 'idle', 'shaking', 'revealing', 'results'
  const [gameState, setGameState] = useState('idle');

  const handleThrow = () => {
    if (gameState !== 'idle' && gameState !== 'results') return;

    setGameState('shaking');
    setMessage('');
    setResults([]);
    setTempResults([]);
    setLuckPoints(0);
    setScoreSum(0);

    // Shake cups vigorously for 2 seconds
    setTimeout(() => {
      // Shaking finished, calculate outcomes
      let newResults = [];
      let sum = 0;
      for (let i = 0; i < diceCount; i++) {
        const roll = Math.floor(Math.random() * diceType) + 1;
        newResults.push(roll);
        sum += roll;
      }

      const maxPossible = diceCount * diceType;
      const percentage = (sum / maxPossible) * 100;

      setScoreSum(sum);
      setMaxScore(maxPossible);
      setTempResults(newResults);
      setGameState('revealing');

      // The sliding animation is staggered at 150ms per die tile.
      // The fade/slide transition takes 600ms to complete.
      const revealDelay = newResults.length * 150 + 600;

      setTimeout(async () => {
        setResults(newResults);
        setGameState('results');

        if (onUnlockAchievement) {
          if (diceCount === 5 && newResults.every(val => val === 6)) {
            onUnlockAchievement('dice_five_sixes');
          }
          if (previousRoll && previousRoll.length === newResults.length) {
            const sortedCurrent = [...newResults].sort((a, b) => a - b);
            const sortedPrev = [...previousRoll].sort((a, b) => a - b);
            const isSame = sortedCurrent.every((val, idx) => val === sortedPrev[idx]);
            if (isSame) {
              onUnlockAchievement('dice_same_twice');
            }
          }
        }
        setPreviousRoll(newResults);

        if (percentage > 70) {
          const lp = Math.floor(percentage);
          try {
            await submitScore('DICE', lp, { sum, maxPossible, diceCount, diceType });
          } catch (e) {
            console.error("Failed to save score", e);
          }
        }
      }, revealDelay);

    }, 2000);
  };

  const handleThrowAgain = () => {
    if (gameState !== 'results') return;

    // Reset back to idle state (closing cups)
    setGameState('idle');
    setResults([]);
    setTempResults([]);
    setMessage('');
    setLuckPoints(0);
    setScoreSum(0);

    // Let the cups close (0.6s transition) then trigger the throw automatically
    setTimeout(() => {
      handleThrow();
    }, 600);
  };

  // Enable direct click on cups to roll, when game is ready
  const handleCupClick = () => {
    if (gameState === 'idle') {
      handleThrow();
    } else if (gameState === 'results') {
      handleThrowAgain();
    }
  };

  return (
    <div className="dice-roller-board">
      <button className="casino-back-btn" onClick={onBack} title="Go back to menu">←</button>

      <div className="casino-header">
        <h2 className="casino-title">Dice Roller</h2>
      </div>

      <div className="casino-controls">
        <div className="casino-control-group">
          <label className="casino-control-label">Dice Count</label>
          <select 
            className="casino-select" 
            value={diceCount} 
            onChange={(e) => setDiceCount(Number(e.target.value))}
            disabled={gameState !== 'idle' && gameState !== 'results'}
          >
            <option value={1}>1 Die</option>
            <option value={2}>2 Dice</option>
            <option value={3}>3 Dice</option>
            <option value={4}>4 Dice</option>
            <option value={5}>5 Dice</option>
          </select>
        </div>

        <div className="casino-control-group">
          <label className="casino-control-label">Dice Type</label>
          <select 
            className="casino-select" 
            value={diceType} 
            onChange={(e) => setDiceType(Number(e.target.value))}
            disabled={gameState !== 'idle' && gameState !== 'results'}
          >
            <option value={4}>D4 (4-sided)</option>
            <option value={6}>D6 (6-sided)</option>
            <option value={8}>D8 (8-sided)</option>
            <option value={10}>D10 (10-sided)</option>
            <option value={12}>D12 (12-sided)</option>
            <option value={20}>D20 (20-sided)</option>
          </select>
        </div>
      </div>

      {/* Interactive Dice Cups */}
      <div className="cups-wrapper" onClick={handleCupClick} title={gameState === 'idle' ? "Click the cups to shake and throw!" : ""}>
        <div className={`cups-container-inner ${gameState === 'idle' ? 'idle' : ''} ${gameState === 'shaking' ? 'shaking' : ''}`}>
          <div className={`dice-cup-element top ${(gameState === 'revealing' || gameState === 'results') ? 'separated' : ''}`} />
          <div className={`dice-cup-element bottom ${(gameState === 'revealing' || gameState === 'results') ? 'separated' : ''}`} />
        </div>

        {/* Dice Tray under/inside the cups */}
        {(gameState === 'revealing' || gameState === 'results') && (
          <div className="dice-tray">
            {tempResults.map((val, idx) => (
              <div 
                key={idx} 
                className="casino-die-tile sliding-out"
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <span className="casino-die-label">D{diceType}</span>
                <span className="casino-die-value">{val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Button state controllers */}
      {gameState === 'idle' && (
        <button className="casino-action-btn" onClick={handleThrow}>
          Throw Dice
        </button>
      )}

      {gameState === 'shaking' && (
        <button className="casino-action-btn" disabled>
          Shaking...
        </button>
      )}

      {gameState === 'revealing' && (
        <button className="casino-action-btn" disabled>
          Revealing...
        </button>
      )}

      {gameState === 'results' && (
        <button className="casino-action-btn" onClick={handleThrowAgain}>
          Throw Again
        </button>
      )}

      {/* Casino elegant dashboard panel */}
      {gameState === 'results' && (
        <div className="casino-results-panel">
          <div className="casino-results-sum">
            Total Result: <span>{scoreSum}</span>
          </div>
          <div className="casino-results-details">
            You threw {diceCount} D{diceType} dice with values: {results.join(', ')}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiceRoller;
