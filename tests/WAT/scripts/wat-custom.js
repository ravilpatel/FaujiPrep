// DOM Elements
const instructionScreen = document.getElementById('instruction-screen');
const testScreen = document.getElementById('test-screen');
const completionScreen = document.getElementById('completion-screen');

const understandCheckbox = document.getElementById('understand-checkbox');
const startBtn = document.getElementById('start-btn');
const wordCountSelect = document.getElementById('word-count-select');

const currentWordEl = document.getElementById('current-word');
const wordCounterEl = document.getElementById('word-counter');
const timerEl = document.getElementById('timer');

// Test State
let words = [];
let currentWordIndex = 0;
let isTestRunning = false;
let timeRemaining = 15;
let timerInterval;

let TOTAL_WORDS = 60;
const TIME_PER_WORD = 15; // in seconds

const rawLibrary = [
    "Book", "River", "Friend", "Window", "Courage", "Chair", "Market", "School", "Family", "Road",
    "Problem", "Tree", "Money", "Teacher", "Child", "Water", "Village", "Train", "Respect", "Night",
    "Work", "Garden", "Fear", "Smile", "Time", "Success", "Home", "Mountain", "Help", "Duty",
    "Choice", "Table", "Leader", "Rain", "Goal", "Discipline", "Bread", "Team", "Freedom", "Bridge",
    "Truth", "Responsibility", "Bag", "Trust", "Car", "Patience", "Future", "Decision", "Wall", "Service",
    "Journey", "Love", "Pencil", "Character", "Flower", "Learning", "Effort", "Honesty", "Plan", "House",
    "Bus", "Society", "Action", "Growth", "Change", "Strength", "Peace", "Student", "Hill",
    "Bottle", "Door", "Opportunity", "Weakness", "Mother", "Father", "Sister", "Brother",
    "Play", "Failure", "Fight", "Solution", "Sky", "Ocean", "Star", "Earth",
    "Light", "Darkness", "Bird", "Fish", "Animal", "Hospital", "Doctor", "Health", "Energy",
    "Power", "Sleep", "Wake", "Morning", "Evening", "Noon", "Summer", "Winter", "Spring",
    "Cloud", "Storm", "Wind", "Fire", "Plant", "Grass", "Field", "Farm", "Fruit", "Apple",
    "Orange", "Mango", "Milk", "Tea", "Coffee", "Plate", "Spoon", "Knife", "Kitchen", "Food",
    "Waterfall", "Lake", "Sea", "Boat", "Ship", "Station", "Airport", "Ticket", "Travel",
    "Driver", "Cycle", "Helmet", "Safety", "Police", "Law", "Judge", "Court", "Rule", "System",
    "Exam", "Result", "Knowledge", "Wisdom", "Skill", "Talent", "Hobby", "Music", "Dance", "Song",
    "Movie", "Camera", "Phone", "Laptop", "Internet", "Message", "Letter", "Newspaper", "Magazine", "Story",
    "Picture", "Mirror", "Clock", "Watch", "Calendar", "Date", "Birthday", "Festival", "Holiday", "Prayer",
    "Temple", "Schoolbag", "Uniform", "Class", "Homework", "Test", "College", "Degree", "Career", "Office",
    "Manager", "Worker", "Factory", "Machine", "Tool", "Hammer", "Nail", "Building", "Construction", "Engineer",
    "Science", "Technology", "Innovation", "Robot", "Computer", "Battery", "Wire", "Circuit", "Motor", "Vehicle",
    "Petrol", "Diesel", "Traffic", "Signal", "Crossing", "Street", "City", "Town", "Population", "Nation",
    "Country", "Flag", "Citizen", "Vote", "Rights", "Army", "Navy", "Air",
    "Soldier", "Bravery", "Sacrifice", "Victory", "Defeat", "Risk", "Mission",
    "Speed", "Slow", "Fast", "Delay", "Hurry", "Wait", "Queue", "Crowd", "Alone", "Together",
    "Support", "Cooperation", "Competition", "Win", "Lose", "Try", "Practice", "Improvement",
    "Sex", "Adult", "Adventure", "Kill", "Blood", "Death",
    "Hate", "Anger", "Enemy", "Loss", "Pain", "Crime", "Accident",
    "Danger", "Fearful", "Violence", "Break", "Punishment", "Alcohol", "Smoke",
    "Addiction", "Lie", "Cheat", "Jealousy", "Divorce", "Marriage",
    "War", "Attack", "Defend", "Weapon", "Greed", "Poverty", "Rich",
    "Hungry", "Thief", "Jail", "Corruption", "Politics",
    "Injury", "Emergency",
    "Stranger", "Betrayal",
    "Mistake", "Pressure", "Stress", "Challenge",
    "Past", "Memory", "Dream", "Dark",
    "Dangerous", "Safe", "Escape", "Survival", "Rescue", "Dead", "Life", "Birth",
    "Prison", "Truthful", "Honest", "Weak", "Strong", "Brave", "Lazy", "Active",
    "Control", "Surrender", "Habit",
    "Correction", "Advice", "Guidance", "Mentor", "Inspiration", "Motivation", "Vision",
    "Target", "Aim", "Focus", "Attention", "Thought", "Idea", "Creativity", "Art", "Design",
    "Colour", "White", "Black", "Blue", "Green", "Red", "Yellow", "Pink", "Purple",
    "Stone", "Sand", "Soil", "Earthquake", "Rainfall", "Drought", "Climate", "Nature", "Forest",
    "Wildlife", "Tiger", "Lion", "Elephant", "Dog", "Cat", "Horse", "Cow", "Peacock",
    "Nest", "Egg", "Feather", "Flight", "Oxygen", "Breath", "Exercise", "Running",
    "Walking", "Sports", "Cricket", "Football", "Hockey", "Swimming", "Fitness", "Yoga", "Training", "Coach",
    "Captain", "Teamwork", "Unity", "Bond", "Friendship", "Relation", "Emotion", "Happiness", "Sadness",
    "Calm", "Relaxation", "Balance", "Routine", "Lifestyle",
    "Cleanliness", "Hygiene", "Pollution", "Environment", "Plastic", "Recycling", "Waste", "Dust", "Noise",
    "Silence", "Sound", "Voice", "Speech", "Language", "Communication", "Discussion", "Debate", "Question", "Answer",
    "Reading", "Writing", "Drawing", "Painting", "Teaching", "Listening", "Observation", "Analysis", "Thinking",
    "Priority", "Planning", "Schedule", "Deadline", "Project", "Meeting", "Leadership",
    "Integrity", "Loyalty", "Kindness", "Care", "Compassion", "Humanity",
    "Donate", "Charity", "Volunteer", "Alert",
    "Awareness", "Education", "Literacy", "Equality", "Justice", "Progress", "Development", "Economy", "Business", "Industry",
    "Shop", "Customer", "Seller", "Product", "Price", "Budget", "Saving", "Investment", "Wallet", "Account",
    "Bank", "Finance", "Loan", "Tax", "Salary", "Income", "Expense", "Profit", "Market",
    "Trade", "Agriculture", "Farmer", "Crop", "Harvest", "Seed", "Fertilizer", "Irrigation", "Tractor", "Dairy",
    "Library", "Laboratory", "Research", "Discovery", "Experiment", "Formula", "Number", "Mathematics", "Physics", "Chemistry",
    "Biology", "History", "Geography", "Culture", "Tradition", "Heritage", "Identity", "Community",
    "Neighbour", "Guest", "Host", "Celebration", "Gift", "Surprise", "Laugh", "Cry",
    "Hope", "Faith", "Confidence", "Doubt", "Experience", "Path", "Direction",
    "Compass", "Map", "Destination", "Exploration", "Achievement",
    "Medal", "Award", "Recognition", "Appreciation", "Contribution", "Initiative", "Commitment",
    "Hardwork", "Consistency", "Determination"
];

// Utility function to shuffle an array
function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

// Prepare word list by deduplicating and shuffling
function setupWords(count) {
    const uniqueWords = [...new Set(rawLibrary)];
    const shuffledWords = shuffleArray(uniqueWords);
    return shuffledWords.slice(0, count);
}

// Initialization
function init() {
    // Checkbox listener to enable start button
    understandCheckbox.addEventListener('change', (e) => {
        startBtn.disabled = !e.target.checked;
    });

    // Start Button listener
    startBtn.addEventListener('click', startTest);
}

// Start sequence
async function startTest() {
    const selectedCount = parseInt(wordCountSelect.value, 10);
    TOTAL_WORDS = selectedCount;
    words = setupWords(TOTAL_WORDS);

    isTestRunning = true;
    
    // Request fullscreen mode immediately
    try {
        if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            await document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            await document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
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
    wordCounterEl.textContent = Word  / ;
    
    // Timer logic - Date.now() ensures accuracy even if browser tab loses focus
    const switchTime = Date.now() + (TIME_PER_WORD * 1000);
    timeRemaining = TIME_PER_WORD;
    timerEl.textContent = ${timeRemaining} sec;
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const now = Date.now();
        const expectedTimeRemaining = Math.max(0, Math.ceil((switchTime - now) / 1000));
        
        // Only update DOM if the second has changed
        if (timeRemaining !== expectedTimeRemaining) {
             timeRemaining = expectedTimeRemaining;
             timerEl.textContent = ${timeRemaining} sec;
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
