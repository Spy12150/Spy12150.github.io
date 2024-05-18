import React, { useState, useEffect } from "react";
import { useSprings, animated } from 'react-spring';
import "./App.css";

function App() {
  const suits = ["Hearts", "Diamonds", "Clubs", "Spades"];
  const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "Jack", "Queen", "King", "Ace"];

  const [deck, setDeck] = useState([]);
  const [deckSize, setDeckSize] = useState(0); // State for deck size
  const [hiLoCount, setHiLoCount] = useState(0); // State for Hi-Lo count
  const [hiOptIICount, setHiOptIICount] = useState(0); // State for Hi-Opt II count
  const [playerHand, setPlayerHand] = useState([]);
  const [dealerHand, setDealerHand] = useState([]);
  const [dealerVisible, setDealerVisible] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [playerWon, setPlayerWon] = useState(null);
  const [chipCount, setChipCount] = useState(1000);
  const [currentBet, setCurrentBet] = useState(0);
  const [pendingBet, setPendingBet] = useState('');
  const [betCounter, setBetCounter] = useState(0);
  const [winRate, setWinRate] = useState(0);
  const [pushRate, setPushRate] = useState(0); // State for push rate

  useEffect(() => {
    resetDeck();
  }, []);

  const [playerSprings] = useSprings(playerHand.length, index => ({
    from: { transform: 'translateX(-100px)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
    delay: index * 100,
  }), [playerHand.length]);

  function handleBetAmountChange(event) {
    const value = event.target.value;
    const amount = parseInt(value, 10);

    if (value === '') {
      setPendingBet('');
    } else if (!isNaN(amount) && amount >= 0) {
      setPendingBet(amount);
    }
  }

  function confirmBet() {
    const amount = parseInt(pendingBet, 10) || 0;

    if (isNaN(amount) || amount <= 0) {
      alert("Please place a valid bet.");
      return;
    }

    if (amount > chipCount) {
      alert("Bet amount exceeds chip count.");
      return;
    }

    setCurrentBet(amount);
    setChipCount(prevChipCount => prevChipCount - amount);
    setPendingBet('');
    setGameOver(false);
    setPlayerWon(null);
    setBetCounter(prevCounter => prevCounter + 1);
  }

  useEffect(() => {
    if (betCounter > 0 && !gameOver) {
      deal();
    }
  }, [betCounter, gameOver]);

  function createDeck() {
    let newDeck = [];
    for (let i = 0; i < 5; i++) { // Use 5 decks
      for (let suit of suits) {
        for (let rank of ranks) {
          newDeck.push({
            suit,
            rank,
            value: getValue(rank),
            image: `/PNG-cards-1.3/${rank.toLowerCase()}_of_${suit.toLowerCase()}.png`,
          });
        }
      }
    }
    return shuffle(newDeck);
  }

  function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function getValue(rank) {
    if (["Jack", "Queen", "King"].includes(rank)) {
      return 10;
    } else if (rank === "Ace") {
      return 11;
    } else {
      return parseInt(rank);
    }
  }

  function getHiLoValue(rank) {
    if (["2", "3", "4", "5", "6"].includes(rank)) {
      return 1;
    } else if (["10", "Jack", "Queen", "King", "Ace"].includes(rank)) {
      return -1;
    } else {
      return 0;
    }
  }

  function getHiOptIIValue(rank) {
    if (["2", "3", "6", "7"].includes(rank)) {
      return 1;
    } else if (["4", "5"].includes(rank)) {
      return 2;
    } else if (rank === "8") {
      return 0;
    } else if (rank === "9") {
      return 1;
    } else if (["10", "Jack", "Queen", "King", "Ace"].includes(rank)) {
      return -2;
    } else {
      return 0;
    }
  }

  function updateHiLoCount(cards) {
    let count = 0;
    cards.forEach(card => {
      count += getHiLoValue(card.rank);
    });
    setHiLoCount(prevCount => prevCount + count);
  }

  function updateHiOptIICount(cards) {
    let count = 0;
    cards.forEach(card => {
      count += getHiOptIIValue(card.rank);
    });
    setHiOptIICount(prevCount => prevCount + count);
  }

  function resetDeck() {
    const initialDeck = createDeck();
    setDeck(initialDeck);
    setDeckSize(initialDeck.length);
    setHiLoCount(0); // Reset Hi-Lo count
    setHiOptIICount(0); // Reset Hi-Opt II count
  }

  function startGame() {
    resetDeck();
    setChipCount(1000);
    setCurrentBet(0);
    setPendingBet('');
    setPlayerHand([]);
    setDealerHand([]);
    setDealerVisible(false);
    setGameOver(false);
    setPlayerWon(null);
    setBetCounter(0);
    setWinRate(0); // Reset winrate
    setPushRate(0); // Reset push rate
  }

  function deal() {
    if (currentBet <= 0) {
      alert("Please place a bet first.");
      return;
    }

    const newDeck = [...deck];
    const playerInitialHand = [newDeck.pop(), newDeck.pop()];
    const dealerInitialHand = [newDeck.pop(), newDeck.pop()];

    setDeck(newDeck);
    setDeckSize(newDeck.length); // Update deck size
    setPlayerHand(playerInitialHand);
    setDealerHand(dealerInitialHand);
    setDealerVisible(false);
    setGameOver(false);
    setPlayerWon(null);

    // Update Hi-Lo and Hi-Opt II counts excluding the dealer's face-down card
    updateHiLoCount([...playerInitialHand, dealerInitialHand[0]]);
    updateHiOptIICount([...playerInitialHand, dealerInitialHand[0]]);
    calculateWinRate(playerInitialHand, dealerInitialHand, newDeck);
  }

  function hit() {
    if (!gameOver && currentBet > 0) {
      const newDeck = [...deck];
      const newPlayerHand = [...playerHand, newDeck.pop()];
      setDeck(newDeck);
      setDeckSize(newDeck.length); // Update deck size
      setPlayerHand(newPlayerHand);

      // Update Hi-Lo and Hi-Opt II counts
      updateHiLoCount([newPlayerHand[newPlayerHand.length - 1]]);
      updateHiOptIICount([newPlayerHand[newPlayerHand.length - 1]]);

      if (getHandValue(newPlayerHand) > 21) {
        setDealerVisible(true);
        setGameOver(true);
        setPlayerWon(false);
      } else {
        calculateWinRate(newPlayerHand, dealerHand, newDeck);
      }
    }
  }

  function stand() {
    if (currentBet > 0) {
      let newDealerHand = [...dealerHand];
      const newDeck = [...deck];
      setDealerVisible(true);

      // Update Hi-Lo and Hi-Opt II counts for the dealer's face-down card when it is revealed
      updateHiLoCount([dealerHand[1]]);
      updateHiOptIICount([dealerHand[1]]);

      let dealerHandValue = getHandValue(newDealerHand);
      while (dealerHandValue < 17) {
        newDealerHand.push(newDeck.pop());
        dealerHandValue = getHandValue(newDealerHand);
      }

      setDeck(newDeck);
      setDeckSize(newDeck.length); // Update deck size
      setDealerHand(newDealerHand);

      // Update Hi-Lo and Hi-Opt II counts for new dealer cards
      updateHiLoCount(newDealerHand.slice(dealerHand.length));
      updateHiOptIICount(newDealerHand.slice(dealerHand.length));

      const playerScore = getHandValue(playerHand);
      const dealerScore = dealerHandValue;

      if (dealerScore > 21 || playerScore > dealerScore) {
        setPlayerWon(true);
        setChipCount(prevChipCount => prevChipCount + currentBet * 2);
      } else if (playerScore < dealerScore) {
        setPlayerWon(false);
      } else {
        setPlayerWon(null);
        setChipCount(prevChipCount => prevChipCount + currentBet);
      }

      setGameOver(true);
    } else {
      alert("Please place a bet before standing.");
    }
  }

  function getHandValue(hand) {
    let value = hand.reduce((acc, card) => acc + card.value, 0);
    let aces = hand.filter((card) => card.rank === "Ace").length;

    while (value > 21 && aces > 0) {
      value -= 10; // Adjust for Ace
      aces -= 1;
    }

    return value;
  }

  function calculateWinRate(playerHand, dealerHand, deck) {
    const playerValue = getHandValue(playerHand);
    const dealerUpCard = dealerHand[0];
  
    let wins = 0;
    let pushes = 0;
    const totalSimulations = 10000; // Number of simulations
  
    for (let i = 0; i < totalSimulations; i++) {
      const newDeck = shuffle([...deck]);
      let dealerSimulationHand = [dealerUpCard, newDeck.pop()];
  
      // Simulate dealer's play
      let dealerValue = getHandValue(dealerSimulationHand);
      while (dealerValue < 17) {
        dealerSimulationHand.push(newDeck.pop());
        dealerValue = getHandValue(dealerSimulationHand);
      }
  
      // Determine the outcome for this simulation
      if (playerValue === 21 && playerHand.length === 2) {
        // Player has a blackjack
        if (dealerValue === 21 && dealerSimulationHand.length === 2) {
          pushes++;
        } else {
          wins++;
        }
      } else if (dealerValue > 21 || playerValue > dealerValue) {
        wins++;
      } else if (playerValue === dealerValue) {
        pushes++;
      }
    }
  
    const winRatePercentage = (wins / totalSimulations) * 100;
    const pushRatePercentage = (pushes / totalSimulations) * 100;
    setWinRate(winRatePercentage);
    setPushRate(pushRatePercentage);
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ivory's Blackjack</h1>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <div>
            <button onClick={startGame} style={{ marginRight: '10px' }}>Reset Game</button>
          </div>
          <div className="chip-count">
            Chips: {chipCount}
          </div>
          <div className="deck-count">
            Cards left: {deckSize} {/* Display the number of cards left in the deck */}
            <p>Hi-Lo Count: {hiLoCount}</p> {/* Display the Hi-Lo count */}
            <p>Hi-Opt II Count: {hiOptIICount}</p> {/* Display the Hi-Opt II count */}
          </div>
        </div>
        <div className="betting-controls" style={{ marginTop: '20px' }}>
          <input
            type="number"
            value={pendingBet}
            onChange={handleBetAmountChange}
            placeholder="Place your bet"
            style={{ marginRight: '10px' }}
          />
          <button onClick={confirmBet}>Place Bet</button>
        </div>
        <div className="hand">
          <h2>Player's Hand ({getHandValue(playerHand)})</h2>
          <div className="cards">
            {playerSprings.map((styles, index) => (
              <animated.div style={styles} key={index}>
                <img
                  src={playerHand[index].image}
                  alt={`${playerHand[index].rank} of ${playerHand[index].suit}`}
                  style={{ width: '100px', height: 'auto', marginRight: '5px' }}
                />
              </animated.div>
            ))}
          </div>
          {!gameOver && (
            <div style={{ marginTop: '20px' }}>
              <button onClick={hit} style={{ marginRight: '10px' }}>Hit</button>
              <button onClick={stand}>Stand</button>
            </div>
          )}
          <div className="winrate">
            <p>Player Winrate: {winRate.toFixed(2)}%</p>
            <p>Chance to Push: {pushRate.toFixed(2)}%</p> {/* Display push rate */}
          </div>
        </div>
        <div className="hand">
          <h2>Dealer's Hand ({dealerVisible ? getHandValue(dealerHand) : '?'})</h2>
          <div className="cards">
            {dealerHand.map((card, index) => (
              <img
                key={index}
                src={dealerVisible || index === 0 ? card.image : "/PNG-cards-1.3/cardback.png"}
                alt={dealerVisible || index === 0 ? `${card.rank} of ${card.suit}` : "Hidden Card"}
                style={{ width: '100px', height: 'auto', marginRight: '5px' }}
              />
            ))}
          </div>
        </div>
        {gameOver && (
          <div className="outcome" style={{ marginTop: '20px' }}>
            {playerWon === true && <p>You won!</p>}
            {playerWon === false && <p>You lost!</p>}
            {playerWon === null && <p>It's a tie!</p>}
          </div>
        )}
      </header>
    </div>
  );
}

export default App;

