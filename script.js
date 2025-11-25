// 番茄钟应用
class PomodoroTimer {
    constructor() {
        // DOM元素
        this.timeLeftElement = document.getElementById('timeLeft');
        this.timerModeElement = document.getElementById('timerMode');
        this.startBtn = document.getElementById('startBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.resetBtn = document.getElementById('resetBtn');
        this.focusTimeInput = document.getElementById('focusTime');
        this.breakTimeInput = document.getElementById('breakTime');
        this.saveSettingsBtn = document.getElementById('saveSettingsBtn');
        this.todayPomodorosElement = document.getElementById('todayPomodoros');
        this.weekPomodorosElement = document.getElementById('weekPomodoros');
        this.totalPomodorosElement = document.getElementById('totalPomodoros');
        this.notificationModal = document.getElementById('notificationModal');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalMessage = document.getElementById('modalMessage');

        // 计时器状态
        this.isRunning = false;
        this.isPaused = false;
        this.currentMode = 'focus'; // 'focus' 或 'break'
        this.timerInterval = null;

        // 设置
        this.settings = this.loadSettings();
        // 统计数据
        this.stats = this.loadStats();
        
        // 初始化时间
        this.timeLeft = this.settings.focusTime * 60;

        // 图表
        this.chart = null;

        this.init();
    }

    init() {
        // 初始化事件监听
        this.startBtn.addEventListener('click', () => this.start());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.resetBtn.addEventListener('click', () => this.reset());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.closeModalBtn.addEventListener('click', () => this.closeModal());

        // 时间调整按钮事件
        document.getElementById('focusDecrease').addEventListener('click', () => this.adjustTime('focus', -1));
        document.getElementById('focusIncrease').addEventListener('click', () => this.adjustTime('focus', 1));
        document.getElementById('breakDecrease').addEventListener('click', () => this.adjustTime('break', -1));
        document.getElementById('breakIncrease').addEventListener('click', () => this.adjustTime('break', 1));

        // 快速选择按钮事件
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target.dataset.target;
                const value = parseInt(e.target.dataset.value);
                this.setQuickTime(target, value);
            });
        });

        // 点击模态框外部关闭
        this.notificationModal.addEventListener('click', (e) => {
            if (e.target === this.notificationModal) {
                this.closeModal();
            }
        });

        // 初始化显示
        this.updateDisplay();
        this.updateStatsDisplay();
        this.initChart();

        // 加载保存的设置
        this.loadSettingsToUI();
    }

    // 调整时间
    adjustTime(target, delta) {
        const input = target === 'focus' ? this.focusTimeInput : this.breakTimeInput;
        const min = parseInt(input.min);
        const max = parseInt(input.max);
        let value = parseInt(input.value) + delta;
        
        // 确保在范围内
        value = Math.max(min, Math.min(max, value));
        input.value = value;
    }

    // 快速设置时间
    setQuickTime(target, value) {
        const input = target === 'focus' ? this.focusTimeInput : this.breakTimeInput;
        input.value = value;
    }

    // 加载设置
    loadSettings() {
        const defaultSettings = {
            focusTime: 25,
            breakTime: 5
        };

        const savedSettings = localStorage.getItem('pomodoroSettings');
        return savedSettings ? JSON.parse(savedSettings) : defaultSettings;
    }

    // 保存设置
    saveSettings() {
        this.settings.focusTime = parseInt(this.focusTimeInput.value);
        this.settings.breakTime = parseInt(this.breakTimeInput.value);
        localStorage.setItem('pomodoroSettings', JSON.stringify(this.settings));
        this.reset();
        alert('设置已保存！');
    }

    // 加载设置到UI
    loadSettingsToUI() {
        this.focusTimeInput.value = this.settings.focusTime;
        this.breakTimeInput.value = this.settings.breakTime;
    }

    // 加载统计数据
    loadStats() {
        const defaultStats = {
            total: 0,
            history: []
        };

        const savedStats = localStorage.getItem('pomodoroStats');
        return savedStats ? JSON.parse(savedStats) : defaultStats;
    }

    // 保存统计数据
    saveStats() {
        localStorage.setItem('pomodoroStats', JSON.stringify(this.stats));
    }

    // 添加完成的番茄钟
    addCompletedPomodoro() {
        this.stats.total++;
        const today = new Date().toISOString().split('T')[0];
        this.stats.history.push(today);
        this.saveStats();
        this.updateStatsDisplay();
        this.updateChart();
    }

    // 更新统计显示
    updateStatsDisplay() {
        const today = new Date().toISOString().split('T')[0];
        const todayCount = this.stats.history.filter(date => date === today).length;

        // 计算本周
        const now = new Date();
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfWeekStr = startOfWeek.toISOString().split('T')[0];
        const weekCount = this.stats.history.filter(date => date >= startOfWeekStr).length;

        this.todayPomodorosElement.textContent = todayCount;
        this.weekPomodorosElement.textContent = weekCount;
        this.totalPomodorosElement.textContent = this.stats.total;
    }

    // 初始化图表
    initChart() {
        const ctx = document.getElementById('pomodoroChart').getContext('2d');
        
        // 获取最近7天的数据
        const labels = [];
        const data = [];
        const today = new Date();
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = this.stats.history.filter(d => d === dateStr).length;
            
            labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
            data.push(count);
        }

        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: '每日完成番茄数',
                    data: data,
                    backgroundColor: 'rgba(231, 76, 60, 0.7)',
                    borderColor: 'rgba(231, 76, 60, 1)',
                    borderWidth: 1
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
                        display: false
                    }
                }
            }
        });
    }

    // 更新图表
    updateChart() {
        const today = new Date();
        const labels = [];
        const data = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const count = this.stats.history.filter(d => d === dateStr).length;
            
            labels.push(date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }));
            data.push(count);
        }

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = data;
        this.chart.update();
    }

    // 开始计时器
    start() {
        if (!this.isRunning) {
            if (!this.isPaused) {
                // 首次开始
                this.timeLeft = this.currentMode === 'focus' 
                    ? this.settings.focusTime * 60 
                    : this.settings.breakTime * 60;
            }
            
            this.isRunning = true;
            this.isPaused = false;
            this.startBtn.disabled = true;
            this.pauseBtn.disabled = false;
            
            this.timerInterval = setInterval(() => {
                this.timeLeft--;
                this.updateDisplay();
                
                if (this.timeLeft <= 0) {
                    this.endTimer();
                }
            }, 1000);
        }
    }

    // 暂停计时器
    pause() {
        if (this.isRunning) {
            clearInterval(this.timerInterval);
            this.isRunning = false;
            this.isPaused = true;
            this.startBtn.disabled = false;
            this.pauseBtn.disabled = true;
        }
    }

    // 重置计时器
    reset() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.isPaused = false;
        this.currentMode = 'focus';
        this.timeLeft = this.settings.focusTime * 60;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        this.updateDisplay();
    }

    // 结束计时器
    endTimer() {
        clearInterval(this.timerInterval);
        this.isRunning = false;
        this.startBtn.disabled = false;
        this.pauseBtn.disabled = true;
        
        // 播放提示音
        this.playNotificationSound();
        
        // 显示通知
        if (this.currentMode === 'focus') {
            this.showNotification('专注时间结束！', '太棒了！您已经专注了25分钟，现在开始休息吧。');
            this.addCompletedPomodoro();
            this.currentMode = 'break';
            this.timeLeft = this.settings.breakTime * 60;
        } else {
            this.showNotification('休息时间结束！', '休息好了吗？让我们开始下一个专注时段吧。');
            this.currentMode = 'focus';
            this.timeLeft = this.settings.focusTime * 60;
        }
        
        this.updateDisplay();
    }

    // 更新显示
    updateDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        this.timeLeftElement.textContent = formattedTime;
        this.timerModeElement.textContent = this.currentMode === 'focus' ? '专注模式' : '休息模式';
        
        // 最后10秒添加脉冲效果
        if (this.timeLeft <= 10 && this.isRunning) {
            this.timeLeftElement.classList.add('pulse');
        } else {
            this.timeLeftElement.classList.remove('pulse');
        }
    }

    // 播放提示音
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

    // 显示通知弹窗
    showNotification(title, message) {
        this.modalTitle.textContent = title;
        this.modalMessage.textContent = message;
        this.notificationModal.classList.add('show');
    }

    // 关闭通知弹窗
    closeModal() {
        this.notificationModal.classList.remove('show');
    }
}

// 页面加载完成后初始化番茄钟
window.addEventListener('load', () => {
    new PomodoroTimer();
});