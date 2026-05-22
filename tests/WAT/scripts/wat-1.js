// DOM Elements
const instructionScreen = document.getElementById('instruction-screen');
const testScreen = document.getElementById('test-screen');
const completionScreen = document.getElementById('completion-screen');

const understandCheckbox = document.getElementById('understand-checkbox');
const startBtn = document.getElementById('start-btn');

const currentWordEl = document.getElementById('current-word');
const wordCounterEl = document.getElementById('word-counter');
const timerEl = document.getElementById('timer');

// Test State
let words = [];
let currentWordIndex = 0;
let isTestRunning = false;
let timeRemaining = 15;
let timerInterval;

const TOTAL_WORDS = 60;
const TIME_PER_WORD = 15; // in seconds

// Mocking the backend API load - this is where you'd fetch from your backend/database/API
async function fetchWords() {
    // Generated list of 60 typical WAT words as fallback/mock
    const defaultWords = [
        "Book", "Chair", "Apple", "Social", "River", "Bottle", "Pencil", "Cloud", "Mirror", "Signature",
"Plant", "Bag", "Phone", "Mountain", "Bread", "Clock", "Market", "Fan", "Rain", "Shoe",
"Door", "Garden", "Ball", "Train", "Cup", "Tree", "Sex", "Star", "Bridge", "Flower",
"School", "Hero", "Bus", "Beach", "Pen", "Light", "Carpet", "Bird", "Cake", "Wall",
"Fish", "Key", "Farm", "Leaf", "Glass", "Toy", "Hill", "Basket", "Moon", "Camera",
"Stone", "Boat", "Street", "Orange", "Pillow", "Umbrella", "College", "Window", "Market", "Tunnel"
    ];

    try {
        // Preload upcoming words dynamically
        // Example integration: 
        // const response = await fetch('/api/wat-words');
        // words = await response.json();
        
        words = defaultWords;
        
        // Ensure exactly 60 words
        if (words.length > TOTAL_WORDS) words = words.slice(0, TOTAL_WORDS);
        while (words.length < TOTAL_WORDS) words.push("Target " + (words.length + 1));
        
    } catch (error) {
        console.error("Failed to load words, using fallback.", error);
        words = defaultWords;
    }
}

// Initialization
async function init() {
    await fetchWords();
    
    // Checkbox listener to enable start button
    understandCheckbox.addEventListener('change', (e) => {
        startBtn.disabled = !e.target.checked;
    });

    // Start Button listener
    startBtn.addEventListener('click', startTest);
}

// Start sequence
async function startTest() {
    isTestRunning = true;
    
    // Request fullscreen mode immediately
    try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
            await document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari & Opera */
            await document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
            await document.documentElement.msRequestFullscreen();
        }
    } catch (e) {
        console.warn("Fullscreen request failed", e);
    }

    // Hide instructions, show test screen
    instructionScreen.classList.remove('active');
    testScreen.classList.add('active');
    
    currentWordIndex = 0;
    showWord();
}

// Core test loop
function showWord() {
    if (currentWordIndex >= TOTAL_WORDS) {
        endTest();
        return;
    }

    // Set UI for current word
    currentWordEl.textContent = words[currentWordIndex];
    wordCounterEl.textContent = `Word ${currentWordIndex + 1} / ${TOTAL_WORDS}`;
    
    // Timer logic - Date.now() ensures accuracy even if browser tab loses focus
    const switchTime = Date.now() + (TIME_PER_WORD * 1000);
    timeRemaining = TIME_PER_WORD;
    timerEl.textContent = `${timeRemaining} sec`;
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const now = Date.now();
        const expectedTimeRemaining = Math.max(0, Math.ceil((switchTime - now) / 1000));
        
        // Only update DOM if the second has changed
        if (timeRemaining !== expectedTimeRemaining) {
             timeRemaining = expectedTimeRemaining;
             timerEl.textContent = `${timeRemaining} sec`;
        }

        // Timer completion
        if (now >= switchTime) {
            clearInterval(timerInterval);
            currentWordIndex++;
            showWord(); // Trigger next word seamlessly
        }
    }, 100); // 100ms interval for high responsiveness
}

function endTest() {
    isTestRunning = false;
    clearInterval(timerInterval);
    
    // Gracefully exit fullscreen
    if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.warn(err));
    }

    testScreen.classList.remove('active');
    completionScreen.classList.add('active');
}

// Anti-Cheat / Integrity features
// Prevent accidental refresh or navigation
window.addEventListener('beforeunload', (e) => {
    if (isTestRunning) {
        const msg = "Test is in progress. Are you sure you want to leave? Your progress will be lost.";
        e.preventDefault();
        e.returnValue = msg;
        return msg;
    }
});

// Enforce fullscreen during the test
document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement && isTestRunning) {
        const userWantsToReturn = confirm("You have exited fullscreen.\n\nThe WAT requires structural discipline and focus. Please return to fullscreen mode to continue without distraction.");
        if (userWantsToReturn) {
            document.documentElement.requestFullscreen().catch(e => console.error(e));
        }
    }
});

// Start the setup
init();