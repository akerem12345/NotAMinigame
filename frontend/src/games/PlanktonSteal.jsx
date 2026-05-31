import React, { useState, useEffect, useRef } from 'react';
import '../index.css';

// Web Audio API Speech Synthesizer for Animal Crossing voices
let audioCtx = null;

const initAudio = () => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  } catch (e) {
    console.warn("Failed to initialize AudioContext:", e);
  }
};

const playSpeechBlip = (char, speaker) => {
  if (!audioCtx) return;
  // Don't play sound for whitespace or punctuation (adds natural rhythm)
  if (/\s|[.,\/#!$%\^&\*;:{}=\-_`~()?]/.test(char)) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    let baseFreq = 300;
    let type = 'sine';
    let duration = 0.055; // short retro blip

    // Configure distinct vocal profiles per character
    if (speaker === 'plankton') {
      // Plankton: tiny, slightly high-pitched, triangle wave for retro feel
      baseFreq = 360 + Math.random() * 60;
      type = 'triangle';
      duration = 0.05;
    } else if (speaker === 'krabs') {
      // Mr. Krabs: very deep, hearty growl, sawtooth wave
      baseFreq = 85 + Math.random() * 20;
      type = 'sawtooth';
      duration = 0.085;
    } else if (speaker === 'spongebob') {
      // SpongeBob: high, bouncy, whistle-like sine wave
      baseFreq = 480 + Math.random() * 100;
      type = 'sine';
      duration = 0.05;
    }

    // Vowel modulation: make vowels slightly higher pitched for speech cadence
    if (/[aeiouAEIOU]/.test(char)) {
      baseFreq *= 1.25;
    }

    osc.type = type;
    osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);

    // Apply cute pitch sweeps to emulate phonemes
    if (speaker === 'spongebob') {
      // SpongeBob: bubbly pitch sweeps
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, audioCtx.currentTime + duration * 0.6);
    } else if (speaker === 'plankton') {
      // Plankton: squeaky sweep down
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, audioCtx.currentTime + duration);
    } else if (speaker === 'krabs') {
      // Mr. Krabs: heavy downward slide
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.8, audioCtx.currentTime + duration);
    }

    // High quality volume envelope to avoid clicking sounds
    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    // Lower volume for sawtooth to prevent deafening
    const peakVolume = speaker === 'krabs' ? 0.12 : 0.15;
    gain.gain.linearRampToValueAtTime(peakVolume, audioCtx.currentTime + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio Context playback error:", e);
  }
};

const PlanktonSteal = ({ onBack }) => {
  // Game state: 'start', 'scene-1', 'scene-2', 'counter'
  const [scene, setScene] = useState('start');
  const [isFading, setIsFading] = useState(false);
  const [fadeColor, setFadeColor] = useState('black');

  // Scene dialogue sub-steps
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  // Character movement states
  const [planktonSlideLeft, setPlanktonSlideLeft] = useState(false);
  const [goodGuysSlideIn, setGoodGuysSlideIn] = useState(false);

  // References for typing interval
  const typingTimer = useRef(null);

  // Dialog dialogues config
  const scene1Text = "time to steal the formula";
  const scene2Dialogues = [
    { speaker: 'plankton', text: "HAHA" },
    { speaker: 'plankton', text: "I have finaly have the formula" },
    { speaker: 'plankton', text: "I can finally make krabby patties" },
    { speaker: 'both', text: "OH NOOO" } // after Plankton slides out and Krabs/Spongebob slide in
  ];

  // Helper to type out dialogue text with sounds
  const typeText = (text, speaker, speed = 40) => {
    clearInterval(typingTimer.current);
    setDisplayText('');
    setIsTyping(true);
    let index = 0;
    
    typingTimer.current = setInterval(() => {
      if (index < text.length) {
        const char = text.charAt(index);
        setDisplayText((prev) => prev + char);
        playSpeechBlip(char, speaker === 'both' ? (index % 2 === 0 ? 'krabs' : 'spongebob') : speaker);
        index++;
      } else {
        clearInterval(typingTimer.current);
        setIsTyping(false);
      }
    }, speed);
  };

  // Stop typing on unmount
  useEffect(() => {
    return () => clearInterval(typingTimer.current);
  }, []);

  // Handle scene state transitions with high-reliability double timeout
  const transitionTo = (newScene, delay = 600) => {
    setIsFading(true);
    setFadeColor('black');
    setTimeout(() => {
      setScene(newScene);
      // Briefly wait for DOM updates to complete before fading back in
      setTimeout(() => {
        setIsFading(false);
      }, 50);
    }, delay);
  };

  // Start the adventure
  const handleStartGame = () => {
    initAudio();
    transitionTo('scene-1');
  };

  // Scene 1 initiation
  useEffect(() => {
    if (scene === 'scene-1') {
      setShowBubble(false);
      setDisplayText('');
      // Text bubble appears after 1.5 seconds
      const timer = setTimeout(() => {
        setShowBubble(true);
        typeText(scene1Text, 'plankton', 50);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [scene]);

  // Click on screen handler during dialogue scenes
  const handleScreenClick = () => {
    // If still typing, skip to the end of the current text line
    if (isTyping) {
      clearInterval(typingTimer.current);
      setIsTyping(false);
      if (scene === 'scene-1') {
        setDisplayText(scene1Text);
      } else if (scene === 'scene-2') {
        const currentLine = scene2Dialogues[dialogueIndex];
        setDisplayText(currentLine.text);
      }
      return;
    }

    if (scene === 'scene-1') {
      // Scene 1 complete -> Fade to Scene 2
      setShowBubble(false);
      transitionTo('scene-2');
      setDialogueIndex(0);
    } else if (scene === 'scene-2') {
      // Scene 2 logic steps
      if (dialogueIndex === 0) {
        // HAHA finished -> Next line
        setDialogueIndex(1);
      } else if (dialogueIndex === 1) {
        // I have finally have the formula finished -> Next line
        setDialogueIndex(2);
      } else if (dialogueIndex === 2) {
        // I can finally make krabby patties finished -> Plankton slides left and disappears
        setShowBubble(false);
        setPlanktonSlideLeft(true);
        
        // Plankton slides out (takes 1.2s), then Mr. Krabs and Spongebob slide in
        setTimeout(() => {
          setGoodGuysSlideIn(true);
          // Wait for their entrance animation to settle (1.2s), then they speak
          setTimeout(() => {
            setDialogueIndex(3);
            setShowBubble(true);
          }, 1200);
        }, 1200);
      } else if (dialogueIndex === 3) {
        // "OH NOOO" finished -> Fade to counter
        setShowBubble(false);
        transitionTo('counter', 1200);
      }
    }
  };

  // Monitor dialogue index changes in Scene 2 to trigger typewriter lines
  useEffect(() => {
    if (scene === 'scene-2') {
      if (dialogueIndex <= 2) {
        setShowBubble(true);
        const currentLine = scene2Dialogues[dialogueIndex];
        typeText(currentLine.text, currentLine.speaker, 45);
      } else if (dialogueIndex === 3) {
        setShowBubble(true);
        const currentLine = scene2Dialogues[dialogueIndex];
        typeText(currentLine.text, currentLine.speaker, 80); // slow, dramatic "OH NOOO"
      }
    }
  }, [dialogueIndex, scene]);

  // Restart the whole cutscene
  const handleRestart = () => {
    setIsFading(true);
    setFadeColor('black');
    setTimeout(() => {
      // Reset all game elements
      setScene('start');
      setDialogueIndex(0);
      setDisplayText('');
      setShowBubble(false);
      setPlanktonSlideLeft(false);
      setGoodGuysSlideIn(false);
      setIsFading(false);
    }, 1000);
  };

  return (
    <div className="plankton-game-container">
      {/* Dynamic Scoped CSS Stylesheet */}
      <style>{`
        .plankton-game-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 999;
          font-family: 'Outfit', 'Comic Sans MS', sans-serif;
          overflow: hidden;
          background: #000;
          user-select: none;
        }

        .plankton-game-board {
          width: 100%;
          height: 100%;
          position: relative;
          background-position: center;
          background-size: cover;
          background-repeat: no-repeat;
          transition: background-image 0.5s ease-in-out;
        }

        /* Screen States Backgrounds */
        .board-start {
          background-image: url('/resources/images/menu.jpeg');
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .board-scene-1 {
          background-image: url('/resources/images/scene-1.jpg');
          cursor: pointer;
        }

        .board-scene-2 {
          background-image: url('/resources/images/scene-2.jpg');
          cursor: pointer;
        }

        .board-counter {
          background-image: url('/resources/images/counter.jpg');
        }

        /* Overlay black fade */
        .scene-fade-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: black;
          z-index: 99;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.5s ease-in-out;
        }

        .scene-fade-overlay.fading {
          opacity: 1;
        }

        /* HUD & Controls */
        .plankton-back-btn {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 50%;
          width: 50px;
          height: 50px;
          font-size: 1.5rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          z-index: 100;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
        }

        .plankton-back-btn:hover {
          border-color: #ff8c00;
          color: #ff8c00;
          transform: scale(1.1);
          box-shadow: 0 0 15px rgba(255, 140, 0, 0.6);
        }

        /* Start screen UI */
        .start-screen-panel {
          background: rgba(0, 5, 25, 0.65);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 3px solid #ff8c00;
          box-shadow: 0 0 35px rgba(255, 140, 0, 0.4), inset 0 0 20px rgba(255, 140, 0, 0.2);
          border-radius: 24px;
          padding: 3rem;
          text-align: center;
          max-width: 550px;
          width: 90%;
          animation: popInBounce 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .start-title {
          font-size: 3.2rem;
          font-weight: 900;
          margin-bottom: 0.8rem;
          letter-spacing: 2px;
          background: linear-gradient(135deg, #ffa500, #ff4500);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(0 2px 8px rgba(0,0,0,0.8));
          text-transform: uppercase;
        }

        .start-subtitle {
          font-size: 1.1rem;
          color: #e0e0f0;
          margin-bottom: 2.2rem;
          line-height: 1.6;
          text-shadow: 0 2px 4px rgba(0,0,0,0.6);
        }

        .orange-start-btn {
          background: linear-gradient(135deg, #ffa500, #ff5500);
          color: white;
          border: none;
          padding: 18px 45px;
          font-size: 1.4rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 2px;
          border-radius: 40px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: 0 6px 20px rgba(255, 85, 0, 0.5), 0 0 0 4px rgba(255, 165, 0, 0.2);
          position: relative;
          overflow: hidden;
        }

        .orange-start-btn:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 10px 25px rgba(255, 85, 0, 0.7), 0 0 15px rgba(255, 165, 0, 0.5);
        }

        .orange-start-btn:active {
          transform: translateY(2px) scale(0.98);
        }

        /* Sprite & Characters Positioning */
        .character-sprite {
          position: absolute;
          background-position: center;
          background-size: contain;
          background-repeat: no-repeat;
          z-index: 10;
        }

        /* Plankton Scene 1: Stealing */
        .plankton-steal-s1 {
          width: 260px;
          height: 260px;
          bottom: 12%;
          left: 50%;
          transform: translateX(-50%);
          background-image: url('/resources/images/steal.png');
          animation: breathing 2s ease-in-out infinite alternate;
        }

        /* Plankton Scene 2: Holding the formula */
        .plankton-steal-s2 {
          width: 300px;
          height: 300px;
          bottom: 14%;
          left: 22%;
          background-image: url('/resources/images/aftersteal.png');
          transition: transform 1.2s cubic-bezier(0.6, -0.28, 0.735, 0.045), opacity 1.2s ease-out;
          animation: fastBreathing 1.2s ease-in-out infinite alternate;
        }

        .plankton-steal-s2.slide-left {
          transform: translateX(-200%) rotate(-15deg);
          opacity: 0;
        }

        /* Good guys: Mr Krabs and Spongebob */
        .krabs-sprite {
          width: 320px;
          height: 320px;
          bottom: 12%;
          right: -400px;
          background-image: url('/resources/images/afterstealmrcrab.png');
          transition: right 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: heavyBobbing 2.5s ease-in-out infinite alternate;
        }

        .spongebob-sprite {
          width: 340px;
          height: 340px;
          bottom: 10%;
          right: -400px;
          background-image: url('/resources/images/afterstealspongebobcrying.png');
          transition: right 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          transition-delay: 0.15s;
          animation: cryShaking 0.15s linear infinite;
        }

        .krabs-sprite.slide-in {
          right: 32%;
        }

        .spongebob-sprite.slide-in {
          right: 5%;
        }

        /* Dialogue Box / Bubble styling */
        .dialogue-bubble-container {
          position: absolute;
          bottom: 6%;
          left: 50%;
          transform: translateX(-50%);
          width: 85%;
          max-width: 800px;
          background: rgba(255, 255, 255, 0.96);
          border: 5px solid #222;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4), inset 0 0 10px rgba(0,0,0,0.05);
          border-radius: 25px;
          padding: 24px 32px;
          z-index: 30;
          display: flex;
          flex-direction: column;
          animation: bubbleBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .speaker-badge {
          align-self: flex-start;
          font-weight: 900;
          font-size: 1.1rem;
          color: white;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 12px;
          margin-bottom: 10px;
          border: 3px solid #222;
          letter-spacing: 1px;
          box-shadow: 0 4px 0 #222;
        }

        .speaker-plankton {
          background: #2e7d32;
        }

        .speaker-krabs {
          background: #d32f2f;
        }

        .speaker-spongebob {
          background: #fbc02d;
          color: #222;
        }

        .speaker-both {
          background: linear-gradient(90deg, #d32f2f, #fbc02d);
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.8);
        }

        .dialogue-text {
          font-size: 1.6rem;
          color: #222;
          font-weight: 700;
          line-height: 1.4;
          text-align: left;
        }

        .click-arrow {
          position: absolute;
          bottom: 15px;
          right: 25px;
          font-size: 1.2rem;
          color: #ff8c00;
          animation: bounceArrow 0.8s infinite alternate;
        }

        /* Counter View / Victory Panel */
        .success-panel {
          background: rgba(0, 5, 20, 0.8);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 4px solid #39ff14;
          box-shadow: 0 0 40px rgba(57, 255, 20, 0.5), inset 0 0 25px rgba(57, 255, 20, 0.2);
          border-radius: 28px;
          padding: 3rem 2rem;
          max-width: 600px;
          width: 90%;
          text-align: center;
          margin: auto;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          animation: popInSuccess 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
          z-index: 20;
        }

        .success-title {
          font-size: 3.4rem;
          font-weight: 900;
          color: #39ff14;
          text-shadow: 0 0 15px rgba(57, 255, 20, 0.6), 0 3px 0 #1b5e20;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 2px;
        }

        .success-subtitle {
          font-size: 1.4rem;
          font-weight: 600;
          color: #ffa500;
          margin-bottom: 1.5rem;
          text-transform: uppercase;
          text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }

        .success-desc {
          font-size: 1.05rem;
          color: #ccd1e0;
          line-height: 1.6;
          margin-bottom: 2.2rem;
        }

        .interactive-patty-jar {
          width: 130px;
          height: 130px;
          margin: 0 auto 2.2rem;
          background: rgba(255, 255, 255, 0.08);
          border: 2px dashed rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
        }

        .interactive-patty-jar:hover {
          background: rgba(57, 255, 20, 0.15);
          border-color: #39ff14;
          transform: rotate(15deg) scale(1.1);
          box-shadow: 0 0 25px rgba(57, 255, 20, 0.3);
        }

        .patty-jar-icon {
          font-size: 4rem;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.5));
          animation: floatJar 3s ease-in-out infinite alternate;
        }

        .formula-found-tooltip {
          position: absolute;
          top: -35px;
          background: #39ff14;
          color: black;
          font-weight: 800;
          font-size: 0.85rem;
          padding: 4px 10px;
          border-radius: 8px;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          animation: popUp 0.3s ease-out;
        }

        .button-group {
          display: flex;
          justify-content: center;
          gap: 1.2rem;
        }

        .success-btn {
          border: none;
          padding: 14px 28px;
          font-size: 1.05rem;
          font-weight: 700;
          text-transform: uppercase;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-replay {
          background: #ffa500;
          color: black;
        }

        .btn-replay:hover {
          background: #ffb732;
          box-shadow: 0 0 15px rgba(255, 165, 0, 0.5);
          transform: translateY(-2px);
        }

        .btn-exit {
          background: transparent;
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.4);
        }

        .btn-exit:hover {
          border-color: #ff3366;
          color: #ff3366;
          box-shadow: 0 0 15px rgba(255, 51, 102, 0.3);
          transform: translateY(-2px);
        }

        /* Animations Keyframes */
        @keyframes popInBounce {
          from { opacity: 0; transform: scale(0.7) translateY(50px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes popInSuccess {
          from { opacity: 0; transform: translate(-50%, -30%) scale(0.85); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }

        @keyframes bubbleBounce {
          from { opacity: 0; transform: translateX(-50%) translateY(30px) scale(0.9); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        @keyframes breathing {
          from { transform: translateX(-50%) scale(1); }
          to { transform: translateX(-50%) scale(1.04) translateY(-3px); }
        }

        @keyframes fastBreathing {
          from { transform: scale(1); }
          to { transform: scale(1.06) translateY(-4px); }
        }

        @keyframes heavyBobbing {
          from { transform: translateY(0); }
          to { transform: translateY(-8px); }
        }

        @keyframes cryShaking {
          0% { transform: translate(1px, 1px) rotate(0deg); }
          10% { transform: translate(-1px, -2px) rotate(-1deg); }
          20% { transform: translate(-3px, 0px) rotate(1deg); }
          30% { transform: translate(0px, 2px) rotate(0deg); }
          40% { transform: translate(1px, -1px) rotate(1deg); }
          50% { transform: translate(-1px, 2px) rotate(-1deg); }
          60% { transform: translate(-3px, 1px) rotate(0deg); }
          70% { transform: translate(2px, 1px) rotate(-1deg); }
          80% { transform: translate(-1px, -1px) rotate(1deg); }
          90% { transform: translate(2px, 2px) rotate(0deg); }
          100% { transform: translate(1px, -2px) rotate(-1deg); }
        }

        @keyframes bounceArrow {
          from { transform: translateY(0); }
          to { transform: translateY(8px); }
        }

        @keyframes bounceArrow {
          from { transform: translateY(0); }
          to { transform: translateY(6px); }
        }

        @keyframes floatJar {
          from { transform: translateY(0px); }
          to { transform: translateY(-8px); }
        }

        @keyframes popUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Main Game Board */}
      <div className={`plankton-game-board board-${scene}`} onClick={scene !== 'start' && scene !== 'counter' ? handleScreenClick : undefined}>
        {/* Black Scene Transition Overlay */}
        <div className={`scene-fade-overlay ${isFading ? 'fading' : ''}`} />

        {/* Global Exit/Back to Menu Button */}
        <button className="plankton-back-btn" onClick={onBack} title="Exit to Main Menu">←</button>

        {/* Scene 1: Start Screen */}
        {scene === 'start' && (
          <div className="start-screen-panel">
            <h1 className="start-title">Plankton's Plan</h1>
            <p className="start-subtitle">
              He has planned this for years. Help Sheldon J. Plankton steal the secret Krabby Patty formula and escape the Krusty Krab!
            </p>
            <button className="orange-start-btn" onClick={handleStartGame}>
              Start Mission
            </button>
          </div>
        )}

        {/* Scene 2: Krusty Krab Interior */}
        {scene === 'scene-1' && (
          <div className="character-sprite plankton-steal-s1" />
        )}

        {/* Scene 3: Mr. Krabs' Office */}
        {scene === 'scene-2' && (
          <>
            {/* Plankton sprite */}
            <div className={`character-sprite plankton-steal-s2 ${planktonSlideLeft ? 'slide-left' : ''}`} />

            {/* Mr. Krabs and Spongebob sprites */}
            <div className={`character-sprite krabs-sprite ${goodGuysSlideIn ? 'slide-in' : ''}`} />
            <div className={`character-sprite spongebob-sprite ${goodGuysSlideIn ? 'slide-in' : ''}`} />
          </>
        )}

        {/* Dialogue Bubble Box Overlay */}
        {showBubble && (scene === 'scene-1' || scene === 'scene-2') && (
          <div className="dialogue-bubble-container" onClick={(e) => {
            // Let the board click handler handle it, but prevent bubbling glitches
            e.stopPropagation();
            handleScreenClick();
          }}>
            {/* Dynamic Speaker Badge */}
            {scene === 'scene-1' && (
              <div className="speaker-badge speaker-plankton">Plankton</div>
            )}

            {scene === 'scene-2' && (
              <div className={`speaker-badge speaker-${scene2Dialogues[dialogueIndex]?.speaker}`}>
                {scene2Dialogues[dialogueIndex]?.speaker === 'both' ? 'Krabs & Spongebob' : scene2Dialogues[dialogueIndex]?.speaker}
              </div>
            )}

            {/* Typing text area */}
            <div className="dialogue-text">
              {displayText}
            </div>

            {/* Bouncing cursor prompts the user to click when typing completes */}
            {!isTyping && <div className="click-arrow">▼</div>}
          </div>
        )}

        {/* Scene 4: The Counter / Victory Screen */}
        {scene === 'counter' && (
          <SuccessPanel onReplay={handleRestart} onExit={onBack} />
        )}
      </div>
    </div>
  );
};

// Extracted interactive victory/success screen
const SuccessPanel = ({ onReplay, onExit }) => {
  const [clickCount, setClickCount] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleJarClick = () => {
    initAudio();
    setClickCount((prev) => prev + 1);
    setShowTooltip(true);

    // Play a happy synthesizer chime
    if (audioCtx) {
      const notes = [261.63, 329.63, 392.00, 523.25]; // C major arpeggio
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.001, audioCtx.currentTime + idx * 0.08);
        gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + idx * 0.08 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.2);

        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.25);
      });
    }

    setTimeout(() => {
      setShowTooltip(false);
    }, 1500);
  };

  return (
    <div className="success-panel">
      <h1 className="success-title">Mission Complete!</h1>
      <h2 className="success-subtitle">The Formula is Secured!</h2>
      <p className="success-desc">
        Plankton has successfully slipped out of the Krusty Krab with the secret Krabby Patty recipe! 
        He is already cooking up a storm back at the Chum Bucket.
      </p>

      {/* Interactive Patty Jar Jar */}
      <div className="interactive-patty-jar" onClick={handleJarClick} title="Click the formula jar!">
        <div className="patty-jar-icon">🧪</div>
        {showTooltip && (
          <div className="formula-found-tooltip">
            {clickCount === 1 ? "Formula Secured!" : `Tapped ${clickCount} times!`}
          </div>
        )}
      </div>

      <div className="button-group">
        <button className="success-btn btn-replay" onClick={onReplay}>
          🔄 Replay Cutscene
        </button>
        <button className="success-btn btn-exit" onClick={onExit}>
          🚪 Back to Games
        </button>
      </div>
    </div>
  );
};

export default PlanktonSteal;
