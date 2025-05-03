const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const statusDisplay = document.getElementById('status');

let timer;
let timeLeft = 1 * 60; // 1 minute in seconds
let isPaused = true;
let isWorkSession = true;

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function startTimer() {
    if (isPaused) {
        isPaused = false;
        timer = setInterval(() => {
            if (timeLeft > 0) {
                timeLeft--;
                updateDisplay();
            } else {
                clearInterval(timer);
                // Switch between work and break sessions
                isWorkSession = !isWorkSession;
                timeLeft = isWorkSession ? 1 * 60 : 5 * 60; // 1 min work, 5 min break
                statusDisplay.textContent = isWorkSession ? '工作' : '休息';
                alert(isWorkSession ? '休息结束，开始工作！' : '工作结束，开始休息！');
                updateDisplay();
                // Automatically start the next session or pause
                // For simplicity, we'll pause here. User needs to press start again.
                isPaused = true;
            }
        }, 1000);
    }
}

function pauseTimer() {
    isPaused = true;
    clearInterval(timer);
}

function resetTimer() {
    isPaused = true;
    clearInterval(timer);
    isWorkSession = true;
    timeLeft = 1 * 60;
    statusDisplay.textContent = '工作';
    updateDisplay();
}

startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Initial display
updateDisplay();

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