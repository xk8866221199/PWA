// Timer Components
const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const skipBtn = document.getElementById('skip-btn'); // New Skip Button
const statusDisplay = document.getElementById('status');
const sessionCounterDisplay = document.getElementById('session-counter-display'); // New Session Counter

// Settings Inputs
const workDurationInput = document.getElementById('work-duration');
const shortBreakDurationInput = document.getElementById('short-break-duration');
const longBreakDurationInput = document.getElementById('long-break-duration');
const longBreakIntervalInput = document.getElementById('long-break-interval');
const autoStartCheckbox = document.getElementById('auto-start-checkbox');
const muteSoundCheckbox = document.getElementById('mute-sound-checkbox');
const alarmSoundSelect = document.getElementById('alarm-sound-select');
const volumeControlRange = document.getElementById('volume-control-range');
const tickingSoundCheckbox = document.getElementById('ticking-sound-checkbox');
const darkModeToggleBtn = document.getElementById('dark-mode-toggle');

// Task Management Elements
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');

let timer; // Holds the setInterval object
let timeLeft; // Current time left in seconds
let isPaused = true; // Timer starts paused
let currentSessionType = 'work'; // 'work', 'shortBreak', or 'longBreak'
let pomodorosCompleted = 0; // Counter for completed work sessions

// Audio Objects
const notificationSound = new Audio(); // Src will be set dynamically
const tickSound = new Audio('assets/tick-tock.mp3'); // Path for ticking sound

// Helper function to get and parse integer value from input fields
function getInputValueById(id, defaultValue) {
    const inputElement = document.getElementById(id);
    if (!inputElement) {
        console.warn(`Input element with id '${id}' not found. Using default value: ${defaultValue}`);
        return defaultValue;
    }
    const value = parseInt(inputElement.value, 10);
    if (isNaN(value) || value <= 0) {
        return defaultValue;
    }
    return value;
}

function getDuration(type) {
    switch (type) {
        case 'work':
            return getInputValueById('work-duration', 25) * 60;
        case 'shortBreak':
            return getInputValueById('short-break-duration', 5) * 60;
        case 'longBreak':
            return getInputValueById('long-break-duration', 15) * 60;
        default:
            return getInputValueById('work-duration', 25) * 60;
    }
}

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateSessionCounterDisplay() {
    const targetPomodoros = getInputValueById('long-break-interval', 4);
    if (sessionCounterDisplay) {
        sessionCounterDisplay.textContent = `Pomodoros: ${pomodorosCompleted}/${targetPomodoros}`;
    }
}

function playNotificationSound() {
    if (muteSoundCheckbox && !muteSoundCheckbox.checked) {
        if (alarmSoundSelect && volumeControlRange) {
            notificationSound.src = alarmSoundSelect.value;
            notificationSound.volume = parseFloat(volumeControlRange.value);
            notificationSound.play().catch(error => console.warn("Error playing notification sound:", error));
        }
    }
}

// Desktop Notification Logic
function requestNotificationPermission() {
    if (!("Notification" in window)) {
        console.log("This browser does not support desktop notification");
    } else if (Notification.permission === "default") {
        Notification.requestPermission().then(permission => {
            if (permission === "granted") {
                console.log("Notification permission granted.");
            } else {
                console.log("Notification permission denied.");
            }
        });
    }
}

function showDesktopNotification(sessionType) {
    if (Notification.permission === "granted") {
        let title = "Zen Pomodoro Timer";
        let body = "";
        let sessionName = "";

        // Get the user-facing name for the session type
        if (sessionType === 'work') sessionName = "Work";
        else if (sessionType === 'shortBreak') sessionName = "Short Break";
        else if (sessionType === 'longBreak') sessionName = "Long Break";

        if (currentSessionType === 'work') { // Message for the session that just ENDED
             // This logic is a bit tricky: currentSessionType is already updated to the *next* session.
             // So if currentSessionType is "Work", it means a break just ended.
             // Let's adjust to reflect the session that IS STARTING.
            body = `Time to focus! ${sessionName} session starting.`;
        } else if (currentSessionType === 'shortBreak' || currentSessionType === 'longBreak') {
            body = `Time for a ${sessionName.toLowerCase()}!`;
        } else {
            body = "Session ended!"; // Fallback
        }
        
        // More accurate message based on the next session starting
        if (sessionType === 'work') {
            body = "Time to focus! Work session starting.";
        } else if (sessionType === 'shortBreak') {
            body = "Time for a short break!";
        } else if (sessionType === 'longBreak') {
            body = "Time for a long break!";
        } else { // Should not happen with current types
            body = "Next session starting!";
        }


        const notification = new Notification(title, {
            body: body,
            icon: 'icons/icon-192x192.png' // Assuming .png, check actual filename
        });
    }
}


function startNextSession() {
    clearInterval(timer);

    // Determine the session that just ended to correctly update pomodorosCompleted
    const sessionJustEnded = currentSessionType;

    if (sessionJustEnded === 'work') {
        pomodorosCompleted++;
        const longBreakIntervalValue = getInputValueById('long-break-interval', 4);
        if (pomodorosCompleted > 0 && pomodorosCompleted % longBreakIntervalValue === 0) {
            currentSessionType = 'longBreak';
            statusDisplay.textContent = 'Long Break';
        } else {
            currentSessionType = 'shortBreak';
            statusDisplay.textContent = 'Short Break';
        }
    } else { // A break session just ended
        if (sessionJustEnded === 'longBreak') {
            pomodorosCompleted = 0; // Reset pomodoros only after a long break
        }
        currentSessionType = 'work';
        statusDisplay.textContent = 'Work';
    }

    timeLeft = getDuration(currentSessionType);
    updateDisplay();
    updateSessionCounterDisplay(); 
    playNotificationSound();
    showDesktopNotification(currentSessionType); // Show notification for the new session

    if (autoStartCheckbox && autoStartCheckbox.checked) {
        startTimer(); 
    } else {
        pauseTimer();
    }
}

function startTimer() {
    if (isPaused) {
        isPaused = false;
        if (startBtn) startBtn.textContent = 'Pause';

        if (timeLeft === undefined || timeLeft === getDuration(currentSessionType)) {
            timeLeft = getDuration(currentSessionType);
        }
        updateDisplay(); // Ensure display is correct before interval starts

        // Start ticking sound if enabled
        if (tickingSoundCheckbox && tickingSoundCheckbox.checked) {
            if (tickSound && volumeControlRange) {
                tickSound.loop = true;
                tickSound.volume = parseFloat(volumeControlRange.value);
                tickSound.play().catch(e => console.warn("Error playing tick sound:", e));
            }
        }

        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                // Time has run out
                // pauseTimer() will be called by startNextSession if not auto-starting,
                // or implicitly handled if auto-starting.
                // The interval calls startNextSession, which then decides to call startTimer or pauseTimer.
                // So we don't need to explicitly call pauseTimer() here before startNextSession.
                startNextSession();
            }
        }, 1000);
    } else {
        pauseTimer();
    }
}

function pauseTimer() {
    isPaused = true;
    clearInterval(timer);
    if (startBtn) startBtn.textContent = 'Start';
    if (tickSound) tickSound.pause(); // Stop ticking sound when timer is paused
}

function resetTimer() {
    pauseTimer(); // This will also pause tickSound
    if (tickSound) tickSound.currentTime = 0; // Reset ticking sound position

    pomodorosCompleted = 0;
    currentSessionType = 'work';
    timeLeft = getDuration('work');
    statusDisplay.textContent = 'Work';
    updateDisplay();
    updateSessionCounterDisplay(); // Update counter on reset
}

// Event Listeners for Controls
if (startBtn) startBtn.addEventListener('click', startTimer);
if (resetBtn) resetBtn.addEventListener('click', resetTimer);
if (skipBtn) {
    skipBtn.addEventListener('click', () => {
        pauseTimer(); // Stop current timer and set button to "Start"
        startNextSession(); // Setup and potentially auto-start next session
    });
}

// Event Listeners for Settings Inputs
if (workDurationInput) {
    workDurationInput.addEventListener('input', () => {
        if (isPaused && currentSessionType === 'work') {
            timeLeft = getDuration('work');
            updateDisplay();
        }
    });
}
if (shortBreakDurationInput) {
    shortBreakDurationInput.addEventListener('input', () => {
        if (isPaused && currentSessionType === 'shortBreak') {
            timeLeft = getDuration('shortBreak');
            updateDisplay();
        }
    });
}
if (longBreakDurationInput) {
    longBreakDurationInput.addEventListener('input', () => {
        if (isPaused && currentSessionType === 'longBreak') {
            timeLeft = getDuration('longBreak');
            updateDisplay();
        }
    });
}
if (longBreakIntervalInput) {
    longBreakIntervalInput.addEventListener('input', () => {
        if (isPaused) { // Update counter display if interval changes while paused
            updateSessionCounterDisplay();
        }
    });
}

// Event Listeners for Sound Settings
if (volumeControlRange) {
    volumeControlRange.addEventListener('input', function() {
        if (tickSound && !tickSound.paused) { // If ticking sound is currently playing
            tickSound.volume = parseFloat(this.value);
        }
        // Also update notification sound volume for next play, or test play
        if (notificationSound) { // Check if notificationSound is initialized
             notificationSound.volume = parseFloat(this.value);
        }
    });
}

if (tickingSoundCheckbox) {
    tickingSoundCheckbox.addEventListener('change', function() {
        if (this.checked) {
            if (!isPaused && tickSound && volumeControlRange) { // Only start if timer is running
                tickSound.loop = true;
                tickSound.volume = parseFloat(volumeControlRange.value);
                tickSound.play().catch(e => console.warn("Error playing tick sound:", e));
            }
        } else {
            if (tickSound) {
                tickSound.pause();
            }
        }
    });
}


// Task Management Logic
function addNewTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') {
        // Optionally, show an alert or message if task is empty
        return;
    }

    const li = document.createElement('li');
    li.textContent = taskText;
    li.addEventListener('click', () => {
        li.classList.toggle('completed');
        // Optional: Could also add a button for explicit deletion here
    });

    taskList.appendChild(li);
    taskInput.value = ''; // Clear input field
    taskInput.focus(); // Keep focus on input for adding more tasks
}

if (addTaskBtn) {
    addTaskBtn.addEventListener('click', addNewTask);
}
// Allow adding tasks by pressing Enter in the input field
if (taskInput) {
    taskInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault(); // Prevent default form submission if it were in a form
            addNewTask();
        }
    });
}


// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    applyPersistedTheme(); // Apply theme before resetting timer or other UI updates
    resetTimer(); 
    requestNotificationPermission(); 
});

// Dark Mode Logic
function applyPersistedTheme() {
    const darkModeEnabled = localStorage.getItem('darkModeEnabled');
    if (darkModeEnabled === 'true') {
        document.body.classList.add('dark-mode');
    }
    // Optional: Update toggle button text/state if it's more than a simple button
    if (darkModeToggleBtn) {
        // Example: darkModeToggleBtn.textContent = document.body.classList.contains('dark-mode') ? "Light Mode" : "Dark Mode";
    }
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkModeEnabled', document.body.classList.contains('dark-mode'));
    // Optional: Update toggle button text/state
    if (darkModeToggleBtn) {
         // Example: darkModeToggleBtn.textContent = document.body.classList.contains('dark-mode') ? "Light Mode" : "Dark Mode";
    }
}

if (darkModeToggleBtn) {
    darkModeToggleBtn.addEventListener('click', toggleDarkMode);
}

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            }, err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}