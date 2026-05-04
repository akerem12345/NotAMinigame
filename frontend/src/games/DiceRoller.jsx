import React, { useState } from 'react';
import { submitScore } from '../api';
import '../index.css';

const DiceRoller = ({ onBack }) => {
  const [diceCount, setDiceCount] = useState(1);
  const [diceType, setDiceType] = useState(6);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState('');
  const [isRolling, setIsRolling] = useState(false);

  const handleRoll = async () => {
    setIsRolling(true);
    setMessage('');
    setResults([]);

    // Simulate rolling animation delay
    setTimeout(async () => {
      let newResults = [];
      let sum = 0;
      for (let i = 0; i < diceCount; i++) {
        const roll = Math.floor(Math.random() * diceType) + 1;
        newResults.push(roll);
        sum += roll;
      }
      setResults(newResults);
      setIsRolling(false);

      const maxPossible = diceCount * diceType;
      const percentage = (sum / maxPossible) * 100;

      if (percentage > 70) {
        const luckPoints = Math.floor(percentage);
        setMessage(`Amazing! You scored ${sum}/${maxPossible} and earned ${luckPoints} Luck Points!`);
        try {
          await submitScore('DICE', luckPoints, { sum, maxPossible, diceCount, diceType });
        } catch (e) {
          console.error("Failed to save score", e);
        }
      } else {
        setMessage(`You rolled a total of ${sum}/${maxPossible}. Better luck next time!`);
      }
    }, 1000);
  };

  return (
    <div className="game-container">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>Dice Roller</h2>
      
      <div className="controls">
        <label>
          Dice Count:
          <select value={diceCount} onChange={(e) => setDiceCount(Number(e.target.value))}>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </label>
        
        <label>
          Dice Type:
          <select value={diceType} onChange={(e) => setDiceType(Number(e.target.value))}>
            <option value={6}>D6</option>
            <option value={10}>D10</option>
            <option value={20}>D20</option>
          </select>
        </label>
      </div>

      <button className="action-btn" onClick={handleRoll} disabled={isRolling}>
        {isRolling ? 'Rolling...' : 'Roll Dice'}
      </button>

      <div className="dice-display">
        {results.map((res, idx) => (
          <div key={idx} className={`die neon-box ${isRolling ? 'rolling' : ''}`}>{res}</div>
        ))}
      </div>

      {message && <div className="result-message">{message}</div>}
    </div>
  );
};

export default DiceRoller;
