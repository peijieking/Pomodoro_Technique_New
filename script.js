class PomodoroTimer {
    constructor() {
        // DOM 元素
        this.minutesElement = document.getElementById('minutes');
        this.secondsElement = document.getElementById('seconds');
        this.timerStatusElement = document.getElementById('timerStatus');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.focusTimeInput = document.getElementById('focusTime');
        this.breakTimeInput = document.getElementById('breakTime');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.totalPomodorosElement = document.getElementById('totalPomodoros');
        this.totalTimeElement = document.getElementById('totalTime');
        this.chartCanvas = document.getElementById('pomodoroChart');
        this.customModal = document.getElementById('customModal');
        this.modalMessage = document.getElementById('modalMessage');
        this.focusPresetTimes = document.getElementById('focusPresetTimes');
        this.breakPresetTimes = document.getElementById('breakPresetTimes');

        // 状态变量
        this.isRunning = false;
        this.isPaused = false;
        this.currentMode = 'focus'; // 'focus' 或 'break'
        this.timeLeft = 25 * 60;
        this.timerInterval = null;

        // 设置默认值
        this.settings = {
            focusTime: 25,
            breakTime: 5
        };

        // 统计数据
        this.stats = this.loadStats();

        // 图表实例
        this.chart = null;

        this.init();
    }

    init() {
        // 加载保存的设置
        this.loadSettings();

        // 绑定事件
        this.bindEvents();

        // 更新显示
        this.updateDisplay();
        this.updateStats();
        this.initChart();
    }

    bindEvents() {
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        // 绑定预设时间按钮事件
        this.focusPresetTimes.addEventListener('click', (e) => this.handlePresetTimeClick(e, 'focus'));
        this.breakPresetTimes.addEventListener('click', (e) => this.handlePresetTimeClick(e, 'break'));
    }

    start() {
        if (this.isRunning) return;

        this.isRunning = true;
        this.isPaused = false;
        this.startBtn.disabled = true;
        this.pauseBtn.disabled = false;
        this.timerStatusElement.textContent = this.currentMode === 'focus' ? '专注中...' : '休息中...';

        // 添加动画效果
        document.querySelector('.timer-circle').classList.add('running');

        this.timerInterval = setInterval(() => {
            this.timeLeft--;

            if (this.timeLeft <= 0) {
                this.onTimerComplete();
            } else {
                this.updateDisplay();
            }
        }, 1000);
    }

    pause() {
        if (!this.isRunning) return;

        this.isRunning = false;
        this.isPaused = true;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.timerStatusElement.textContent = this.currentMode === 'focus' ? '专注已暂停' : '休息已暂停';

        // 移除动画效果
        document.querySelector('.timer-circle').classList.remove('running');

        clearInterval(this.timerInterval);
    }

    reset() {
        this.isRunning = false;
        this.isPaused = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.timerStatusElement.textContent = '准备开始';

        // 移除动画效果
        document.querySelector('.timer-circle').classList.remove('running');

        clearInterval(this.timerInterval);

        // 重置时间
        this.timeLeft = this.currentMode === 'focus' 
            ? this.settings.focusTime * 60 
            : this.settings.breakTime * 60;

        this.updateDisplay();
    }

    onTimerComplete() {
        clearInterval(this.timerInterval);
        document.querySelector('.timer-circle').classList.remove('running');

        // 播放提示音
        this.playNotificationSound();

        // 显示弹窗提醒
        this.showNotification();

        // 更新统计数据
        if (this.currentMode === 'focus') {
            this.updateStats();
        }

        // 切换模式
        this.currentMode = this.currentMode === 'focus' ? 'break' : 'focus';
        this.timeLeft = this.currentMode === 'focus' 
            ? this.settings.focusTime * 60 
            : this.settings.breakTime * 60;

        this.updateDisplay();
        this.timerStatusElement.textContent = this.currentMode === 'focus' ? '准备开始专注' : '准备开始休息';
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
    }

    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;

        this.minutesElement.textContent = minutes.toString().padStart(2, '0');
        this.secondsElement.textContent = seconds.toString().padStart(2, '0');
    }

    saveSettings() {
        const focusTime = parseInt(this.focusTimeInput.value);
        const breakTime = parseInt(this.breakTimeInput.value);

        if (isNaN(focusTime) || focusTime < 1 || focusTime > 60) {
            alert('专注时间必须在1-60分钟之间');
            return;
        }

        if (isNaN(breakTime) || breakTime < 1 || breakTime > 30) {
            alert('休息时间必须在1-30分钟之间');
            return;
        }

        this.settings = {
            focusTime,
            breakTime
        };

        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));

        // 如果当前是停止状态，重置时间
        if (!this.isRunning) {
            this.timeLeft = this.currentMode === 'focus' 
                ? focusTime * 60 
                : breakTime * 60;
            this.updateDisplay();
        }

        this.showCustomModal('设置已保存');
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('pomodoroSettings');
        if (savedSettings) {
            this.settings = JSON.parse(savedSettings);
            this.focusTimeInput.value = this.settings.focusTime;
            this.breakTimeInput.value = this.settings.breakTime;
        }
    }

    loadStats() {
        const today = this.getTodayString();
        const savedStats = localStorage.getItem('pomodoroStats');

        if (savedStats) {
            const stats = JSON.parse(savedStats);
            // 如果今天没有数据，初始化今天的数据
            if (!stats[today]) {
                stats[today] = { pomodoros: 0, totalTime: 0 };
            }
            return stats;
        }

        // 初始化新的统计数据
        return {
            [today]: { pomodoros: 0, totalTime: 0 }
        };
    }

    updateStats() {
        const today = this.getTodayString();
        this.stats[today].pomodoros++;
        this.stats[today].totalTime += this.settings.focusTime;

        localStorage.setItem('pomodoroStats', JSON.stringify(this.stats));

        // 更新显示
        this.totalPomodorosElement.textContent = this.stats[today].pomodoros;
        this.totalTimeElement.textContent = this.stats[today].totalTime;

        // 更新图表
        this.updateChart();
    }

    getTodayString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            days.push(`${year}-${month}-${day}`);
        }
        return days;
    }

    initChart() {
        const ctx = this.chartCanvas.getContext('2d');
        const days = this.getLast7Days();
        const pomodoroData = days.map(day => this.stats[day]?.pomodoros || 0);
        const timeData = days.map(day => this.stats[day]?.totalTime || 0);

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days.map(day => {
                    const date = new Date(day);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                }),
                datasets: [
                    {
                        label: '完成番茄数',
                        data: pomodoroData,
                        backgroundColor: 'rgba(102, 126, 234, 0.8)',
                        borderColor: 'rgba(102, 126, 234, 1)',
                        borderWidth: 1
                    },
                    {
                        label: '专注时间 (分钟)',
                        data: timeData,
                        backgroundColor: 'rgba(118, 75, 162, 0.8)',
                        borderColor: 'rgba(118, 75, 162, 1)',
                        borderWidth: 1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '番茄数'
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '时间 (分钟)'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    }

    updateChart() {
        if (!this.chart) return;

        const days = this.getLast7Days();
        const pomodoroData = days.map(day => this.stats[day]?.pomodoros || 0);
        const timeData = days.map(day => this.stats[day]?.totalTime || 0);

        this.chart.data.labels = days.map(day => {
            const date = new Date(day);
            return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        this.chart.data.datasets[0].data = pomodoroData;
        this.chart.data.datasets[1].data = timeData;
        this.chart.update();
    }

    playNotificationSound() {
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

    showNotification() {
        const message = this.currentMode === 'focus' 
            ? '专注时间结束！开始休息吧！' 
            : '休息时间结束！开始专注吧！';

        if (Notification.permission === 'granted') {
            new Notification('番茄钟提醒', {
                body: message,
                icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNjY3ZWVhIiByeD0iMjAiLz4KPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJJbnRlciIgZm9udC1zaXplPSIxMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iSW50ZXIiPvCfjonvuI88L3RleHQ+Cjx0ZXh0IHg9IjUwJSIgeT0iNzUlIiBmb250LWZhbWlseT0iSW50ZXIiIGZvbnQtc2l6ZT0iNjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iSW50ZXIiPvCfjonvuI88L3RleHQ+Cjwvc3ZnPg=='
            });
        } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    new Notification('番茄钟提醒', {
                        body: message,
                        icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjNjY3ZWVhIiByeD0iMjAiLz4KPHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJJbnRlciIgZm9udC1zaXplPSIxMDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iSW50ZXIiPvCfjonvuI88L3RleHQ+Cjx0ZXh0IHg9IjUwJSIgeT0iNzUlIiBmb250LWZhbWlseT0iSW50ZXIiIGZvbnQtc2l6ZT0iNjAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiBmb250LWZhbWlseT0iSW50ZXIiPvCfjonvuI88L3RleHQ+Cjwvc3ZnPg=='
                    });
                } else {
                    this.showCustomModal(message);
                }
            });
        } else {
            this.showCustomModal(message);
        }
    }

    showCustomModal(message) {
        // 设置弹窗消息
        this.modalMessage.textContent = message;
        
        // 显示弹窗
        this.customModal.classList.remove('hide');
        this.customModal.classList.add('show');
        
        // 1秒后自动隐藏弹窗
        setTimeout(() => {
            this.customModal.classList.remove('show');
            this.customModal.classList.add('hide');
            
            // 动画结束后完全隐藏
            setTimeout(() => {
                this.customModal.classList.remove('hide');
            }, 300);
        }, 1000);
    }

    handlePresetTimeClick(e, type) {
        if (e.target.classList.contains('preset-btn')) {
            const time = parseInt(e.target.dataset.time);
            
            // 更新输入框值
            if (type === 'focus') {
                this.focusTimeInput.value = time;
                // 移除所有专注时间按钮的active类
                this.focusPresetTimes.querySelectorAll('.preset-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
            } else {
                this.breakTimeInput.value = time;
                // 移除所有休息时间按钮的active类
                this.breakPresetTimes.querySelectorAll('.preset-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
            }
            
            // 添加当前按钮的active类
            e.target.classList.add('active');
        }
    }
}

// 页面加载完成后初始化番茄钟
document.addEventListener('DOMContentLoaded', () => {
    new PomodoroTimer();
});