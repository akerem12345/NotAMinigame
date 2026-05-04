import React, { useState, useEffect } from 'react';
import { submitScore } from '../api';
import '../index.css';

const TicTacToe = ({ onBack }) => {
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
    newBoard[i] = xIsNext ? 'X' : 'O';
    setBoard(newBoard);
    
    const newWinner = calculateWinner(newBoard);
    if (newWinner) {
      setWinner(newWinner);
      await saveScore(newWinner);
    } else if (!newBoard.includes(null)) {
      setWinner('Draw');
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
          
          const newWinner = calculateWinner(newBoard);
          if (newWinner) {
            setWinner(newWinner);
            saveScore(newWinner);
          } else if (!newBoard.includes(null)) {
            setWinner('Draw');
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
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    setWinner(null);
  };

  const renderSquare = (i) => (
    <button className="ttt-square" onClick={() => handleClick(i)}>
      {board[i]}
    </button>
  );

  return (
    <div className="game-container ttt-container">
      <button className="back-btn" onClick={onBack}>← Back</button>
      <h2>Tic-Tac-Toe</h2>

      {!gameMode ? (
        <div className="diff-selector" style={{ marginTop: '2rem' }}>
          <h3>Select Game Mode</h3>
          <button className="action-btn" onClick={() => setGameMode('coop')}>Local Co-Op</button>
          <button className="action-btn" onClick={() => setGameMode('bot')}>Play vs BOT</button>
        </div>
      ) : (
        <>
          <div className="status">
            {winner 
              ? (winner === 'Draw' ? "It's a Draw!" : `Winner: ${winner}`) 
              : (gameMode === 'bot' && !xIsNext ? "BOT is thinking..." : `Next player: ${xIsNext ? 'X' : 'O'}`)}
          </div>

          <div className="ttt-board">
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

          {winner && (
            <div style={{ display: 'flex', gap: '10px' }}>
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
