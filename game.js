// Mr. White - Social Deduction Party Game

let wordPairs = [];
let players = [];
let gameState = {
    currentPlayerIndex: 0,
    civilianWord: '',
    undercoverWord: '',
    includeUndercover: true,
    votes: {},
    phase: 'setup',
    playOrder: [] // Order of play (indices into players array)
};

// Load word pairs
fetch('words.json')
    .then(r => r.json())
    .then(data => wordPairs = data.pairs)
    .catch(() => {
        // Fallback words if fetch fails
        wordPairs = [
            ["Beach", "Pool"], ["Cat", "Tiger"], ["Coffee", "Tea"],
            ["Pizza", "Burger"], ["Rain", "Snow"], ["Doctor", "Nurse"]
        ];
    });

// DOM Elements
const screens = {
    setup: document.getElementById('setup'),
    reveal: document.getElementById('reveal'),
    game: document.getElementById('game'),
    vote: document.getElementById('vote'),
    elimination: document.getElementById('elimination'),
    gameOver: document.getElementById('gameOver')
};

// Setup Screen
const playerNameInput = document.getElementById('playerName');
const addPlayerBtn = document.getElementById('addPlayer');
const playerList = document.getElementById('playerList');
const includeUndercoverCheckbox = document.getElementById('includeUndercover');
const startGameBtn = document.getElementById('startGame');

// Reveal Screen
const currentPlayerEl = document.getElementById('currentPlayer');
const wordHiddenEl = document.getElementById('wordHidden');
const wordVisibleEl = document.getElementById('wordVisible');
const showWordBtn = document.getElementById('showWord');
const hideWordBtn = document.getElementById('hideWord');
const roleDisplayEl = document.getElementById('roleDisplay');
const wordDisplayEl = document.getElementById('wordDisplay');

// Game Screen
const alivePlayersEl = document.getElementById('alivePlayers');
const startVoteBtn = document.getElementById('startVote');

// Vote Screen
const votePlayersEl = document.getElementById('votePlayers');
const confirmVoteBtn = document.getElementById('confirmVote');

// Elimination Screen
const eliminatedNameEl = document.getElementById('eliminatedName');
const eliminatedRoleEl = document.getElementById('eliminatedRole');
const mrWhiteGuessEl = document.getElementById('mrWhiteGuess');
const guessInputEl = document.getElementById('guessInput');
const submitGuessBtn = document.getElementById('submitGuess');
const skipGuessBtn = document.getElementById('skipGuess');
const continueGameBtn = document.getElementById('continueGame');

// Game Over Screen
const winnerTextEl = document.getElementById('winnerText');
const revealWordsEl = document.getElementById('revealWords');
const finalRolesEl = document.getElementById('finalRoles');
const playAgainBtn = document.getElementById('playAgain');

// Helper Functions
function showScreen(screenName) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screenName].classList.add('active');
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function updatePlayerList() {
    playerList.innerHTML = players.map((p, i) => `
        <li>
            ${p.name}
            <button onclick="removePlayer(${i})">✕</button>
        </li>
    `).join('');
    
    startGameBtn.disabled = players.length < 3;
    startGameBtn.textContent = players.length < 3 
        ? `Start Game (${3 - players.length} more needed)` 
        : `Start Game (${players.length} players)`;
}

function removePlayer(index) {
    players.splice(index, 1);
    updatePlayerList();
}

function addPlayer() {
    const name = playerNameInput.value.trim();
    if (name && !players.find(p => p.name.toLowerCase() === name.toLowerCase())) {
        players.push({ name, role: null, word: null, alive: true });
        playerNameInput.value = '';
        updatePlayerList();
    }
    playerNameInput.focus();
}

function assignRoles() {
    const pair = wordPairs[Math.floor(Math.random() * wordPairs.length)];
    gameState.civilianWord = pair[0];
    gameState.undercoverWord = pair[1];
    gameState.includeUndercover = includeUndercoverCheckbox.checked && players.length >= 4;
    
    // Shuffle players for random role assignment
    const shuffledIndices = shuffle([...Array(players.length).keys()]);
    
    players.forEach((p, i) => {
        p.alive = true;
        p.role = 'civilian';
        p.word = gameState.civilianWord;
    });
    
    // Assign Mr. White
    players[shuffledIndices[0]].role = 'mrwhite';
    players[shuffledIndices[0]].word = null;
    
    // Assign Undercover if enabled and enough players
    if (gameState.includeUndercover) {
        players[shuffledIndices[1]].role = 'undercover';
        players[shuffledIndices[1]].word = gameState.undercoverWord;
    }
    
    // Determine play order - civilians first, then others
    // Shuffle all player indices, then move a civilian to the front
    gameState.playOrder = shuffle([...Array(players.length).keys()]);
    
    // Find first civilian in the shuffled order and move to front
    const firstCivilianIdx = gameState.playOrder.findIndex(i => players[i].role === 'civilian');
    if (firstCivilianIdx > 0) {
        const civilian = gameState.playOrder.splice(firstCivilianIdx, 1)[0];
        gameState.playOrder.unshift(civilian);
    }
}

function renderAlivePlayers() {
    // Show players in play order with numbers
    const alivePlayers = gameState.playOrder.filter(i => players[i].alive);
    
    alivePlayersEl.innerHTML = `
        <div class="play-order-header">Speaking Order:</div>
        ${alivePlayers.map((playerIdx, orderNum) => `
            <div class="player-card" data-index="${playerIdx}">
                <span class="order-number">${orderNum + 1}</span>
                ${players[playerIdx].name}
            </div>
        `).join('')}
        ${players.filter(p => !p.alive).map((p, i) => `
            <div class="player-card eliminated">
                ${p.name} ☠️
            </div>
        `).join('')}
    `;
}

function renderVotePlayers() {
    gameState.votes = {};
    votePlayersEl.innerHTML = players
        .filter(p => p.alive)
        .map((p, i) => {
            const realIndex = players.indexOf(p);
            return `
                <div class="player-card" data-index="${realIndex}" onclick="toggleVote(${realIndex})">
                    ${p.name}
                    <span class="vote-count" id="votes-${realIndex}"></span>
                </div>
            `;
        }).join('');
}

function toggleVote(index) {
    if (gameState.votes[index]) {
        delete gameState.votes[index];
    } else {
        gameState.votes[index] = (gameState.votes[index] || 0) + 1;
    }
    
    // Update vote display
    document.querySelectorAll('#votePlayers .player-card').forEach(card => {
        const idx = parseInt(card.dataset.index);
        const voteEl = document.getElementById(`votes-${idx}`);
        const count = gameState.votes[idx] || 0;
        voteEl.textContent = count > 0 ? `👆 ${count}` : '';
        card.classList.toggle('voted', count > 0);
    });
}

function getEliminatedPlayer() {
    let maxVotes = 0;
    let eliminated = null;
    
    for (const [index, votes] of Object.entries(gameState.votes)) {
        if (votes > maxVotes) {
            maxVotes = votes;
            eliminated = parseInt(index);
        }
    }
    
    return eliminated !== null ? players[eliminated] : null;
}

function checkGameOver() {
    const alive = players.filter(p => p.alive);
    const aliveCivilians = alive.filter(p => p.role === 'civilian');
    const aliveMrWhite = alive.find(p => p.role === 'mrwhite');
    const aliveUndercover = alive.find(p => p.role === 'undercover');
    
    // Mr. White wins if only 2 players left and Mr. White is one of them
    if (alive.length <= 2 && aliveMrWhite) {
        return { winner: 'mrwhite', reason: 'Mr. White survived!' };
    }
    
    // Civilians win if Mr. White and Undercover are eliminated
    if (!aliveMrWhite && !aliveUndercover) {
        return { winner: 'civilians', reason: 'All imposters eliminated!' };
    }
    
    // Undercover wins if only they and civilians remain, and civilians ≤ undercover
    if (!aliveMrWhite && aliveUndercover && aliveCivilians.length <= 1) {
        return { winner: 'undercover', reason: 'Undercover outlasted the civilians!' };
    }
    
    return null;
}

function showGameOver(result) {
    showScreen('gameOver');
    
    const winTexts = {
        civilians: '👥 Civilians Win!',
        mrwhite: '🕵️ Mr. White Wins!',
        undercover: '🤫 Undercover Wins!'
    };
    
    winnerTextEl.textContent = winTexts[result.winner];
    revealWordsEl.innerHTML = `Civilian word: <strong>${gameState.civilianWord}</strong><br>
        Undercover word: <strong>${gameState.undercoverWord}</strong>`;
    
    finalRolesEl.innerHTML = players.map(p => `
        <div class="player-role">
            <span>${p.name}</span>
            <span class="role ${p.role}">${p.role.toUpperCase()}</span>
        </div>
    `).join('');
}

// Event Listeners
addPlayerBtn.addEventListener('click', addPlayer);
playerNameInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') addPlayer();
});

startGameBtn.addEventListener('click', () => {
    assignRoles();
    gameState.currentPlayerIndex = 0;
    showScreen('reveal');
    currentPlayerEl.textContent = players[0].name;
    wordHiddenEl.classList.remove('hidden');
    wordVisibleEl.classList.add('hidden');
});

showWordBtn.addEventListener('click', () => {
    const player = players[gameState.currentPlayerIndex];
    wordHiddenEl.classList.add('hidden');
    wordVisibleEl.classList.remove('hidden');
    
    roleDisplayEl.textContent = player.role.toUpperCase();
    roleDisplayEl.className = `role ${player.role}`;
    
    if (player.role === 'mrwhite') {
        wordDisplayEl.textContent = '???';
    } else {
        wordDisplayEl.textContent = player.word;
    }
});

hideWordBtn.addEventListener('click', () => {
    gameState.currentPlayerIndex++;
    
    if (gameState.currentPlayerIndex >= players.length) {
        // All players have seen their roles
        showScreen('game');
        renderAlivePlayers();
    } else {
        currentPlayerEl.textContent = players[gameState.currentPlayerIndex].name;
        wordHiddenEl.classList.remove('hidden');
        wordVisibleEl.classList.add('hidden');
    }
});

startVoteBtn.addEventListener('click', () => {
    showScreen('vote');
    renderVotePlayers();
});

confirmVoteBtn.addEventListener('click', () => {
    const eliminated = getEliminatedPlayer();
    
    if (!eliminated) {
        alert('Vote for someone first!');
        return;
    }
    
    eliminated.alive = false;
    showScreen('elimination');
    
    eliminatedNameEl.textContent = eliminated.name;
    eliminatedRoleEl.textContent = eliminated.role.toUpperCase();
    eliminatedRoleEl.className = `role ${eliminated.role}`;
    
    if (eliminated.role === 'mrwhite') {
        mrWhiteGuessEl.classList.remove('hidden');
        continueGameBtn.classList.add('hidden');
    } else {
        mrWhiteGuessEl.classList.add('hidden');
        continueGameBtn.classList.remove('hidden');
    }
});

submitGuessBtn.addEventListener('click', () => {
    const guess = guessInputEl.value.trim().toLowerCase();
    const correct = guess === gameState.civilianWord.toLowerCase();
    
    if (correct) {
        showGameOver({ winner: 'mrwhite', reason: 'Mr. White guessed the word!' });
    } else {
        const result = checkGameOver();
        if (result) {
            showGameOver(result);
        } else {
            mrWhiteGuessEl.classList.add('hidden');
            continueGameBtn.classList.remove('hidden');
        }
    }
});

skipGuessBtn.addEventListener('click', () => {
    const result = checkGameOver();
    if (result) {
        showGameOver(result);
    } else {
        mrWhiteGuessEl.classList.add('hidden');
        continueGameBtn.classList.remove('hidden');
    }
});

continueGameBtn.addEventListener('click', () => {
    const result = checkGameOver();
    if (result) {
        showGameOver(result);
    } else {
        showScreen('game');
        renderAlivePlayers();
    }
});

playAgainBtn.addEventListener('click', () => {
    players = [];
    gameState = {
        currentPlayerIndex: 0,
        civilianWord: '',
        undercoverWord: '',
        includeUndercover: true,
        votes: {},
        phase: 'setup',
        playOrder: []
    };
    updatePlayerList();
    showScreen('setup');
});

// New Round with same players
const newRoundBtn = document.getElementById('newRound');
if (newRoundBtn) {
    newRoundBtn.addEventListener('click', () => {
        // Keep players but reset their state
        players.forEach(p => {
            p.role = null;
            p.word = null;
            p.alive = true;
        });
        
        gameState = {
            currentPlayerIndex: 0,
            civilianWord: '',
            undercoverWord: '',
            includeUndercover: includeUndercoverCheckbox.checked,
            votes: {},
            phase: 'setup',
            playOrder: []
        };
        
        // Start new round directly
        assignRoles();
        gameState.currentPlayerIndex = 0;
        showScreen('reveal');
        currentPlayerEl.textContent = players[0].name;
        wordHiddenEl.classList.remove('hidden');
        wordVisibleEl.classList.add('hidden');
        guessInputEl.value = '';
    });
}

// Make removePlayer available globally
window.removePlayer = removePlayer;
window.toggleVote = toggleVote;
