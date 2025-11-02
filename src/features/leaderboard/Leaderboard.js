class Leaderboard {
    constructor() {
        this.storageKey = 'snakeLeaderboard';
        this.statsKey = 'snakeGameStats';
        this.leaderboard = this.loadLeaderboard();
        this.stats = this.loadStats();
    }

    // Initialize default stats
    getDefaultStats() {
        return {
            totalGames: 0,
            highestScore: 0,
            totalScore: 0,
            totalFoodEaten: 0,
            totalPowerUps: 0,
            longestSnake: 0,
            fastestWin: null, // in seconds
            lastPlayed: null
        };
    }

    // Load leaderboard from localStorage
    loadLeaderboard() {
        const saved = localStorage.getItem(this.storageKey);
        return saved ? JSON.parse(saved) : [];
    }

    // Load game statistics
    loadStats() {
        const saved = localStorage.getItem(this.statsKey);
        return saved ? JSON.parse(saved) : this.getDefaultStats();
    }

    // Save leaderboard to localStorage
    saveLeaderboard() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.leaderboard));
    }

    // Save stats to localStorage
    saveStats() {
        localStorage.setItem(this.statsKey, JSON.stringify(this.stats));
    }

    // Add a new score to the leaderboard
    addScore(playerName, score, foodEaten, powerUps, snakeLength, gameTime) {
        const timestamp = new Date().toISOString();
        const entry = {
            playerName,
            score,
            timestamp,
            foodEaten,
            powerUps,
            snakeLength,
            gameTime
        };

        // Add to leaderboard and sort by score (descending)
        this.leaderboard.push(entry);
        this.leaderboard.sort((a, b) => b.score - a.score);
        
        // Keep only top 10 scores
        if (this.leaderboard.length > 10) {
            this.leaderboard = this.leaderboard.slice(0, 10);
        }

        // Update stats
        this.stats.totalGames++;
        this.stats.totalScore += score;
        this.stats.totalFoodEaten += foodEaten;
        this.stats.totalPowerUps += powerUps;
        this.stats.longestSnake = Math.max(this.stats.longestSnake, snakeLength);
        
        if (score > this.stats.highestScore) {
            this.stats.highestScore = score;
        }

        if (gameTime && (!this.stats.fastestWin || gameTime < this.stats.fastestWin)) {
            this.stats.fastestWin = gameTime;
        }

        this.stats.lastPlayed = timestamp;

        // Save updates
        this.saveLeaderboard();
        this.saveStats();

        return this.isHighScore(score);
    }

    // Check if a score would be a high score
    isHighScore(score) {
        return this.leaderboard.length < 10 || score > Math.min(...this.leaderboard.map(e => e.score));
    }

    // Get current leaderboard
    getLeaderboard() {
        return this.leaderboard;
    }

    // Get game statistics
    getStats() {
        return {
            ...this.stats,
            averageScore: this.stats.totalGames > 0 
                ? Math.round(this.stats.totalScore / this.stats.totalGames) 
                : 0
        };
    }

    // Export leaderboard data as JSON
    exportData() {
        return {
            leaderboard: this.leaderboard,
            stats: this.stats,
            exportedAt: new Date().toISOString()
        };
    }

    // Import leaderboard data from JSON
    importData(data) {
        if (data.leaderboard) this.leaderboard = data.leaderboard;
        if (data.stats) this.stats = data.stats;
        
        this.saveLeaderboard();
        this.saveStats();
        
        return true;
    }

    // Reset leaderboard
    resetLeaderboard() {
        this.leaderboard = [];
        this.saveLeaderboard();
        return true;
    }

    // Reset statistics
    resetStats() {
        this.stats = this.getDefaultStats();
        this.saveStats();
        return true;
    }

    // Generate avatar from player name
    static generateAvatar(name) {
        // Simple avatar generation using initials and a color based on name
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD',
            '#D4A5A5', '#9B97B2', '#E8FCC2', '#B1CC74', '#E5B3BB'
        ];
        
        const initials = name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
            
        const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        
        return {
            initials,
            color: colors[colorIndex]
        };
    }
}

export default Leaderboard;
