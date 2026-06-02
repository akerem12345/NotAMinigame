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

// Play retro pitch-modulated voice blips
const playSpeechBlip = (char, speaker) => {
  if (!audioCtx) return;
  if (/\s|[.,\/#!$%\^&\*;:{}=\-_`~()?]/.test(char)) return;

  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    let baseFreq = 300;
    let type = 'sine';
    let duration = 0.055;

    if (speaker === 'plankton') {
      baseFreq = 360 + Math.random() * 60;
      type = 'triangle';
      duration = 0.05;
    } else if (speaker === 'krabs') {
      baseFreq = 85 + Math.random() * 20;
      type = 'sawtooth';
      duration = 0.085;
    } else if (speaker === 'spongebob') {
      baseFreq = 480 + Math.random() * 100;
      type = 'sine';
      duration = 0.05;
    }

    if (/[aeiouAEIOU]/.test(char)) {
      baseFreq *= 1.25;
    }

    osc.type = type;
    osc.frequency.setValueAtTime(baseFreq, audioCtx.currentTime);

    if (speaker === 'spongebob') {
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.4, audioCtx.currentTime + duration * 0.6);
    } else if (speaker === 'plankton') {
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.75, audioCtx.currentTime + duration);
    } else if (speaker === 'krabs') {
      osc.frequency.linearRampToValueAtTime(baseFreq * 0.8, audioCtx.currentTime + duration);
    }

    gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
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
  // Game screen scenes: 'start', 'scene-1', 'scene-2', 'counter-active', 'kitchen-active', 'game-over'
  const [scene, setScene] = useState('start');
  const [isFading, setIsFading] = useState(false);

  // Prologue dialogue sub-steps
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showBubble, setShowBubble] = useState(false);

  // Character movement states for cutscenes
  const [planktonSlideLeft, setPlanktonSlideLeft] = useState(false);
  const [goodGuysSlideIn, setGoodGuysSlideIn] = useState(false);

  // SpongeBob Bubble Screen Transition States
  const [showBubbleTransition, setShowBubbleTransition] = useState(false);
  const [bubbles, setBubbles] = useState([]);

  // --- Cooking Simulation States ---
  const [customerRound, setCustomerRound] = useState(1); // 1, 2, or 3
  const [customerImg, setCustomerImg] = useState('/resources/images/customer1.png');
  const [customerEntered, setCustomerEntered] = useState(false);
  const [customerSpeechVisible, setCustomerSpeechVisible] = useState(false);
  const [customerOrder, setCustomerOrder] = useState({ burger: false, fries: false, drink: false });
  const [orderText, setOrderText] = useState('');
  
  // Tracking if a serving action occurred to show post-round conversation ('none', 'success', 'timeout', 'mismatch')
  const [servingOutcome, setServingOutcome] = useState('none');

  // 90-second round countdown timer
  const [gameTimer, setGameTimer] = useState(90);
  const [isTimerActive, setIsTimerActive] = useState(false);

  // Scoreboard
  const [score, setScore] = useState(0);
  const [servedSuccessCount, setServedSuccessCount] = useState(0);
  const [roundLogs, setRoundLogs] = useState([]); // tracks customer outcomes

  // Burger Station States
  // Grill Slot: { id: number, status: 'empty' | 'raw' | 'cooked' | 'burned', progress: number }
  const [grillPatties, setGrillPatties] = useState([
    { id: 1, status: 'empty', progress: 0 },
    { id: 2, status: 'empty', progress: 0 }
  ]);
  const [cookedPattiesCount, setCookedPattiesCount] = useState(0); // number of cooked patties in holding tray
  const [plateIngredients, setPlateIngredients] = useState([]); // Stack of currently placed toppings
  const [plateNotification, setPlateNotification] = useState(''); // validation alerts

  // Fries Station States
  const [fryerStatus, setFryerStatus] = useState('empty'); // 'empty', 'frying', 'cooked'
  const [fryerProgress, setFryerProgress] = useState(0); // 0 to 5 seconds
  const [fryBagStatus, setFryBagStatus] = useState('empty'); // 'empty', 'filled'

  // Drink Station States
  const [drinkCup, setDrinkCup] = useState('none'); // 'none', 'empty', 'filling', 'filled', 'completed'
  const [drinkProgress, setDrinkProgress] = useState(0); // 0 to 2 seconds

  // Serving Tray Prepared Items
  const [trayItems, setTrayItems] = useState({ burger: false, fries: false, drink: false });
  const [kitchenAlert, setKitchenAlert] = useState('');

  // References
  const typingTimer = useRef(null);
  const gameTimerInterval = useRef(null);
  const grillInterval = useRef(null);
  const fryerInterval = useRef(null);
  const drinkInterval = useRef(null);
  const bgMusicRef = useRef(null);

  const playBackgroundMusic = () => {
    if (!bgMusicRef.current) {
      bgMusicRef.current = new Audio('/resources/sound/clownfish.mp3');
      bgMusicRef.current.loop = true;
      bgMusicRef.current.volume = 0.4;
    }
    bgMusicRef.current.play().catch((e) => {
      console.warn("Failed to play background music:", e);
    });
  };

  const scene1Text = "time to steal the formula";
  const scene2Dialogues = [
    { speaker: 'plankton', text: "HAHA" },
    { speaker: 'plankton', text: "I have finaly have the formula" },
    { speaker: 'plankton', text: "I can finally make krabby patties" },
    { speaker: 'both', text: "OH NOOO" }
  ];

  // Helper to type out dialogue text with retro blips
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

  // Stop all intervals and music on unmount
  useEffect(() => {
    return () => {
      clearInterval(typingTimer.current);
      clearInterval(gameTimerInterval.current);
      clearInterval(grillInterval.current);
      clearInterval(fryerInterval.current);
      clearInterval(drinkInterval.current);
      if (bgMusicRef.current) {
        bgMusicRef.current.pause();
        bgMusicRef.current = null;
      }
    };
  }, []);

  // Handle cutscene transitions
  const transitionTo = (newScene, delay = 600) => {
    setIsFading(true);
    setTimeout(() => {
      setScene(newScene);
      setTimeout(() => {
        setIsFading(false);
      }, 50);
    }, delay);
  };

  // Trigger bubble transition (SpongeBob visual transition)
  const triggerBubbleTransition = (onMidpoint) => {
    initAudio();
    // Generate 45 randomized bubbles with varied scale and speeds
    const newBubbles = Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 25 + Math.random() * 55,
      delay: Math.random() * 0.7,
      sway: 15 + Math.random() * 25,
      speed: 1.1 + Math.random() * 0.7
    }));
    setBubbles(newBubbles);
    setShowBubbleTransition(true);

    // Bubbly chime sound arpeggio
    if (audioCtx) {
      for (let k = 0; k < 6; k++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(550 + k * 140 + Math.random() * 80, audioCtx.currentTime + k * 0.08);
        gain.gain.setValueAtTime(0.001, audioCtx.currentTime + k * 0.08);
        gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + k * 0.08 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + k * 0.08 + 0.12);
        osc.start(audioCtx.currentTime + k * 0.08);
        osc.stop(audioCtx.currentTime + k * 0.08 + 0.18);
      }
    }

    // Midway block: swap visual scene while screen is packed with bubbles
    setTimeout(() => {
      onMidpoint();
    }, 900);

    // Clear overlay
    setTimeout(() => {
      setShowBubbleTransition(false);
    }, 2000);
  };

  // Start game from title
  const handleStartGame = () => {
    initAudio();
    transitionTo('scene-1');
  };

  // Scene 1 initiation
  useEffect(() => {
    if (scene === 'scene-1') {
      setShowBubble(false);
      setDisplayText('');
      const timer = setTimeout(() => {
        setShowBubble(true);
        typeText(scene1Text, 'plankton', 50);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [scene]);

  // Click handler during cutscenes
  const handleScreenClick = () => {
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
      setShowBubble(false);
      transitionTo('scene-2');
      setDialogueIndex(0);
    } else if (scene === 'scene-2') {
      if (dialogueIndex === 0) {
        setDialogueIndex(1);
      } else if (dialogueIndex === 1) {
        setDialogueIndex(2);
      } else if (dialogueIndex === 2) {
        setShowBubble(false);
        setPlanktonSlideLeft(true);
        setTimeout(() => {
          setGoodGuysSlideIn(true);
          setTimeout(() => {
            setDialogueIndex(3);
            setShowBubble(true);
          }, 1200);
        }, 1200);
      } else if (dialogueIndex === 3) {
        setShowBubble(false);
        // Start the gameplay counter scene loop!
        startCustomerRound(1);
      }
    }
  };

  // Monitor dialogue progression in Scene 2
  useEffect(() => {
    if (scene === 'scene-2') {
      if (dialogueIndex <= 2) {
        setShowBubble(true);
        const currentLine = scene2Dialogues[dialogueIndex];
        typeText(currentLine.text, currentLine.speaker, 45);
      } else if (dialogueIndex === 3) {
        setShowBubble(true);
        const currentLine = scene2Dialogues[dialogueIndex];
        typeText(currentLine.text, currentLine.speaker, 80);
      }
    }
  }, [dialogueIndex, scene]);

  // --- Cooking Gameplay Logic ---

  // Initiate a new customer round
  const startCustomerRound = (roundNumber) => {
    if (roundNumber === 1) {
      playBackgroundMusic();
    }
    setCustomerRound(roundNumber);
    setCustomerEntered(false);
    setCustomerSpeechVisible(false);
    setServingOutcome('none');
    setDisplayText('');

    // Select customer image based on round
    setCustomerImg(`/resources/images/customer${roundNumber}.png`);

    // Generate random order: at least one true, up to all three
    let order = { burger: false, fries: false, drink: false };
    while (!order.burger && !order.fries && !order.drink) {
      order = {
        burger: Math.random() > 0.4,
        fries: Math.random() > 0.4,
        drink: Math.random() > 0.4
      };
    }
    setCustomerOrder(order);

    // Format text description of order
    const items = [];
    if (order.burger) items.push("a Krabby Patty");
    if (order.fries) items.push("some crispy Kelp Fries");
    if (order.drink) items.push("a refreshing Seafoam Soda");
    
    let text = "Can I get ";
    if (items.length === 1) text += items[0] + "?";
    else if (items.length === 2) text += `${items[0]} and ${items[1]}?`;
    else text += `${items[0]}, ${items[1]}, and ${items[2]}?`;
    setOrderText(text);

    // Reset kitchen stations for the new order
    resetKitchenPrep();

    // Transition visually to counter
    transitionTo('counter-active');
  };

  // Customer entrance and speech trigger
  useEffect(() => {
    if (scene === 'counter-active' && servingOutcome === 'none') {
      // Customer enters after 3 seconds
      const enterTimer = setTimeout(() => {
        setCustomerEntered(true);
        initAudio();
        
        // Play customer welcome sound
        if (audioCtx) {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(customerRound === 1 ? 220 : customerRound === 2 ? 180 : 280, audioCtx.currentTime);
          gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
          osc.start();
          osc.stop(audioCtx.currentTime + 0.2);
        }

        // Type out the order speech bubble after entrance
        setTimeout(() => {
          setCustomerSpeechVisible(true);
          const speaker = customerRound === 1 ? 'spongebob' : customerRound === 2 ? 'krabs' : 'plankton';
          typeText(orderText, speaker, 35);
        }, 800);

      }, 3000);

      return () => clearTimeout(enterTimer);
    }
  }, [scene, customerRound, orderText, servingOutcome]);

  // Dialogue for successful serving
  const getThanksText = () => {
    if (customerRound === 1) return "Thank you! That looks delicious! Undersea perfection! 🧽";
    if (customerRound === 2) return "Ah, thank you! A fine meal fit for a sailor! 🦀";
    return "Outstanding! Plankton's cooking is simply superior! 👁️";
  };

  // Click on customer dialogue bubble triggers bubble transition to kitchen
  const handleCustomerSpeechClick = () => {
    if (isTyping) {
      clearInterval(typingTimer.current);
      setIsTyping(false);
      
      if (servingOutcome === 'success') {
        setDisplayText(getThanksText());
      } else if (servingOutcome === 'timeout') {
        setDisplayText("The service is too slow! I'm out of here! 😡");
      } else if (servingOutcome === 'mismatch') {
        setDisplayText("This is NOT what I ordered! I'm leaving! 🤮");
      } else {
        setDisplayText(orderText);
      }
      return;
    }

    if (servingOutcome !== 'none') {
      // Clear serving outcome and advance customer index
      setServingOutcome('none');
      
      triggerBubbleTransition(() => {
        if (customerRound === 3) {
          setScene('game-over');
        } else {
          startCustomerRound(customerRound + 1);
        }
      });
      return;
    }

    // Standard order speech bubble click -> goes to kitchen
    triggerBubbleTransition(() => {
      setScene('kitchen-active');
      setGameTimer(90); // 90 second round timer starts
      setIsTimerActive(true);
    });
  };

  // Reset prep benches
  const resetKitchenPrep = () => {
    setGrillPatties([
      { id: 1, status: 'empty', progress: 0 },
      { id: 2, status: 'empty', progress: 0 }
    ]);
    setCookedPattiesCount(0);
    setPlateIngredients([]);
    setPlateNotification('');
    setFryerStatus('empty');
    setFryerProgress(0);
    setFryBagStatus('empty');
    setDrinkCup('none');
    setDrinkProgress(0);
    setTrayItems({ burger: false, fries: false, drink: false });
    setKitchenAlert('');
  };

  // Active kitchen countdown timer effect
  useEffect(() => {
    if (isTimerActive && scene === 'kitchen-active') {
      gameTimerInterval.current = setInterval(() => {
        setGameTimer((prev) => {
          if (prev <= 1) {
            // Out of time! Round failure
            clearInterval(gameTimerInterval.current);
            handleServingOutcome(false, true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(gameTimerInterval.current);
  }, [isTimerActive, scene]);

  // Kitchen operations: Burger Grill Interval (ticks every 0.5s for smoother progress bar)
  useEffect(() => {
    if (scene === 'kitchen-active') {
      grillInterval.current = setInterval(() => {
        setGrillPatties((prevPatties) =>
          prevPatties.map((patty) => {
            if (patty.status === 'empty') return patty;

            const nextProgress = patty.progress + 0.5;
            let nextStatus = patty.status;

            if (nextProgress >= 20) {
              nextStatus = 'burned';
            } else if (nextProgress >= 10) {
              nextStatus = 'cooked';
            }

            return { ...patty, progress: nextProgress, status: nextStatus };
          })
        );
      }, 500);
    }
    return () => clearInterval(grillInterval.current);
  }, [scene]);

  // Kitchen operations: Fryer Interval (ticks every 0.5s)
  useEffect(() => {
    if (scene === 'kitchen-active' && fryerStatus === 'frying') {
      fryerInterval.current = setInterval(() => {
        setFryerProgress((prev) => {
          if (prev >= 5) {
            clearInterval(fryerInterval.current);
            setFryerStatus('cooked');
            playCookingSound('ting');
            return 5;
          }
          return prev + 0.5;
        });
      }, 500);
    }
    return () => clearInterval(fryerInterval.current);
  }, [scene, fryerStatus]);

  // Kitchen operations: Drink Pour Fountain Interval (ticks every 0.2s)
  useEffect(() => {
    if (scene === 'kitchen-active' && drinkCup === 'filling') {
      drinkInterval.current = setInterval(() => {
        setDrinkProgress((prev) => {
          if (prev >= 2) {
            clearInterval(drinkInterval.current);
            setDrinkCup('filled');
            playCookingSound('sip');
            return 2;
          }
          return prev + 0.2;
        });
      }, 200);
    }
    return () => clearInterval(drinkInterval.current);
  }, [scene, drinkCup]);

  // Helper sound effects for cooking events
  const playCookingSound = (type) => {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'sizzle') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 40, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      } else if (type === 'ting') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      } else if (type === 'sip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      } else if (type === 'trash') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
      }
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
    } catch (e) {}
  };

  // --- GRILL INTERACTIONS ---
  const handlePlacePattyOnGrill = (slotId) => {
    initAudio();
    setGrillPatties((prev) =>
      prev.map((patty) => {
        if (patty.id === slotId && patty.status === 'empty') {
          playCookingSound('sizzle');
          return { ...patty, status: 'raw', progress: 0 };
        }
        return patty;
      })
    );
  };

  const handlePickPattyFromGrill = (slotId) => {
    initAudio();
    const targetPatty = grillPatties.find((p) => p.id === slotId);
    if (!targetPatty || targetPatty.status === 'empty') return;

    if (targetPatty.status === 'raw') {
      setPlateNotification("That patty is still raw! Let it cook first.");
      setTimeout(() => setPlateNotification(''), 2500);
      return;
    }

    if (targetPatty.status === 'burned') {
      playCookingSound('trash');
      setGrillPatties((prev) =>
        prev.map((p) => (p.id === slotId ? { ...p, status: 'empty', progress: 0 } : p))
      );
      setPlateNotification("Charred patty thrown in the trash!");
      setTimeout(() => setPlateNotification(''), 2500);
      return;
    }

    // Cooked patty moved to holding tray!
    setCookedPattiesCount((prev) => prev + 1);
    setGrillPatties((prev) =>
      prev.map((p) => (p.id === slotId ? { ...p, status: 'empty', progress: 0 } : p))
    );
    playCookingSound('ting');
    setPlateNotification("Cooked patty moved to holding tray!");
    setTimeout(() => setPlateNotification(''), 2000);
  };

  // --- BURGER ASSEMBLY BOARD ---
  const handleAddTopping = (topping) => {
    initAudio();
    const currentLength = plateIngredients.length;

    // Strict construction order:
    // 0: bottom bun
    // 1: cooked patty
    // 2: sliced cheese
    // 3: ketchup and mustard
    // 4: lettuce
    // 5: onion
    // 6: tomato
    // 7: top bun

    if (topping === 'bottom_bun') {
      if (currentLength > 0) {
        setPlateNotification("Bottom bun is already placed!");
        setTimeout(() => setPlateNotification(''), 2500);
        return;
      }
      setPlateIngredients(['bottom_bun']);
      return;
    }

    if (currentLength === 0) {
      setPlateNotification("Grab a bottom bun first to start!");
      setTimeout(() => setPlateNotification(''), 2500);
      return;
    }

    if (topping === 'cooked_patty') {
      if (cookedPattiesCount <= 0) {
        setPlateNotification("No cooked patties! Cook them on the grill first.");
        setTimeout(() => setPlateNotification(''), 2500);
        return;
      }
      if (currentLength !== 1) {
        setPlateNotification("Burgers need a bottom bun before placing the cooked patty!");
        setTimeout(() => setPlateNotification(''), 2500);
        return;
      }
      setCookedPattiesCount((prev) => prev - 1);
      setPlateIngredients((prev) => [...prev, 'cooked_patty']);
      setPlateNotification("Cooked patty added to the plate!");
      setTimeout(() => setPlateNotification(''), 2000);
      return;
    }

    const orderRules = [
      { step: 1, name: 'cooked_patty', label: 'Cooked Patty' },
      { step: 2, name: 'sliced_cheese', label: 'Sliced Yellow Cheese' },
      { step: 3, name: 'ketchup_mustard', label: 'Ketchup & Mustard' },
      { step: 4, name: 'lettuce', label: 'Lettuce' },
      { step: 5, name: 'onion', label: 'Sliced Onion' },
      { step: 6, name: 'tomato', label: 'Sliced Tomato' },
      { step: 7, name: 'top_bun', label: 'Top Bun' }
    ];

    const targetRule = orderRules.find((r) => r.step === currentLength);
    if (!targetRule) return;

    if (topping !== targetRule.name) {
      setPlateNotification(`Order Error! Next layer must be: ${targetRule.label}`);
      setTimeout(() => setPlateNotification(''), 2500);
      
      // Play buzzer fail
      if (audioCtx) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(120, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      }
      return;
    }

    setPlateIngredients((prev) => [...prev, topping]);
    if (topping === 'top_bun') {
      setPlateNotification("Burger completed! Place it on the tray!");
    } else {
      setPlateNotification(`${targetRule.label} added!`);
    }
    setTimeout(() => setPlateNotification(''), 2000);
  };

  const handleTrashBurger = () => {
    initAudio();
    playCookingSound('trash');
    setPlateIngredients([]);
    setPlateNotification("Plate cleared! Start over.");
    setTimeout(() => setPlateNotification(''), 2000);
  };

  const handleMoveBurgerToTray = () => {
    if (plateIngredients.length < 8) {
      setPlateNotification("Stack all 8 layers before placing on tray!");
      setTimeout(() => setPlateNotification(''), 2500);
      return;
    }

    if (!customerOrder.burger) {
      setKitchenAlert("This customer didn't order a Krabby Patty!");
      setTimeout(() => setKitchenAlert(''), 3000);
      return;
    }

    setTrayItems((prev) => ({ ...prev, burger: true }));
    setPlateIngredients([]);
    setPlateNotification("Krabby Patty placed on tray!");
    setTimeout(() => setPlateNotification(''), 2500);
  };

  // --- FRY STATION ---
  const handleDropFriesInFryer = () => {
    initAudio();
    if (fryerStatus !== 'empty') return;
    setFryerStatus('frying');
    setFryerProgress(0);
    playCookingSound('sizzle');
  };

  const handlePackFries = () => {
    initAudio();
    if (fryerStatus !== 'cooked') return;
    setFryerStatus('empty');
    setFryerProgress(0);
    setFryBagStatus('filled');
    playCookingSound('ting');
  };

  const handleMoveFriesToTray = () => {
    if (fryBagStatus !== 'filled') {
      setKitchenAlert("No packaged fries available!");
      setTimeout(() => setKitchenAlert(''), 3000);
      return;
    }

    if (!customerOrder.fries) {
      setKitchenAlert("This customer didn't order Kelp Fries!");
      setTimeout(() => setKitchenAlert(''), 3000);
      return;
    }

    setTrayItems((prev) => ({ ...prev, fries: true }));
    setFryBagStatus('empty');
  };

  // --- DRINK STATION ---
  const handleGrabCup = () => {
    initAudio();
    if (drinkCup !== 'none') return;
    setDrinkCup('empty');
  };

  const handleFillCup = () => {
    initAudio();
    if (drinkCup !== 'empty') return;
    setDrinkCup('filling');
    setDrinkProgress(0);
    playCookingSound('sip');
  };

  const handleCapDrink = () => {
    initAudio();
    if (drinkCup !== 'filled') return;
    setDrinkCup('completed');
    playCookingSound('ting');
  };

  const handleMoveDrinkToTray = () => {
    if (drinkCup !== 'completed') {
      setKitchenAlert("Soda incomplete! Grab cup -> Pour -> Add Straw.");
      setTimeout(() => setKitchenAlert(''), 3000);
      return;
    }

    if (!customerOrder.drink) {
      setKitchenAlert("This customer didn't order a Seafoam Soda!");
      setTimeout(() => setKitchenAlert(''), 3000);
      return;
    }

    setTrayItems((prev) => ({ ...prev, drink: true }));
    setDrinkCup('none');
  };

  // --- SERVE ACTIONS & ROUND TIMING ---
  const handleServe = () => {
    initAudio();
    setIsTimerActive(false);

    // Strict validation
    const burgerMatch = trayItems.burger === customerOrder.burger;
    const friesMatch = trayItems.fries === customerOrder.fries;
    const drinkMatch = trayItems.drink === customerOrder.drink;

    const isMatch = burgerMatch && friesMatch && drinkMatch;
    handleServingOutcome(isMatch, false);
  };

  const handleServingOutcome = (isSuccess, isTimeout = false) => {
    clearInterval(gameTimerInterval.current);
    initAudio();

    let logsText = "";
    let scoreGained = 0;
    let outcome = 'none';

    if (isSuccess && !isTimeout) {
      scoreGained = 100 + gameTimer;
      setScore((prev) => prev + scoreGained);
      setServedSuccessCount((prev) => prev + 1);
      logsText = `Served Customer ${customerRound} successfully! (+${scoreGained} pts)`;
      outcome = 'success';
      
      // Happy victory chimes
      if (audioCtx) {
        const notes = [261.63, 329.63, 392.00, 523.25];
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
    } else {
      if (isTimeout) {
        logsText = `Customer ${customerRound} left! Out of time. (0 pts)`;
        outcome = 'timeout';
      } else {
        logsText = `Customer ${customerRound} left! Mismatched tray items. (0 pts)`;
        outcome = 'mismatch';
      }

      // Sad buzz sound
      if (audioCtx) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(130, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 0.4);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.5);
      }
    }

    setRoundLogs((prev) => [...prev, { round: customerRound, text: logsText, success: isSuccess && !isTimeout }]);
    setServingOutcome(outcome);

    // Transition back to Counter to show outcome speech dialogue
    triggerBubbleTransition(() => {
      setScene('counter-active');
      setCustomerSpeechVisible(true);
      setCustomerEntered(true);
      
      let reply = "";
      if (outcome === 'success') {
        reply = getThanksText();
      } else if (outcome === 'timeout') {
        reply = "The service is too slow! I'm out of here! 😡";
      } else if (outcome === 'mismatch') {
        reply = "This is NOT what I ordered! I'm leaving! 🤮";
      }

      const speaker = customerRound === 1 ? 'spongebob' : customerRound === 2 ? 'krabs' : 'plankton';
      typeText(reply, speaker, 35);
    });
  };

  const handleRestartGame = () => {
    initAudio();
    setScore(0);
    setServedSuccessCount(0);
    setRoundLogs([]);
    startCustomerRound(1);
  };

  return (
    <div className="plankton-game-container">
      {/* Visual Novel & SpongeBob Themed Galley Kitchen CSS Engine */}
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

        /* Undersea Scene background mappings */
        .board-start { background-image: url('/resources/images/menu.jpeg'); display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .board-scene-1 { background-image: url('/resources/images/scene-1.jpg'); cursor: pointer; }
        .board-scene-2 { background-image: url('/resources/images/scene-2.jpg'); cursor: pointer; }
        .board-counter-active { background-image: url('/resources/images/counter.jpg'); }
        
        /* SPONGEBOB THEMED UNDERSEA GALLEY KITCHEN WALLS */
        .board-kitchen-active {
          background: linear-gradient(180deg, #80deea 0%, #0097a7 100%);
          display: flex;
          flex-direction: column;
          box-shadow: inset 0 0 100px rgba(0,0,0,0.3);
        }
        
        .board-game-over { background: radial-gradient(circle, #25123e, #0e051c); display: flex; flex-direction: column; align-items: center; justify-content: center; }

        /* HUD elements */
        .plankton-back-btn {
          position: absolute;
          top: 20px;
          left: 20px;
          background: #ffe082;
          color: #5d4037;
          border: 3px solid #5d4037;
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
          box-shadow: 0 4px 0 #5d4037;
        }

        .plankton-back-btn:hover {
          background: #ffd54f;
          transform: scale(1.1);
        }

        /* Black Scene Fade Overlay */
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

        /* SpongeBob Bubbles transition overlay */
        .bubble-transition-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1000;
          pointer-events: none;
          overflow: hidden;
        }

        .bubble-particle {
          position: absolute;
          bottom: -150px;
          background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.7), rgba(0, 180, 255, 0.3) 60%, rgba(0, 100, 255, 0.8));
          border-radius: 50%;
          box-shadow: inset -5px -5px 15px rgba(0,0,0,0.1), 0 0 10px rgba(0, 160, 255, 0.5);
          animation: riseBubble linear forwards;
          opacity: 0.95;
        }

        @keyframes riseBubble {
          0% { transform: translateY(0) translateX(0) scale(0.8); opacity: 0; }
          10% { opacity: 0.95; }
          100% { transform: translateY(-135vh) translateX(var(--sway-x)) scale(1.1); opacity: 0; }
        }

        /* Start screen panel */
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
        }

        .orange-start-btn:hover {
          transform: translateY(-4px) scale(1.05);
          box-shadow: 0 10px 25px rgba(255, 85, 0, 0.7), 0 0 15px rgba(255, 165, 0, 0.5);
        }

        /* Characters Positioning */
        .character-sprite { position: absolute; background-position: center; background-size: contain; background-repeat: no-repeat; z-index: 10; }
        .plankton-steal-s1 { width: 260px; height: 260px; bottom: 12%; left: 50%; transform: translateX(-50%); background-image: url('/resources/images/steal.png'); animation: breathing 2s ease-in-out infinite alternate; }
        .plankton-steal-s2 { width: 300px; height: 300px; bottom: 14%; left: 22%; background-image: url('/resources/images/aftersteal.png'); transition: transform 1.2s cubic-bezier(0.6, -0.28, 0.735, 0.045), opacity 1.2s ease-out; animation: fastBreathing 1.2s ease-in-out infinite alternate; }
        .plankton-steal-s2.slide-left { transform: translateX(-200%) rotate(-15deg); opacity: 0; }
        .krabs-sprite { width: 320px; height: 320px; bottom: 12%; right: -400px; background-image: url('/resources/images/afterstealmrcrab.png'); transition: right 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); animation: heavyBobbing 2.5s ease-in-out infinite alternate; }
        .spongebob-sprite { width: 340px; height: 340px; bottom: 10%; right: -400px; background-image: url('/resources/images/afterstealspongebobcrying.png'); transition: right 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275); transition-delay: 0.15s; animation: cryShaking 0.15s linear infinite; }
        .krabs-sprite.slide-in { right: 32%; }
        .spongebob-sprite.slide-in { right: 5%; }

        /* Counter Customer Scene */
        .counter-customer-sprite {
          width: 320px;
          height: 380px;
          bottom: 12%;
          right: -400px;
          transition: right 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          animation: breathing 2s ease-in-out infinite alternate;
        }

        .counter-customer-sprite.slide-in {
          right: 20%;
        }

        .order-badge-grid {
          display: flex;
          gap: 12px;
          margin-top: 10px;
          justify-content: flex-start;
        }

        .order-badge-icon {
          font-size: 2.2rem;
          background: rgba(255,255,255,0.9);
          border: 3px solid #5d4037;
          border-radius: 50%;
          width: 55px;
          height: 55px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 0 #5d4037;
          animation: floatJar 2s ease-in-out infinite alternate;
        }

        /* Dialogue box bubble */
        .dialogue-bubble-container {
          position: absolute;
          bottom: 6%;
          left: 50%;
          transform: translateX(-50%);
          width: 85%;
          max-width: 800px;
          background: rgba(255, 255, 255, 0.98);
          border: 6px solid #5d4037;
          box-shadow: 0 10px 0 rgba(0, 0, 0, 0.25), 0 8px 30px rgba(0, 0, 0, 0.3);
          border-radius: 25px;
          padding: 24px 32px;
          z-index: 30;
          display: flex;
          flex-direction: column;
          animation: bubbleBounce 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
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
          border: 3px solid #5d4037;
          letter-spacing: 1px;
          box-shadow: 0 4px 0 #5d4037;
        }

        .speaker-plankton { background: #2e7d32; }
        .speaker-krabs { background: #d32f2f; }
        .speaker-spongebob { background: #ffd54f; color: #5d4037; }
        .speaker-both { background: linear-gradient(90deg, #d32f2f, #ffd54f); color: white; }

        .dialogue-text { font-size: 1.6rem; color: #3e2723; font-weight: 850; line-height: 1.4; text-align: left; }
        .click-arrow { position: absolute; bottom: 15px; right: 25px; font-size: 1.2rem; color: #ff8c00; animation: bounceArrow 0.8s infinite alternate; }

        /* --- KITCHEN SPONGEBOB THEME HUD --- */
        .kitchen-header {
          background: #ffe082; /* Warm yellow board header */
          border-bottom: 5px solid #5d4037;
          padding: 1rem 2rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 20;
          box-shadow: 0 6px 0 rgba(0,0,0,0.15);
        }

        .kitchen-title-panel { display: flex; flex-direction: column; align-items: flex-start; padding-left: 75px; }
        .kitchen-title-panel h2 { font-size: 1.6rem; color: #5d4037; font-weight: 900; margin: 0; text-shadow: 0 2px 0 rgba(255,255,255,0.6); }
        .kitchen-round-label { font-size: 0.92rem; color: #8d6e63; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }

        .timer-dashboard { display: flex; align-items: center; gap: 15px; background: #fff8e1; padding: 8px 18px; border-radius: 12px; border: 3px solid #5d4037; box-shadow: 0 4px 0 #5d4037; }
        .timer-label { font-size: 0.9rem; color: #c62828; font-weight: 900; }
        .timer-value { font-size: 1.8rem; font-family: monospace; font-weight: 900; color: #c62828; }

        .kitchen-order-box {
          background: #fff8e1;
          border: 3px solid #5d4037;
          box-shadow: 0 4px 0 #5d4037;
          border-radius: 15px;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .kitchen-order-label { font-size: 0.9rem; font-weight: 900; color: #5d4037; text-transform: uppercase; }
        .kitchen-order-items { display: flex; gap: 8px; }
        .kitchen-order-badge { background: #fff; border-radius: 8px; border: 2px solid #bcaaa4; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; position: relative; }
        .kitchen-order-badge.active { border-color: #5d4037; background: #ffe082; box-shadow: inset 0 2px 5px rgba(0,0,0,0.1); }

        /* Main kitchen workspace layout */
        .kitchen-workspace {
          flex: 1;
          display: grid;
          grid-template-columns: 1.45fr 1fr 1fr;
          gap: 1.5rem;
          padding: 1.5rem;
          overflow-y: auto;
          box-sizing: border-box;
        }

        /* Playful wood-panel flat styling for cards */
        .kitchen-station-card {
          background: #fff8e1; /* warm creamy wood */
          border: 4px solid #5d4037; /* thick brown line */
          border-radius: 22px;
          padding: 1.5rem;
          box-shadow: 0 8px 0 #5d4037, 0 10px 25px rgba(0,0,0,0.15); /* flat cartoon drop shadow */
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          position: relative;
          color: #3e2723;
        }

        .kitchen-station-card h3 {
          font-size: 1.35rem;
          font-weight: 900;
          margin-bottom: 1.2rem;
          border-bottom: 4px solid #5d4037;
          padding-bottom: 8px;
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #5d4037;
        }

        /* Grill Slots */
        .grill-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
        
        .holding-tray {
          width: 100px;
          height: 120px;
          background: #d7ccc8; /* Warm clay plate color */
          border: 4px solid #5d4037;
          border-radius: 12px;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: inset 0 4px 6px rgba(0,0,0,0.15);
          margin-left: auto;
        }

        .holding-tray-label {
          font-size: 0.65rem;
          font-weight: 900;
          text-transform: uppercase;
          color: #5d4037;
          position: absolute;
          top: 6px;
        }

        .holding-tray-content {
          position: relative;
          width: 50px;
          height: 50px;
          margin-top: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .holding-patty {
          font-size: 2.2rem;
          position: absolute;
          animation: breathing 2s ease-in-out infinite alternate;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));
        }

        .holding-tray-empty {
          color: #8d6e63;
          font-size: 0.72rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .holding-tray-count {
          font-size: 0.8rem;
          font-weight: 900;
          color: white;
          background: #4caf50;
          border: 2px solid #5d4037;
          border-radius: 8px;
          padding: 2px 6px;
          position: absolute;
          bottom: 6px;
        }

        .grill-slot {
          flex: 1;
          height: 120px;
          background: #3e2723; /* Dark iron metal */
          border: 4px solid #5d4037;
          border-radius: 12px;
          position: relative;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          box-shadow: inset 0 6px 0 rgba(0,0,0,0.3);
        }

        .grill-slot:hover { border-color: #ffa500; transform: scale(1.02); }
        .grill-slot.hot { background: #d84315; box-shadow: inset 0 6px 0 rgba(0,0,0,0.4), 0 0 15px rgba(216,67,21,0.4); }
        .grill-slot.cooked { border-color: #ffa500; }
        .grill-slot.burned { border-color: #ff0000; background: #111; }

        .patty-visual { font-size: 2.8rem; animation: sizzling 0.15s linear infinite; }
        .patty-label { font-size: 0.72rem; font-weight: 900; text-transform: uppercase; color: white; padding: 2px 8px; border-radius: 4px; position: absolute; top: 10px; border: 2px solid #222; }
        .patty-label.raw { background: #b06565; }
        .patty-label.cooked { background: #795548; box-shadow: 0 0 10px #795548; }
        .patty-label.burned { background: #111; border: 2px solid #ff0000; color: #ff0000; }

        .grill-progress-bar { position: absolute; bottom: 10px; left: 10%; width: 80%; height: 8px; background: rgba(0,0,0,0.4); border: 2px solid #5d4037; border-radius: 4px; overflow: hidden; }
        .grill-progress-fill { height: 100%; background: #ffa500; }
        .grill-progress-fill.cooked { background: #4caf50; }
        .grill-progress-fill.burned { background: #f44336; }

        /* Topping boxes */
        .topping-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; margin-bottom: 1.2rem; }
        .topping-box {
          background: #ffe082;
          border: 3px solid #5d4037;
          border-radius: 10px;
          padding: 8px;
          cursor: pointer;
          text-align: center;
          font-size: 0.8rem;
          font-weight: 850;
          color: #5d4037;
          transition: all 0.2s ease;
          box-shadow: 0 4px 0 #5d4037;
        }

        .topping-box:hover { background: #ffd54f; transform: translateY(-2px); box-shadow: 0 6px 0 #5d4037; }
        .topping-box:active { transform: translateY(2px); box-shadow: 0 2px 0 #5d4037; }
        .topping-box-emoji { font-size: 1.4rem; }

        /* prep plate stacking */
        .prep-plate-bench {
          background: #e0f2f1; /* Light marine board color */
          border: 3px dashed #5d4037;
          border-radius: 16px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          min-height: 180px;
          justify-content: flex-end;
          box-shadow: inset 0 4px 10px rgba(0,0,0,0.05);
        }

        .plate-notification {
          position: absolute;
          top: 10px;
          background: #c62828;
          color: white;
          font-size: 0.8rem;
          font-weight: 800;
          padding: 4px 12px;
          border-radius: 8px;
          border: 2px solid #5d4037;
          box-shadow: 0 4px 0 #5d4037;
          z-index: 10;
        }

        .plate-stack-visual {
          width: 80%;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 12px;
          gap: 1px;
        }

        /* Burger Stack layers visualizer vector bars */
        .layer-top_bun { width: 140px; height: 26px; background: #e09647; border-radius: 16px 16px 4px 4px; border: 3px solid #5d4037; border-bottom: none; box-shadow: inset 0 5px 0 rgba(255,255,255,0.25); }
        .layer-tomato { width: 130px; height: 10px; background: #e53935; border-radius: 4px; border: 3px solid #5e0d0b; }
        .layer-onion { width: 125px; height: 8px; background: #eceff1; border-radius: 4px; border: 3px solid #78909c; }
        .layer-lettuce { width: 136px; height: 12px; background: #4caf50; border-radius: 6px; border: 3px solid #1b5e20; box-shadow: inset 0 2px 0 rgba(255,255,255,0.2); }
        .layer-ketchup_mustard { width: 120px; height: 6px; background: linear-gradient(90deg, #d32f2f 50%, #fbc02d 50%); border-radius: 2px; border: 1.5px solid #222; }
        .layer-sliced_cheese { width: 132px; height: 8px; background: #ffeb3b; border-radius: 2px; border: 3px solid #c5a004; transform: skewX(-8deg); }
        .layer-cooked_patty { width: 134px; height: 22px; background: #5d4037; border-radius: 6px; border: 3px solid #2d1d18; }
        .layer-bottom_bun { width: 140px; height: 18px; background: #e09647; border-radius: 4px 4px 12px 12px; border: 3px solid #5d4037; }

        .ceramic-plate-visual {
          width: 160px;
          height: 10px;
          background: #fff;
          border-radius: 0 0 16px 16px;
          border: 3px solid #5d4037;
          box-shadow: 0 4px 0 #5d4037;
        }

        .plate-control-row { display: flex; width: 100%; gap: 8px; margin-top: 10px; }
        .plate-btn { flex: 1; border: 3px solid #5d4037; padding: 10px; border-radius: 10px; font-weight: 850; font-size: 0.82rem; cursor: pointer; text-transform: uppercase; transition: all 0.2s ease; }
        
        .plate-btn-clear { background: #ffcdd2; color: #b71c1c; box-shadow: 0 4px 0 #5d4037; }
        .plate-btn-clear:hover { background: #ffebee; }
        .plate-btn-clear:active { transform: translateY(2px); box-shadow: 0 2px 0 #5d4037; }

        .plate-btn-tray { background: #ffe082; color: #5d4037; box-shadow: 0 4px 0 #5d4037; }
        .plate-btn-tray:hover { background: #ffd54f; }
        .plate-btn-tray:active { transform: translateY(2px); box-shadow: 0 2px 0 #5d4037; }

        /* deep fryer vat */
        .fryer-vat {
          height: 130px;
          background: radial-gradient(circle, #e65100, #3e2723);
          border: 4px solid #5d4037;
          border-radius: 16px;
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          transition: all 0.3s ease;
          margin-bottom: 1.5rem;
          box-shadow: inset 0 6px 0 rgba(0,0,0,0.3);
        }

        .fryer-vat:hover { border-color: #ffa500; transform: scale(1.02); }
        .fryer-grease { position: absolute; width: 100%; height: 100%; }
        .grease-bubble { position: absolute; width: 10px; height: 10px; background: rgba(255, 235, 59, 0.4); border-radius: 50%; animation: bubbleFloat 0.6s infinite ease-out; }

        .fryer-indicator { font-size: 3rem; animation: sizzling 0.1s infinite; z-index: 10; }
        .fry-label { font-weight: 900; font-size: 0.8rem; text-transform: uppercase; color: white; padding: 4px 10px; border-radius: 6px; border: 2px solid #222; z-index: 12; }

        .fry-holder-row { display: flex; align-items: center; gap: 10px; justify-content: space-between; }
        .fry-holder-container { flex: 1; background: #ffe082; border: 3px solid #5d4037; box-shadow: 0 4px 0 #5d4037; border-radius: 12px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; color: #5d4037; }
        .fry-holder-container:hover { background: #ffd54f; }
        .fry-holder-container:active { transform: translateY(2px); box-shadow: 0 2px 0 #5d4037; }
        .fry-holder-emoji { font-size: 2.8rem; }
        .fry-holder-label { font-size: 0.78rem; font-weight: 850; text-transform: uppercase; margin-top: 5px; }

        /* soda fountain */
        .soda-dispenser {
          height: 130px;
          background: linear-gradient(185deg, #37474f, #212121);
          border: 4px solid #5d4037;
          border-radius: 16px;
          position: relative;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          overflow: hidden;
          margin-bottom: 1.5rem;
          box-shadow: inset 0 6px 0 rgba(0,0,0,0.3);
        }

        .soda-dispenser:hover { border-color: #ffa500; transform: scale(1.02); }
        .soda-dispenser.filling { border-color: #ff3366; }

        .pour-visual { width: 14px; height: 100%; background: #00e5ff; position: absolute; top: 0; animation: liquidPour 0.2s linear infinite; opacity: 0.85; }

        .cup-holder-row { display: flex; gap: 10px; justify-content: space-between; }
        .cup-station-panel { flex: 1; background: #ffe082; border: 3px solid #5d4037; box-shadow: 0 4px 0 #5d4037; border-radius: 12px; height: 100px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s ease; color: #5d4037; }
        .cup-station-panel:hover { background: #ffd54f; }
        .cup-station-panel:active { transform: translateY(2px); box-shadow: 0 2px 0 #5d4037; }

        /* Serving Tray & serve */
        .tray-bench {
          flex: 1;
          background: #c8e6c9; /* Light tropical green tray base */
          border: 4px solid #5d4037;
          box-shadow: inset 0 4px 10px rgba(0,0,0,0.08);
          border-radius: 16px;
          padding: 1.2rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          margin-bottom: 1.5rem;
        }

        .tray-slots-row { display: flex; justify-content: space-around; gap: 10px; }
        .tray-slot {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          border: 3px dashed #5d4037;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          transition: all 0.3s ease;
          position: relative;
        }

        .tray-slot.active { border-color: #2e7d32; background: rgba(129, 199, 132, 0.2); }

        .serve-btn {
          width: 100%;
          background: linear-gradient(135deg, #4caf50, #2e7d32);
          color: white;
          border: 4px solid #5d4037;
          padding: 16px;
          font-size: 1.3rem;
          font-weight: 900;
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 6px 0 #5d4037;
        }

        .serve-btn:hover:not(:disabled) {
          background: #4caf50;
          transform: translateY(-2px);
          box-shadow: 0 8px 0 #5d4037;
        }

        .serve-btn:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 4px 0 #5d4037;
        }

        .serve-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; box-shadow: none; }

        .trash-can-station {
          height: 80px;
          background: #ffcdd2;
          border: 4px solid #b71c1c;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          color: #b71c1c;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 0 #b71c1c;
        }

        .trash-can-station:hover { background: #ffebee; transform: translateY(-2px); box-shadow: 0 6px 0 #b71c1c; }
        .trash-can-station:active { transform: translateY(2px); box-shadow: 0 2px 0 #b71c1c; }

        .kitchen-alert-banner {
          background: #d32f2f;
          color: white;
          padding: 10px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          margin-top: 10px;
          border: 2px solid #222;
          box-shadow: 0 4px 0 rgba(0,0,0,0.15);
          animation: popIn 0.3s ease-out;
        }

        /* Visual keyframes */
        @keyframes sizzling {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-1px) rotate(0.5deg); }
          100% { transform: translateY(0) rotate(-0.5deg); }
        }

        @keyframes liquidPour {
          from { background-position-y: 0px; }
          to { background-position-y: 100px; }
        }

        @keyframes bubbleFloat {
          0% { transform: translateY(10px) translateX(0); opacity: 0.6; }
          100% { transform: translateY(-30px) translateX(var(--rnd-x, 10px)); opacity: 0; }
        }

        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes popInBounce {
          from { opacity: 0; transform: scale(0.7) translateY(50px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }

        @keyframes bubbleBounce {
          from { opacity: 0; transform: translateX(-50%) translateY(30px) scale(0.9); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        @keyframes breathing {
          from { transform: scale(1); }
          to { transform: scale(1.04) translateY(-3px); }
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
          to { transform: translateY(6px); }
        }

        /* GAME OVER SCOREBOARD */
        .scoreboard-panel {
          background: rgba(0, 5, 20, 0.85);
          backdrop-filter: blur(16px);
          border: 4px solid var(--primary-neon);
          box-shadow: 0 0 45px rgba(188, 19, 254, 0.4), inset 0 0 25px rgba(188, 19, 254, 0.2);
          border-radius: 28px;
          padding: 3rem 2rem;
          max-width: 620px;
          width: 90%;
          text-align: center;
          animation: popIn 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }

        .score-title { font-size: 3.5rem; font-weight: 900; color: var(--primary-neon); text-shadow: 0 0 15px rgba(188, 19, 254, 0.6); margin-bottom: 0.3rem; text-transform: uppercase; }
        .score-subtitle { font-size: 1.4rem; font-weight: 700; color: #00f0ff; margin-bottom: 2rem; text-transform: uppercase; }

        .score-stats-container {
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }

        .score-row-item {
          display: flex;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding-bottom: 8px;
          font-size: 1.1rem;
        }

        .score-row-item.highlight {
          border-bottom: none;
          padding-bottom: 0;
          font-size: 1.4rem;
          font-weight: 900;
          color: #ff8c00;
        }

        .log-entry { font-size: 0.92rem; font-weight: 600; padding: 4px 0; display: flex; align-items: center; gap: 8px; }
        .log-entry.success { color: #81c784; }
        .log-entry.failed { color: #e57373; }

        .button-row { display: flex; gap: 1rem; width: 100%; justify-content: center; }
        .score-btn { border: none; padding: 14px 28px; font-size: 1.1rem; font-weight: 800; border-radius: 12px; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase; }
        .score-btn-replay { background: #ffa500; color: black; }
        .score-btn-exit { background: transparent; color: white; border: 2px solid rgba(255,255,255,0.3); }
        .score-btn-replay:hover { background: #ffb732; box-shadow: 0 0 15px rgba(255,165,0,0.5); transform: translateY(-2px); }
        .score-btn-exit:hover { border-color: #ff3366; color: #ff3366; box-shadow: 0 0 15px rgba(255,51,102,0.3); transform: translateY(-2px); }
      `}</style>

      {/* Main Game Board */}
      <div className={`plankton-game-board board-${scene}`} onClick={(scene === 'scene-1' || scene === 'scene-2') ? handleScreenClick : undefined}>
        {/* Fade Transition Screen */}
        <div className={`scene-fade-overlay ${isFading ? 'fading' : ''}`} />

        {/* Dynamic Bubble Transition Overlay */}
        {showBubbleTransition && (
          <div className="bubble-transition-overlay">
            {bubbles.map((b) => (
              <div
                key={b.id}
                className="bubble-particle"
                style={{
                  left: `${b.left}%`,
                  width: `${b.size}px`,
                  height: `${b.size}px`,
                  animationDelay: `${b.delay}s`,
                  animationDuration: `${b.speed}s`,
                  '--sway-x': `${b.sway}px`
                }}
              />
            ))}
          </div>
        )}

        {/* Global Exit Button */}
        <button className="plankton-back-btn" onClick={onBack} title="Exit to Games List">←</button>

        {/* VIEW 1: TITLE SCREEN */}
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

        {/* VIEW 2: SCENE 1 PROLOGUE */}
        {scene === 'scene-1' && (
          <div className="character-sprite plankton-steal-s1" />
        )}

        {/* VIEW 3: SCENE 2 PROLOGUE */}
        {scene === 'scene-2' && (
          <>
            <div className={`character-sprite plankton-steal-s2 ${planktonSlideLeft ? 'slide-left' : ''}`} />
            <div className={`character-sprite krabs-sprite ${goodGuysSlideIn ? 'slide-in' : ''}`} />
            <div className={`character-sprite spongebob-sprite ${goodGuysSlideIn ? 'slide-in' : ''}`} />
          </>
        )}

        {/* PROLOGUE CUTSCENE DIALOGUE BUBBLE OVERLAY */}
        {showBubble && (scene === 'scene-1' || scene === 'scene-2') && (
          <div className="dialogue-bubble-container" onClick={(e) => {
            e.stopPropagation();
            handleScreenClick();
          }}>
            {scene === 'scene-1' && (
              <div className="speaker-badge speaker-plankton">Plankton</div>
            )}
            {scene === 'scene-2' && (
              <div className={`speaker-badge speaker-${scene2Dialogues[dialogueIndex]?.speaker}`}>
                {scene2Dialogues[dialogueIndex]?.speaker === 'both' ? 'Krabs & Spongebob' : scene2Dialogues[dialogueIndex]?.speaker}
              </div>
            )}
            <div className="dialogue-text">{displayText}</div>
            {!isTyping && <div className="click-arrow">▼</div>}
          </div>
        )}

        {/* VIEW 4: ACTIVE COUNTER CUSTOMER SCENE */}
        {scene === 'counter-active' && (
          <>
            {/* Customer entry */}
            <img
              src={customerImg}
              alt="Customer"
              className={`character-sprite counter-customer-sprite ${customerEntered ? 'slide-in' : ''}`}
            />

            {/* Customer Speech bubble with order images or serving outcome */}
            {customerSpeechVisible && (
              <div className="dialogue-bubble-container" onClick={handleCustomerSpeechClick}>
                <div className={`speaker-badge speaker-${customerRound === 1 ? 'spongebob' : customerRound === 2 ? 'krabs' : 'plankton'}`}>
                  Customer
                </div>
                <div className="dialogue-text">
                  {displayText}
                </div>

                {/* Badges of ordered products (only show when taking order, not when displaying served thanks/departures) */}
                {!isTyping && servingOutcome === 'none' && (
                  <div className="order-badge-grid">
                    {customerOrder.burger && <div className="order-badge-icon" title="Krabby Patty">🍔</div>}
                    {customerOrder.fries && <div className="order-badge-icon" title="Kelp Fries">🍟</div>}
                    {customerOrder.drink && <div className="order-badge-icon" title="Seafoam Soda">🥤</div>}
                  </div>
                )}

                {!isTyping && (
                  <div className="click-arrow" style={{ bottom: '25px' }}>
                    {servingOutcome === 'none' ? '▶ Click to Enter Kitchen' : '▶ Next'}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* VIEW 5: ACTIVE KITCHEN UNDERSEA WOOD-PLANK GAMEPLAY */}
        {scene === 'kitchen-active' && (
          <>
            {/* Kitchen header HUD */}
            <div className="kitchen-header">
              <div className="kitchen-title-panel">
                <h2>Plankton's Kitchen</h2>
                <div className="kitchen-round-label">Round {customerRound} of 3</div>
              </div>

              {/* Customer Order Receipt Panel */}
              <div className="kitchen-order-box">
                <span className="kitchen-order-label">Order:</span>
                <div className="kitchen-order-items">
                  <div className={`kitchen-order-badge ${customerOrder.burger ? 'active' : ''}`}>
                    🍔 {customerOrder.burger && <span style={{ position: 'absolute', top: -4, right: -4, fontSize: '0.62rem', background: '#4caf50', color: 'white', borderRadius: '50%', width: 14, height: 14, fontWeight: 'bold' }}>✓</span>}
                  </div>
                  <div className={`kitchen-order-badge ${customerOrder.fries ? 'active' : ''}`}>
                    🍟 {customerOrder.fries && <span style={{ position: 'absolute', top: -4, right: -4, fontSize: '0.62rem', background: '#4caf50', color: 'white', borderRadius: '50%', width: 14, height: 14, fontWeight: 'bold' }}>✓</span>}
                  </div>
                  <div className={`kitchen-order-badge ${customerOrder.drink ? 'active' : ''}`}>
                    🥤 {customerOrder.drink && <span style={{ position: 'absolute', top: -4, right: -4, fontSize: '0.62rem', background: '#4caf50', color: 'white', borderRadius: '50%', width: 14, height: 14, fontWeight: 'bold' }}>✓</span>}
                  </div>
                </div>
              </div>

              {/* Countdown timer */}
              <div className="timer-dashboard">
                <span className="timer-label">CLOCK:</span>
                <span className="timer-value">{gameTimer}s</span>
              </div>
            </div>

            {/* Kitchen main stations grid workspace */}
            <div className="kitchen-workspace">
              {/* STATION 1: BURGER STATION */}
              <div className="kitchen-station-card station-burger">
                <h3>🍔 Krabby Patty Galley</h3>
                
                {/* 2 Grill Slots + Holding Tray */}
                <div className="grill-row">
                  {grillPatties.map((patty) => (
                    <div
                      key={patty.id}
                      className={`grill-slot ${patty.status !== 'empty' ? 'hot' : ''}`}
                      onClick={() =>
                        patty.status === 'empty'
                          ? handlePlacePattyOnGrill(patty.id)
                          : handlePickPattyFromGrill(patty.id)
                      }
                      title={patty.status === 'empty' ? "Place patty on grill" : `Patty status: ${patty.status}`}
                    >
                      {patty.status === 'empty' && <span style={{ color: '#8d6e63', fontSize: '0.82rem', fontWeight: 'bold' }}>GRILL</span>}
                      {patty.status !== 'empty' && (
                        <>
                          <div className="patty-visual">🥩</div>
                          <span className={`patty-label ${patty.status}`}>
                            {patty.status}
                          </span>
                          
                          {/* Sizzle progress bar */}
                          <div className="grill-progress-bar">
                            <div
                              className={`grill-progress-fill ${patty.status}`}
                              style={{ width: `${Math.min((patty.progress / 20) * 100, 100)}%` }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  ))}

                  {/* Cooked Patty Holding Tray */}
                  <div className="holding-tray" title="Cooked Patty Warmer Tray">
                    <span className="holding-tray-label">Holding Plate</span>
                    <div className="holding-tray-content">
                      {cookedPattiesCount > 0 ? (
                        Array.from({ length: Math.min(cookedPattiesCount, 4) }).map((_, i) => (
                          <div 
                            key={i} 
                            className="holding-patty" 
                            style={{ bottom: `${i * 6}px` }}
                          >
                            🥩
                          </div>
                        ))
                      ) : (
                        <span className="holding-tray-empty">Empty</span>
                      )}
                    </div>
                    {cookedPattiesCount > 0 && (
                      <span className="holding-tray-count">x{cookedPattiesCount}</span>
                    )}
                  </div>
                </div>

                {/* Toppings boxes */}
                <div className="topping-grid">
                  <div className="topping-box" onClick={() => handleAddTopping('bottom_bun')}>
                    <span className="topping-box-emoji">🥪</span>
                    <span>Bottom Bun</span>
                  </div>
                  <div className="topping-box" onClick={() => handleAddTopping('cooked_patty')}>
                    <span className="topping-box-emoji">🥩</span>
                    <span>Cooked Patty</span>
                  </div>
                  <div className="topping-box" onClick={() => handleAddTopping('sliced_cheese')}>
                    <span className="topping-box-emoji">🧀</span>
                    <span>Cheese</span>
                  </div>
                  <div className="topping-box" onClick={() => handleAddTopping('ketchup_mustard')}>
                    <span className="topping-box-emoji">🍯</span>
                    <span>Sauces</span>
                  </div>
                  <div className="topping-box" onClick={() => handleAddTopping('lettuce')}>
                    <span className="topping-box-emoji">🥬</span>
                    <span>Lettuce</span>
                  </div>
                  <div className="topping-box" onClick={() => handleAddTopping('onion')}>
                    <span className="topping-box-emoji">🧅</span>
                    <span>Onion</span>
                  </div>
                  <div className="topping-box" onClick={() => handleAddTopping('tomato')}>
                    <span className="topping-box-emoji">🍅</span>
                    <span>Tomato</span>
                  </div>
                  <div className="topping-box" onClick={() => handleAddTopping('top_bun')}>
                    <span className="topping-box-emoji">🥪</span>
                    <span>Top Bun</span>
                  </div>
                </div>

                {/* Assembly Plate Bench */}
                <div className="prep-plate-bench">
                  {plateNotification && <div className="plate-notification">{plateNotification}</div>}
                  
                  {/* Real-time burger layering visualizer stack - Reversed so bottom is at bottom and top is at top! */}
                  <div className="plate-stack-visual">
                    {[...plateIngredients].reverse().map((ing, i) => (
                      <div key={i} className={`layer-${ing}`} />
                    ))}
                  </div>

                  {/* Ceramic Plate */}
                  <div className="ceramic-plate-visual" />

                  {/* Controls */}
                  <div className="plate-control-row">
                    <button className="plate-btn plate-btn-clear" onClick={handleTrashBurger} title="Throw burger in trash">
                      🗑️ Trash
                    </button>
                    <button className="plate-btn plate-btn-tray" onClick={handleMoveBurgerToTray} title="Put completed burger on tray">
                      📥 Tray
                    </button>
                  </div>
                </div>
              </div>

              {/* STATION 2: FRYERS & SODA POUR DISPENSERS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Fryer Vat */}
                <div className="kitchen-station-card station-fries" style={{ flex: 1 }}>
                  <h3>🍟 Kelp Fry Station</h3>
                  
                  <div
                    className="fryer-vat"
                    onClick={handleDropFriesInFryer}
                    title={fryerStatus === 'empty' ? "Fry kelp potatoes" : "Frying..."}
                  >
                    {fryerStatus === 'empty' && <span style={{ color: '#8d6e63', fontSize: '0.85rem', fontWeight: 'bold' }}>DROP RAW POTATOES</span>}
                    {fryerStatus === 'frying' && (
                      <>
                        <div className="fryer-grease">
                          <div className="grease-bubble" style={{ top: 20, left: 30, '--rnd-x': '15px' }} />
                          <div className="grease-bubble" style={{ top: 50, left: 80, '--rnd-x': '-20px', animationDelay: '0.2s' }} />
                          <div className="grease-bubble" style={{ top: 70, left: 40, '--rnd-x': '10px', animationDelay: '0.4s' }} />
                        </div>
                        <div className="fryer-indicator">🍟</div>
                        <span className="fry-label" style={{ background: '#ff8c00', position: 'absolute', bottom: 10 }}>
                          Frying ({Math.floor(fryerProgress)}s)
                        </span>
                      </>
                    )}
                    {fryerStatus === 'cooked' && (
                      <>
                        <div className="fryer-indicator">🍟</div>
                        <span className="fry-label" style={{ background: '#4caf50', position: 'absolute', bottom: 10 }}>
                          READY! CLICK
                        </span>
                      </>
                    )}
                  </div>

                  {/* Packaging Bag Holder */}
                  <div className="fry-holder-row">
                    <div className="fry-holder-container" onClick={handlePackFries} title="Pack fries in a paper bag">
                      <div className="fry-holder-emoji">🛍️</div>
                      <span className="fry-holder-label">Fry Bags</span>
                    </div>

                    <div className="fry-holder-container" onClick={handleMoveFriesToTray} title="Put fries on tray">
                      <div className="fry-holder-emoji">
                        {fryBagStatus === 'filled' ? '🍟' : '🥔'}
                      </div>
                      <span className="fry-holder-label">
                        {fryBagStatus === 'filled' ? 'LOADED' : 'NO FRIES'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Soda Dispenser */}
                <div className="kitchen-station-card station-drink" style={{ flex: 1 }}>
                  <h3>🥤 Seafoam Soda Fountain</h3>
                  
                  <div
                    className={`soda-dispenser ${drinkCup === 'filling' ? 'filling' : ''}`}
                    onClick={handleFillCup}
                    title="Pour Soda"
                  >
                    {drinkCup === 'none' && <span style={{ color: '#8d6e63', fontSize: '0.85rem', fontWeight: 'bold' }}>GRAB CUP STACK FIRST</span>}
                    {drinkCup === 'empty' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '2.8rem', filter: 'opacity(0.4)' }}>🥤</span>
                        <span style={{ color: '#5d4037', fontSize: '0.78rem', fontWeight: 'bold', marginTop: '4px' }}>CLICK TO POUR SODA</span>
                      </div>
                    )}
                    {drinkCup === 'filling' && (
                      <>
                        <div className="pour-visual" />
                        <div className="fryer-indicator" style={{ animation: 'sizzling 0.15s infinite' }}>🥤</div>
                        <span className="fry-label" style={{ background: '#ff3366', position: 'absolute', bottom: 10, border: '2px solid #222' }}>
                          Pouring...
                        </span>
                      </>
                    )}
                    {drinkCup === 'filled' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '2.8rem' }}>🍹</span>
                        <span style={{ color: '#5d4037', fontSize: '0.78rem', fontWeight: 'bold', marginTop: '4px' }}>ADD CAP & STRAW</span>
                      </div>
                    )}
                    {drinkCup === 'completed' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <span style={{ fontSize: '2.8rem' }}>🥤</span>
                        <span style={{ color: '#2e7d32', fontSize: '0.78rem', fontWeight: 'bold', marginTop: '4px' }}>READY! PLACE ON TRAY</span>
                      </div>
                    )}
                  </div>

                  {/* Cup and Lid Stackers */}
                  <div className="cup-holder-row">
                    <div className="cup-station-panel" onClick={handleGrabCup} title="Grab empty cup">
                      <div className="fry-holder-emoji">🥤</div>
                      <span className="fry-holder-label">Cups Stack</span>
                    </div>

                    <div className="cup-station-panel" onClick={handleCapDrink} title="Add lid and straw">
                      <div className="fry-holder-emoji">🧉</div>
                      <span className="fry-holder-label">Straw & Cap</span>
                    </div>

                    <div className="cup-station-panel" onClick={handleMoveDrinkToTray} title="Put soda on tray">
                      <div className="fry-holder-emoji">
                        {drinkCup === 'completed' ? '🥤' : '❌'}
                      </div>
                      <span className="fry-holder-label">
                        {drinkCup === 'completed' ? 'LOADED' : 'EMPTY'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* STATION 3: TRAY, SERVING & TRASH */}
              <div className="kitchen-station-card station-tray">
                <h3>📥 Serving Tray Bench</h3>
                
                <div className="tray-bench">
                  {/* Dotted outlines with no empty icons to prevent jar confusion! */}
                  <div className="tray-slots-row">
                    <div className={`tray-slot ${trayItems.burger ? 'active' : ''}`} title="Krabby Patty Tray Slot">
                      {trayItems.burger ? '🍔' : ''}
                    </div>
                    <div className={`tray-slot ${trayItems.fries ? 'active' : ''}`} title="Kelp Fries Tray Slot">
                      {trayItems.fries ? '🍟' : ''}
                    </div>
                    <div className={`tray-slot ${trayItems.drink ? 'active' : ''}`} title="Seafoam Soda Tray Slot">
                      {trayItems.drink ? '🥤' : ''}
                    </div>
                  </div>

                  {kitchenAlert && <div className="kitchen-alert-banner">{kitchenAlert}</div>}

                  {/* Serve Button (Now inside the bench - extremely visible and central!) */}
                  <button
                    className="serve-btn"
                    onClick={handleServe}
                    disabled={!trayItems.burger && !trayItems.fries && !trayItems.drink}
                    title="Serve tray to customer"
                    style={{ marginTop: '1.2rem' }}
                  >
                    🛎️ Serve Customer
                  </button>
                </div>

                {/* Dump Tray items (Now below the bench - smaller, secondary, and less dominant!) */}
                <div
                  className="trash-can-station"
                  onClick={() => {
                    initAudio();
                    playCookingSound('trash');
                    setTrayItems({ burger: false, fries: false, drink: false });
                    setKitchenAlert("Tray cleared!");
                    setTimeout(() => setKitchenAlert(''), 2500);
                  }}
                  title="Dump everything on the tray"
                  style={{ height: '55px', fontSize: '1.2rem', fontWeight: '800' }}
                >
                  🗑️ Dump Tray
                </div>
              </div>
            </div>
          </>
        )}

        {/* VIEW 6: GAME OVER SCENE */}
        {scene === 'game-over' && (
          <div className="scoreboard-panel">
            <h1 className="score-title">Day Complete!</h1>
            <h2 className="score-subtitle">Kitchen Results</h2>

            <div className="score-stats-container">
              <div className="score-row-item">
                <span>Customers Served:</span>
                <span style={{ color: '#81c784', fontWeight: 'bold' }}>{servedSuccessCount} / 3</span>
              </div>

              <div style={{ marginTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: '#ff8c00', fontWeight: 'bold', textTransform: 'uppercase' }}>Serving log:</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                  {roundLogs.map((log, idx) => (
                    <div key={idx} className={`log-entry ${log.success ? 'success' : 'failed'}`}>
                      {log.success ? '✓' : '✗'} {log.text}
                    </div>
                  ))}
                </div>
              </div>

              <div className="score-row-item highlight" style={{ marginTop: '15px', borderTop: '2px dashed rgba(255,255,255,0.15)', paddingTop: '15px' }}>
                <span>Final Score:</span>
                <span>{score} pts</span>
              </div>
            </div>

            <div className="button-row">
              <button className="score-btn score-btn-replay" onClick={handleRestartGame}>
                🔄 Play Again
              </button>
              <button className="score-btn score-btn-exit" onClick={onBack}>
                🚪 Exit to Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlanktonSteal;
