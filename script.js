// 番茄钟核心功能实现

// DOM元素
const minutesDisplay = document.getElementById('minutes');
const secondsDisplay = document.getElementById('seconds');
const timerModeDisplay = document.getElementById('timer-mode');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const focusDurationInput = document.getElementById('focus-duration');
const breakDurationInput = document.getElementById('break-duration');
const saveSettingsBtn = document.getElementById('save-settings');
const todaySessionsDisplay = document.getElementById('today-sessions');
const totalSessionsDisplay = document.getElementById('total-sessions');
const weeklyAverageDisplay = document.getElementById('weekly-average');
const weeklyChartCanvas = document.getElementById('weekly-chart');

// 状态变量
let timerInterval = null;
let isRunning = false;
let isPaused = false;
let currentMode = 'focus'; // 'focus' or 'break'
let remainingTime = 25 * 60;
let focusDuration = 25;
let breakDuration = 5;

// 数据统计
let stats = {
    today: 0,
    total: 0,
    weekly: []
};

// 初始化
function init() {
    loadSettings();
    loadStats();
    updateDisplay();
    updateStatsDisplay();
    initChart();
    
    // 事件监听
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    saveSettingsBtn.addEventListener('click', saveSettings);
}

// 加载设置
function loadSettings() {
    const savedFocus = localStorage.getItem('focusDuration');
    const savedBreak = localStorage.getItem('breakDuration');
    
    if (savedFocus) {
        focusDuration = parseInt(savedFocus);
        focusDurationInput.value = focusDuration;
    }
    
    if (savedBreak) {
        breakDuration = parseInt(savedBreak);
        breakDurationInput.value = breakDuration;
    }
    
    remainingTime = focusDuration * 60;
}

// 保存设置
function saveSettings() {
    focusDuration = parseInt(focusDurationInput.value);
    breakDuration = parseInt(breakDurationInput.value);
    
    localStorage.setItem('focusDuration', focusDuration);
    localStorage.setItem('breakDuration', breakDuration);
    
    resetTimer();
    showNotification('设置已保存');
}

// 加载统计数据
function loadStats() {
    const savedStats = localStorage.getItem('pomodoroStats');
    if (savedStats) {
        stats = JSON.parse(savedStats);
        
        // 检查日期是否为今天
        const today = new Date().toDateString();
        const lastUpdate = localStorage.getItem('lastUpdate');
        
        if (lastUpdate !== today) {
            stats.today = 0;
            localStorage.setItem('lastUpdate', today);
        }
        
        // 保持最近7天的数据
        while (stats.weekly.length > 7) {
            stats.weekly.shift();
        }
    } else {
        // 初始化统计数据
        const today = new Date().toLocaleDateString('zh-CN', { weekday: 'short' });
        stats.weekly.push({ day: today, count: 0 });
    }
}

// 保存统计数据
function saveStats() {
    localStorage.setItem('pomodoroStats', JSON.stringify(stats));
}

// 更新统计数据
function updateStats() {
    stats.today++;
    stats.total++;
    
    // 更新本周数据
    const today = new Date().toLocaleDateString('zh-CN', { weekday: 'short' });
    const todayEntry = stats.weekly.find(entry => entry.day === today);
    
    if (todayEntry) {
        todayEntry.count++;
    } else {
        stats.weekly.push({ day: today, count: 1 });
        if (stats.weekly.length > 7) {
            stats.weekly.shift();
        }
    }
    
    saveStats();
    updateStatsDisplay();
    updateChart();
}

// 更新统计显示
function updateStatsDisplay() {
    todaySessionsDisplay.textContent = stats.today;
    totalSessionsDisplay.textContent = stats.total;
    
    // 计算周平均
    if (stats.weekly.length > 0) {
        const totalWeekly = stats.weekly.reduce((sum, entry) => sum + entry.count, 0);
        const average = Math.round(totalWeekly / stats.weekly.length);
        weeklyAverageDisplay.textContent = average;
    }
}

// 初始化图表
function initChart() {
    const ctx = weeklyChartCanvas.getContext('2d');
    
    const labels = stats.weekly.map(entry => entry.day);
    const data = stats.weekly.map(entry => entry.count);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '本周完成番茄钟数量',
                data: data,
                borderColor: 'rgba(102, 126, 234, 1)',
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        }
    });
}

// 更新图表
function updateChart() {
    const chart = Chart.getChart(weeklyChartCanvas);
    if (chart) {
        const labels = stats.weekly.map(entry => entry.day);
        const data = stats.weekly.map(entry => entry.count);
        
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update();
    }
}

// 开始计时器
function startTimer() {
    if (!isRunning) {
        isRunning = true;
        isPaused = false;
        
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        
        document.querySelector('.timer-circle').classList.add('active');
        
        timerInterval = setInterval(() => {
            remainingTime--;
            updateDisplay();
            
            if (remainingTime <= 0) {
                completeCycle();
            }
        }, 1000);
    }
}

// 暂停计时器
function pauseTimer() {
    if (isRunning && !isPaused) {
        isPaused = true;
        clearInterval(timerInterval);
        
        pauseBtn.textContent = '继续';
        document.querySelector('.timer-circle').classList.remove('active');
    } else if (isRunning && isPaused) {
        isPaused = false;
        startTimer();
        pauseBtn.textContent = '暂停';
    }
}

// 重置计时器
function resetTimer() {
    isRunning = false;
    isPaused = false;
    clearInterval(timerInterval);
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    pauseBtn.textContent = '暂停';
    
    document.querySelector('.timer-circle').classList.remove('active');
    
    if (currentMode === 'focus') {
        remainingTime = focusDuration * 60;
    } else {
        remainingTime = breakDuration * 60;
    }
    
    updateDisplay();
}

// 完成一个周期
function completeCycle() {
    clearInterval(timerInterval);
    isRunning = false;
    
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    
    document.querySelector('.timer-circle').classList.remove('active');
    
    // 播放提示音
    playNotificationSound();
    
    // 显示通知
    showNotification(currentMode === 'focus' ? '专注时间结束！开始休息吧' : '休息时间结束！开始专注工作');
    
    // 如果是专注时间结束，更新统计
    if (currentMode === 'focus') {
        updateStats();
    }
    
    // 切换模式
    switchMode();
}

// 切换模式
function switchMode() {
    currentMode = currentMode === 'focus' ? 'break' : 'focus';
    
    if (currentMode === 'focus') {
        remainingTime = focusDuration * 60;
        timerModeDisplay.textContent = '专注时间';
    } else {
        remainingTime = breakDuration * 60;
        timerModeDisplay.textContent = '休息时间';
    }
    
    updateDisplay();
}

// 更新显示
function updateDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;
    
    minutesDisplay.textContent = minutes.toString().padStart(2, '0');
    secondsDisplay.textContent = seconds.toString().padStart(2, '0');
}

// 播放提示音
function playNotificationSound() {
    // 创建一个简单的提示音
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);
}

// 显示通知
function showNotification(message) {
    if (Notification.permission === 'granted') {
        new Notification('番茄钟提醒', { body: message });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                new Notification('番茄钟提醒', { body: message });
            }
        });
    }
    
    // 同时显示弹窗
    alert(message);
}

// 请求通知权限
function requestNotificationPermission() {
    if ('Notification' in window) {
        Notification.requestPermission();
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', () => {
    init();
    requestNotificationPermission();
});