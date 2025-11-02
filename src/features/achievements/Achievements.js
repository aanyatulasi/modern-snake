class Achievements {
    constructor() {
        this.storageKey = 'snakeAchievements';
        this.achievements = this.loadAchievements();
        this.unlockedQueue = [];
        this.isShowing = false;
    }

    // Define all possible achievements
    static get ACHIEVEMENTS() {
        return {
            FIRST_WIN: {
                id: 'first_win',
                title: '🏆 First Win',
                description: 'Win your first game',
                isSecret: false,
                check: (gameState) => gameState.hasWon,
                progress: () => null
            },
            SNAKE_MASTER: {
                id: 'snake_master',
                title: '🐍 Snake Master',
                description: 'Score more than 100 points',
                isSecret: false,
                check: (gameState) => gameState.score > 100,
                progress: (gameState) => ({
                    current: Math.min(gameState.score, 100),
                    target: 100,
                    percentage: Math.min(Math.floor((gameState.score / 100) * 100), 100)
                })
            },
            SPEED_DEMON: {
                id: 'speed_demon',
                title: '⚡ Speed Demon',
                description: 'Collect 5 speed boosts',
                isSecret: false,
                check: (gameState) => (gameState.stats?.speedBoostsCollected || 0) >= 5,
                progress: (gameState) => ({
                    current: Math.min(gameState.stats?.speedBoostsCollected || 0, 5),
                    target: 5,
                    percentage: Math.min(Math.floor(((gameState.stats?.speedBoostsCollected || 0) / 5) * 100), 100)
                })
            },
            UNTOUCHABLE: {
                id: 'untouchable',
                title: '🛡️ Untouchable',
                description: 'Win a game with shield active',
                isSecret: false,
                check: (gameState) => gameState.hasWon && gameState.shieldActive,
                progress: () => null
            },
            SHARPSHOOTER: {
                id: 'sharpshooter',
                title: '🎯 Sharpshooter',
                description: 'Eat 10 food in a row without missing',
                isSecret: false,
                check: (gameState) => (gameState.stats?.consecutiveFood || 0) >= 10,
                progress: (gameState) => ({
                    current: Math.min(gameState.stats?.consecutiveFood || 0, 10),
                    target: 10,
                    percentage: Math.min(Math.floor(((gameState.stats?.consecutiveFood || 0) / 10) * 100), 100)
                })
            },
            GHOST_RIDER: {
                id: 'ghost_rider',
                title: '👻 Ghost Rider',
                description: 'Use ghost mode 3 times in a single game',
                isSecret: true,
                check: (gameState) => (gameState.stats?.ghostModeActivations || 0) >= 3,
                progress: (gameState) => ({
                    current: Math.min(gameState.stats?.ghostModeActivations || 0, 3),
                    target: 3,
                    percentage: Math.min(Math.floor(((gameState.stats?.ghostModeActivations || 0) / 3) * 100), 100)
                })
            },
            AI_DESTROYER: {
                id: 'ai_destroyer',
                title: '🤖 AI Destroyer',
                description: 'Beat the AI on hard difficulty',
                isSecret: true,
                check: (gameState) => gameState.hasWon && gameState.difficulty === 'hard',
                progress: () => null
            }
        };
    }

    // Load achievements from localStorage
    loadAchievements() {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
            return JSON.parse(saved);
        }

        // Initialize all achievements as locked
        const initialAchievements = {};
        Object.values(Achievements.ACHIEVEMENTS).forEach(ach => {
            initialAchievements[ach.id] = {
                ...ach,
                unlocked: false,
                unlockedAt: null,
                progress: { current: 0, target: 0, percentage: 0 }
            };
        });

        return initialAchievements;
    }

    // Save achievements to localStorage
    saveAchievements() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.achievements));
    }

    // Check and unlock achievements based on game state
    checkAchievements(gameState) {
        const unlocked = [];
        
        Object.values(Achievements.ACHIEVEMENTS).forEach(ach => {
            const achievement = this.achievements[ach.id];
            
            // Skip if already unlocked
            if (achievement.unlocked) return;
            
            // Check if achievement is unlocked
            if (ach.check(gameState)) {
                achievement.unlocked = true;
                achievement.unlockedAt = new Date().toISOString();
                unlocked.push(achievement);
            }
            
            // Update progress for progress-based achievements
            if (ach.progress) {
                achievement.progress = ach.progress(gameState);
            }
        });

        // Save if any achievements were unlocked
        if (unlocked.length > 0) {
            this.saveAchievements();
            this.queueAchievements(unlocked);
        }

        return unlocked;
    }

    // Queue achievements to be shown
    queueAchievements(achievements) {
        this.unlockedQueue.push(...achievements);
        if (!this.isShowing) {
            this.showNextAchievement();
        }
    }

    // Show the next achievement in the queue
    showNextAchievement() {
        if (this.unlockedQueue.length === 0) {
            this.isShowing = false;
            return;
        }

        this.isShowing = true;
        const achievement = this.unlockedQueue.shift();
        this.showAchievement(achievement);
    }

    // Display the achievement notification
    showAchievement(achievement) {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('achievement-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'achievement-notification';
            notification.className = 'achievement-notification';
            document.body.appendChild(notification);
            
            // Add styles if not already added
            if (!document.getElementById('achievement-styles')) {
                const style = document.createElement('style');
                style.id = 'achievement-styles';
                style.textContent = this.getAchievementStyles();
                document.head.appendChild(style);
            }
        }

        // Set notification content
        notification.innerHTML = `
            <div class="achievement-icon">${achievement.title.split(' ')[0]}</div>
            <div class="achievement-content">
                <div class="achievement-title">Achievement Unlocked!</div>
                <div class="achievement-name">${achievement.title}</div>
                <div class="achievement-desc">${achievement.description}</div>
                ${achievement.progress && achievement.progress.percentage < 100 ? 
                    `<div class="achievement-progress">
                        <div class="progress-bar" style="width: ${achievement.progress.percentage}%"></div>
                        <span>${achievement.progress.current}/${achievement.progress.target}</span>
                    </div>` : ''
                }
            </div>
        `;

        // Show notification with animation
        notification.classList.add('show');

        // Hide after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => this.showNextAchievement(), 500);
        }, 3000);
    }

    // Get CSS styles for achievements
    getAchievementStyles() {
        return `
            .achievement-notification {
                position: fixed;
                top: 20px;
                right: -400px;
                width: 350px;
                background: rgba(44, 62, 80, 0.95);
                border-left: 4px solid #f39c12;
                border-radius: 4px;
                padding: 15px;
                display: flex;
                align-items: center;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                z-index: 1000;
                transition: right 0.5s ease-in-out, opacity 0.3s ease;
                opacity: 0;
                backdrop-filter: blur(5px);
            }

            .achievement-notification.show {
                right: 20px;
                opacity: 1;
            }

            .achievement-icon {
                font-size: 2.5rem;
                margin-right: 15px;
                flex-shrink: 0;
            }

            .achievement-content {
                flex-grow: 1;
            }

            .achievement-title {
                color: #f39c12;
                font-weight: bold;
                font-size: 0.9rem;
                margin-bottom: 3px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }

            .achievement-name {
                color: #ecf0f1;
                font-weight: 600;
                font-size: 1.1rem;
                margin-bottom: 3px;
            }

            .achievement-desc {
                color: #bdc3c7;
                font-size: 0.9rem;
                margin-bottom: 8px;
            }

            .achievement-progress {
                background: rgba(0, 0, 0, 0.2);
                border-radius: 3px;
                height: 18px;
                margin-top: 8px;
                position: relative;
                overflow: hidden;
                font-size: 0.7rem;
            }

            .progress-bar {
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                background: linear-gradient(90deg, #f39c12, #e67e22);
                transition: width 0.3s ease;
            }

            .achievement-progress span {
                position: relative;
                z-index: 1;
                color: white;
                font-weight: bold;
                text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
            }

            @media (max-width: 500px) {
                .achievement-notification {
                    width: calc(100% - 40px);
                    right: -100%;
                }
                
                .achievement-notification.show {
                    right: 20px;
                }
            }
        `;
    }

    // Get all achievements
    getAllAchievements() {
        return Object.values(this.achievements);
    }

    // Get unlocked achievements
    getUnlockedAchievements() {
        return Object.values(this.achievements).filter(ach => ach.unlocked);
    }

    // Get locked achievements
    getLockedAchievements() {
        return Object.values(this.achievements).filter(ach => !ach.unlocked);
    }

    // Reset all achievements (for testing)
    resetAchievements() {
        Object.values(this.achievements).forEach(ach => {
            ach.unlocked = false;
            ach.unlockedAt = null;
            ach.progress = { current: 0, target: 0, percentage: 0 };
        });
        this.saveAchievements();
    }
}

export default Achievements;
