import React, { useState, useEffect } from 'react';
import { submitScore } from '../api';
import '../index.css';

// Synthetic sound generator using Web Audio API
const playSound = (type) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'x-move') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch for X
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'o-move') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // Lower pitch for O
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === 'win') {
      // Victory arpeggio (C Major)
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
    } else if (type === 'draw') {
      // Flat tone
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(260, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'click') {
      // Menu button click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
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

const TicTacToe = ({ onBack, onUnlockAchievement }) => {
  const [gameMode, setGameMode] = useState(null); // 'coop' or 'bot'
  const [board, setBoard] = useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState(null);

  const calculateWinner = (squares) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
      [0, 4, 8], [2, 4, 6]             // diags
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const handleClick = async (i) => {
    if (board[i] || winner) return;
    if (gameMode === 'bot' && !xIsNext) return; // Prevent clicking during bot's turn

    const newBoard = board.slice();
    const currentMark = xIsNext ? 'X' : 'O';
    newBoard[i] = currentMark;
    setBoard(newBoard);
    
    // Play move sound
    playSound(xIsNext ? 'x-move' : 'o-move');
    
    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
      playSound('win');
      if (gameMode === 'bot' && newWinner === 'X' && onUnlockAchievement) {
        onUnlockAchievement('tictactoe_win_ai');
      }
      await saveScore(newWinner);
    } else if (!newBoard.includes(null)) {
      setWinner('Draw');
      playSound('draw');
      await saveScore('Draw');
    } else {
      setXIsNext(!xIsNext);
    }
  };

  useEffect(() => {
    if (gameMode === 'bot' && !xIsNext && !winner) {
      const emptyIndices = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
      if (emptyIndices.length > 0) {
        const timer = setTimeout(() => {
          // Simple AI: pick random
          const randomIdx = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
          const newBoard = board.slice();
          newBoard[randomIdx] = 'O';
          setBoard(newBoard);
          
          // Play bot O move sound
          playSound('o-move');
          
          const newWinner = calculateWinner(newBoard);
          if (newWinner) {
            setWinner(newWinner);
            playSound('win');
            if (onUnlockAchievement) {
              onUnlockAchievement('tictactoe_lose_ai');
            }
            saveScore(newWinner);
          } else if (!newBoard.includes(null)) {
            setWinner('Draw');
            playSound('draw');
            saveScore('Draw');
          } else {
            setXIsNext(true);
          }
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [xIsNext, winner, gameMode, board]);

  const saveScore = async (result) => {
    try {
      const scoreValue = result === 'X' ? 100 : (result === 'O' ? 50 : 10);
      await submitScore('TIC_TAC_TOE', scoreValue, { winner: result });
    } catch (e) {
      console.error("Failed to save TicTacToe score", e);
    }
  };

  const resetGame = () => {
    playSound('click');
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
  };

  const handleSelectMode = (mode) => {
    playSound('click');
    setGameMode(mode);
  };

  const renderSquare = (i) => {
    const mark = board[i];
    const markClass = mark === 'X' ? 'x-mark' : (mark === 'O' ? 'o-mark' : '');
    return (
      <button 
        className={`ttt-square ${markClass}`} 
        onClick={() => handleClick(i)}
        disabled={board[i] || !!winner || (gameMode === 'bot' && !xIsNext)}
      >
        {mark}
      </button>
    );
  };

  return (
    <div className="game-container ttt-container">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>Tic-Tac-Toe</h2>

      {!gameMode ? (
        <div className="diff-selector" style={{ marginTop: '2rem' }}>
          <h3>Select Game Mode</h3>
          <button className="action-btn" onClick={() => handleSelectMode('coop')}>Local Co-Op</button>
          <button className="action-btn" onClick={() => handleSelectMode('bot')}>Play vs BOT</button>
        </div>
      ) : (
        <>
          <div className={`status ${winner ? 'pulsing-neon' : ''}`} style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
            {winner 
              ? (winner === 'Draw' ? "It's a Draw!" : `Winner: ${winner} 🎉`) 
              : (gameMode === 'bot' && !xIsNext ? "BOT is thinking..." : `Player Turn: ${xIsNext ? 'X' : 'O'}`)}
          </div>

          <div className={`ttt-board ${xIsNext ? 'x-turn' : 'o-turn'}`}>
            <div className="board-row">
              {renderSquare(0)}{renderSquare(1)}{renderSquare(2)}
            </div>
            <div className="board-row">
              {renderSquare(3)}{renderSquare(4)}{renderSquare(5)}
            </div>
            <div className="board-row">
              {renderSquare(6)}{renderSquare(7)}{renderSquare(8)}
            </div>
          </div>

          {(winner || !board.includes(null)) && (
            <div style={{ display: 'flex', gap: '15px' }}>
              <button className="action-btn" onClick={resetGame}>Play Again</button>
              <button className="action-btn" onClick={() => { resetGame(); setGameMode(null); }}>Change Mode</button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TicTacToe;
