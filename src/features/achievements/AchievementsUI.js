import Achievements from './Achievements';

export class AchievementsUI {
    constructor(game) {
        this.game = game;
        this.achievements = new Achievements();
        this.isVisible = false;
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // Create main container
        this.container = document.createElement('div');
        this.container.className = 'achievements-container hidden';
        this.container.innerHTML = `
            <div class="achievements-modal">
                <div class="achievements-header">
                    <h2>🏆 Achievements</h2>
                    <button class="close-btn">&times;</button>
                </div>
                <div class="tabs">
                    <button class="tab-btn active" data-tab="all">All</button>
                    <button class="tab-btn" data-tab="unlocked">Unlocked</button>
                    <button class="tab-btn" data-tab="locked">Locked</button>
                </div>
                <div class="achievements-list" id="achievementsList">
                    <!-- Achievements will be populated here -->
                </div>
                <div class="achievements-actions">
                    <button id="reset-achievements" class="btn danger">Reset All Achievements</button>
                </div>
            </div>
        `;

        // Add to DOM
        document.body.appendChild(this.container);

        // Cache DOM elements
        this.achievementsList = this.container.querySelector('#achievementsList');
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

        // Reset button
        const resetBtn = this.container.querySelector('#reset-achievements');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all achievements? This cannot be undone.')) {
                    this.achievements.resetAchievements();
                    this.updateAchievementsList('all');
                }
            });
        }
    }

    show() {
        this.isVisible = true;
        this.container.classList.remove('hidden');
        this.updateAchievementsList('all');
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

        // Update achievements list
        this.updateAchievementsList(tabName);
    }

    updateAchievementsList(filter = 'all') {
        let achievements;
        
        switch (filter) {
            case 'unlocked':
                achievements = this.achievements.getUnlockedAchievements();
                break;
            case 'locked':
                achievements = this.achievements.getLockedAchievements();
                break;
            default:
                achievements = this.achievements.getAllAchievements();
        }

        if (achievements.length === 0) {
            this.achievementsList.innerHTML = `
                <div class="no-achievements">
                    No achievements found. Keep playing to unlock them!
                </div>
            `;
            return;
        }

        this.achievementsList.innerHTML = achievements.map(ach => {
            const unlockedClass = ach.unlocked ? 'unlocked' : 'locked';
            const secretClass = ach.isSecret && !ach.unlocked ? 'secret' : '';
            const progressBar = ach.progress ? `
                <div class="achievement-progress">
                    <div class="progress-bar" style="width: ${ach.progress.percentage}%"></div>
                    <span>${ach.progress.current}/${ach.progress.target}</span>
                </div>
            ` : '';

            const unlockDate = ach.unlockedAt ? 
                `<div class="achievement-date">Unlocked: ${new Date(ach.unlockedAt).toLocaleDateString()}</div>` : '';

            return `
                <div class="achievement-item ${unlockedClass} ${secretClass}" data-id="${ach.id}">
                    <div class="achievement-icon">
                        ${ach.unlocked ? ach.title.split(' ')[0] : '🔒'}
                    </div>
                    <div class="achievement-details">
                        <div class="achievement-name">
                            ${ach.unlocked || !ach.isSecret ? ach.title : '???'}
                            ${ach.unlocked ? '<span class="badge">Unlocked!</span>' : ''}
                        </div>
                        <div class="achievement-desc">
                            ${ach.unlocked || !ach.isSecret ? ach.description : 'Unlock this achievement to reveal it'}
                        </div>
                        ${progressBar}
                        ${unlockDate}
                    </div>
                </div>
            `;
        }).join('');
    }

    // Check for new achievements based on game state
    checkForAchievements(gameState) {
        return this.achievements.checkAchievements(gameState);
    }

    // Show a specific achievement (for testing)
    showAchievement(achievementId) {
        const achievement = this.achievements.getAllAchievements().find(a => a.id === achievementId);
        if (achievement) {
            this.achievements.queueAchievements([achievement]);
        }
    }
}
