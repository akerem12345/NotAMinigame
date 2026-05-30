import React, { useState, useCallback } from 'react';
import { submitScore } from '../api';
import '../index.css';

// Synthetic sound generator using Web Audio API
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'correct') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // high bell pitch
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(180, ctx.currentTime); // low knock pitch
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
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

const CATEGORIES = {
  ANIMALS: ["ELEPHANT", "GIRAFFE", "KANGAROO", "DOLPHIN", "PENGUIN", "CHIMPANZEE", "RHINOCEROS"],
  TECHNOLOGY: ["ALGORITHM", "BANDWIDTH", "COMPILER", "DATABASE", "ENCRYPTION", "JAVASCRIPT", "PROCESSOR"],
  COUNTRIES: ["ARGENTINA", "AUSTRALIA", "INDONESIA", "MADAGASCAR", "NETHERLANDS", "PORTUGAL", "SWITZERLAND"]
};

const HangmanDrawing = ({ mistakes }) => {
  return (
    <svg height="250" width="200" className="hangman-svg" style={{stroke: 'var(--secondary-neon)', strokeWidth: 4, fill: 'transparent', margin: '1rem 0'}}>
      {/* Base */}
      <line x1="10" y1="240" x2="150" y2="240" />
      <line x1="80" y1="240" x2="80" y2="20" />
      <line x1="80" y1="20" x2="140" y2="20" />
      <line x1="140" y1="20" x2="140" y2="50" />
      
      {/* Parts based on mistakes */}
      {mistakes >= 1 && <circle cx="140" cy="70" r="20" />} {/* Head */}
      {mistakes >= 2 && <line x1="140" y1="90" x2="140" y2="150" />} {/* Body */}
      {mistakes >= 3 && <line x1="140" y1="100" x2="120" y2="130" />} {/* L Arm */}
      {mistakes >= 4 && <line x1="140" y1="100" x2="160" y2="130" />} {/* R Arm */}
      {mistakes >= 5 && <line x1="140" y1="150" x2="120" y2="190" />} {/* L Leg */}
      {mistakes >= 6 && <line x1="140" y1="150" x2="160" y2="190" />} {/* R Leg */}
    </svg>
  );
};

const Hangman = ({ onBack }) => {
  const [category, setCategory] = useState(null);
  const [word, setWord] = useState('');
  const [guessedLetters, setGuessedLetters] = useState(new Set());
  const [mistakes, setMistakes] = useState(0);
  const [isWinner, setIsWinner] = useState(false);
  const [isLoser, setIsLoser] = useState(false);
  const maxMistakes = 6;

  const initGame = (selectedCat) => {
    playSound('click');
    const wordsPool = CATEGORIES[selectedCat];
    const randomIndex = Math.floor(Math.random() * wordsPool.length);
    setCategory(selectedCat);
    setWord(wordsPool[randomIndex]);
    setGuessedLetters(new Set());
    setMistakes(0);
    setIsWinner(false);
    setIsLoser(false);
  };

  const handleGuess = useCallback(async (letter) => {
    if (isWinner || isLoser || guessedLetters.has(letter) || !word) return;

    const newGuessed = new Set(guessedLetters);
    newGuessed.add(letter);
    setGuessedLetters(newGuessed);

    let currentMistakes = mistakes;
    const isCorrect = word.includes(letter);
    
    if (!isCorrect) {
      currentMistakes += 1;
      setMistakes(currentMistakes);
      playSound('wrong');
    } else {
      playSound('correct');
    }

    const won = word.split('').every(char => newGuessed.has(char));
    if (won) {
      setIsWinner(true);
      playSound('win');
      // Score based on word length and remaining lives
      const score = (word.length * 10) + ((maxMistakes - currentMistakes) * 15);
      await saveScore(score);
    } else if (currentMistakes >= maxMistakes) {
      setIsLoser(true);
      playSound('lose');
    }
  }, [guessedLetters, isWinner, isLoser, word, mistakes]);

  const saveScore = async (score) => {
    try {
      await submitScore('HANGMAN', score, { word, category, length: word.length });
    } catch (e) {
      console.error("Score save failed", e);
    }
  };

  const handleResetGame = () => {
    playSound('click');
    initGame(category);
  };

  const handleChangeCategory = () => {
    playSound('click');
    setCategory(null);
  };

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

  return (
    <div className="game-container hangman-container">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>Hangman</h2>

      {!category ? (
        <div className="diff-selector">
          <h3>Select Category</h3>
          <div style={{display:'flex', flexDirection:'column', gap:'10px', marginTop:'1rem'}}>
             {Object.keys(CATEGORIES).map(cat => (
                <button key={cat} className="action-btn" onClick={() => initGame(cat)}>{cat}</button>
             ))}
          </div>
        </div>
      ) : (
        <>
          <div className="hangman-status">
            Category: {category} | Mistakes: {mistakes} / {maxMistakes}
          </div>

          <HangmanDrawing mistakes={mistakes} />

          <div className="hangman-word">
            {word.split('').map((char, i) => (
              <span key={i} className="hangman-letter">
                {guessedLetters.has(char) || isLoser ? char : '_'}
              </span>
            ))}
          </div>

          <div className="hangman-keyboard">
            {alphabet.map(letter => (
              <button
                key={letter}
                className={`key-btn ${(guessedLetters.has(letter) ? (word.includes(letter) ? 'correct' : 'wrong') : '')}`}
                onClick={() => handleGuess(letter)}
                disabled={guessedLetters.has(letter) || isWinner || isLoser}
              >
                {letter}
              </button>
            ))}
          </div>

          <div className="game-over-message">npm
            {isWinner && <div className="win-text">You Won! Score: {(word.length * 10) + ((maxMistakes - mistakes) * 15)}</div>}
            {isLoser && <div className="lose-text">Game Over! Word was: {word}</div>}
            {(isWinner || isLoser) && (
              <div style={{marginTop:'1rem'}}>
                <button className="action-btn" onClick={handleResetGame}>Play Again</button>
                <button className="action-btn" style={{marginLeft:'10px'}} onClick={handleChangeCategory}>Change Category</button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Hangman;
