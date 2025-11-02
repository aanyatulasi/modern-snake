class LeaderboardUI {
    constructor(game) {
        this.game = game;
        this.leaderboard = new Leaderboard();
        this.isVisible = false;
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'leaderboard-container hidden';
        this.container.innerHTML = `
            <div class="leaderboard-modal">
                <div class="leaderboard-header">
                    <h2>🏆 Leaderboard</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="tabs">
                    <button class="tab-btn active" data-tab="leaderboard">Leaderboard</button>
                    <button class="tab-btn" data-tab="stats">Statistics</button>
                </div>
                <div class="tab-content">
                    <div id="leaderboard-tab" class="tab-pane active">
                        <div class="leaderboard-list"></div>
                        <div class="leaderboard-actions">
                            <button id="export-btn" class="btn">Export Data</button>
                            <button id="import-btn" class="btn">Import Data</button>
                            <button id="reset-btn" class="btn danger">Reset Leaderboard</button>
                        </div>
                    </div>
                    <div id="stats-tab" class="tab-pane">
                        <div class="stats-container"></div>
                    </div>
                </div>
            </div>
            <input type="file" id="import-file" style="display: none;" accept=".json">
        `;

        // Add to DOM
        document.body.appendChild(this.container);

        // Cache DOM elements
        this.leaderboardList = this.container.querySelector('.leaderboard-list');
        this.statsContainer = this.container.querySelector('.stats-container');
        this.importFileInput = this.container.querySelector('#import-file');
    }

    setupEventListeners() {
        // Close button
        this.container.querySelector('.close-btn').addEventListener('click', () => this.hide());

        // Tab switching
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Buttons
        this.container.querySelector('#export-btn').addEventListener('click', () => this.exportData());
        this.container.querySelector('#import-btn').addEventListener('click', () => this.importFileInput.click());
        this.container.querySelector('#reset-btn').addEventListener('click', () => this.confirmReset());
        
        // File input for import
        this.importFileInput.addEventListener('change', (e) => this.handleFileImport(e));
    }

    show() {
        this.isVisible = true;
        this.container.classList.remove('hidden');
        this.updateLeaderboard();
        this.updateStats();
    }

    hide() {
        this.isVisible = false;
        this.container.classList.add('hidden');
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    switchTab(tabName) {
        // Update active tab button
        this.container.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // Update active tab content
        this.container.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `${tabName}-tab`);
        });
    }

    updateLeaderboard() {
        const leaderboardData = this.leaderboard.getLeaderboard();
        
        if (leaderboardData.length === 0) {
            this.leaderboardList.innerHTML = '<p class="no-scores">No scores yet. Play a game to see your scores here!</p>';
            return;
        }

        const medals = ['🥇', '🥈', '🥉'];
        
        this.leaderboardList.innerHTML = `
            <div class="leaderboard-header-row">
                <span>Rank</span>
                <span>Player</span>
                <span>Score</span>
                <span>Date</span>
            </div>
            ${leaderboardData.map((entry, index) => {
                const avatar = Leaderboard.generateAvatar(entry.playerName);
                const date = new Date(entry.timestamp).toLocaleDateString();
                const medal = index < 3 ? medals[index] : `${index + 1}.`;
                
                return `
                    <div class="leaderboard-entry" data-score-id="${index}">
                        <span class="rank">${medal}</span>
                        <div class="player-info">
                            <div class="player-avatar" style="background-color: ${avatar.color}">
                                ${avatar.initials}
                            </div>
                            <span class="player-name">${entry.playerName}</span>
                        </div>
                        <span class="score">${entry.score}</span>
                        <span class="date" title="${new Date(entry.timestamp).toLocaleString()}">${date}</span>
                    </div>
                `;
            }).join('')}
        `;
    }

    updateStats() {
        const stats = this.leaderboard.getStats();
        
        this.statsContainer.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${stats.totalGames}</div>
                    <div class="stat-label">Games Played</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.highestScore}</div>
                    <div class="stat-label">Highest Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.averageScore}</div>
                    <div class="stat-label">Average Score</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalFoodEaten}</div>
                    <div class="stat-label">Total Food Eaten</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.totalPowerUps}</div>
                    <div class="stat-label">Power-Ups Collected</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.longestSnake}</div>
                    <div class="stat-label">Longest Snake</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.fastestWin ? `${stats.fastestWin}s` : 'N/A'}</div>
                    <div class="stat-label">Fastest Win</div>
                </div>
            </div>
            
            <div class="chart-container">
                <h3>Score Distribution</h3>
                <canvas id="scoreChart"></canvas>
            </div>
            
            <div class="stats-actions">
                <button id="reset-stats-btn" class="btn danger">Reset Statistics</button>
            </div>
        `;

        // Add event listener for reset stats button
        const resetStatsBtn = this.statsContainer.querySelector('#reset-stats-btn');
        if (resetStatsBtn) {
            resetStatsBtn.addEventListener('click', () => this.confirmReset(true));
        }

        // Initialize chart if there's data
        this.initializeScoreChart();
    }

    initializeScoreChart() {
        const canvas = this.statsContainer.querySelector('#scoreChart');
        if (!canvas) return;

        const leaderboardData = this.leaderboard.getLeaderboard();
        if (leaderboardData.length === 0) return;

        const ctx = canvas.getContext('2d');
        const scores = leaderboardData.map(entry => entry.score);
        const labels = leaderboardData.map((_, i) => `#${i + 1}`);

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Score',
                    data: scores,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Score'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Rank'
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

    async showNameInput(score, foodEaten, powerUps, snakeLength, gameTime) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'name-input-modal';
            modal.innerHTML = `
                <div class="name-input-container">
                    <h3>🎉 New High Score: ${score}!</h3>
                    <p>Enter your name for the leaderboard:</p>
                    <input type="text" id="player-name" maxlength="20" placeholder="Your name" autofocus>
                    <div class="name-input-actions">
                        <button id="submit-score" class="btn">Submit</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            const submitBtn = modal.querySelector('#submit-score');
            const nameInput = modal.querySelector('#player-name');

            const submitScore = () => {
                const playerName = nameInput.value.trim() || 'Anonymous';
                document.body.removeChild(modal);
                
                // Add to leaderboard
                const isHighScore = this.leaderboard.addScore(
                    playerName,
                    score,
                    foodEaten,
                    powerUps,
                    snakeLength,
                    gameTime
                );
                
                resolve(isHighScore);
            };

            submitBtn.addEventListener('click', submitScore);
            nameInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitScore();
                }
            });
        });
    }

    exportData() {
        const data = this.leaderboard.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `snake-leaderboard-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    handleFileImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (confirm('Importing this data will overwrite your current leaderboard and statistics. Continue?')) {
                    this.leaderboard.importData(data);
                    this.updateLeaderboard();
                    this.updateStats();
                    alert('Data imported successfully!');
                }
            } catch (error) {
                console.error('Error importing data:', error);
                alert('Error importing data. The file might be corrupted or in the wrong format.');
            }
        };
        reader.readAsText(file);
        
        // Reset the file input
        event.target.value = '';
    }

    confirmReset(statsOnly = false) {
        const message = statsOnly 
            ? 'Are you sure you want to reset all statistics? This cannot be undone.'
            : 'Are you sure you want to reset the leaderboard? This will delete all saved scores and cannot be undone.';

        if (confirm(message)) {
            if (statsOnly) {
                this.leaderboard.resetStats();
                this.updateStats();
            } else {
                this.leaderboard.resetLeaderboard();
                this.updateLeaderboard();
            }
        }
    }
}

export default LeaderboardUI;
