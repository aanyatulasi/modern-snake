import { CONFIG } from '../config.js';

export class PresentationMode {
    constructor(game) {
        this.game = game;
        this.isActive = false;
        this.demoMode = false;
        this.showTutorial = false;
        this.showStats = false;
        this.replayMode = false;
        this.replayData = [];
        this.currentReplayIndex = 0;
        this.slowMotion = false;
        this.highlightMoments = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'p') this.togglePresentationMode();
            if (e.key.toLowerCase() === 'r') this.toggleReplay();
            if (e.key.toLowerCase() === 't') this.toggleTutorial();
            if (e.key.toLowerCase() === 's') this.toggleStatistics();
            if (e.key.toLowerCase() === 'd') this.toggleDemoMode();
        });
    }

    togglePresentationMode() {
        this.isActive = !this.isActive;
        console.log(`Presentation mode ${this.isActive ? 'activated' : 'deactivated'}`);
        if (this.isActive) this.activatePresentationMode();
        else this.deactivatePresentationMode();
    }

    activatePresentationMode() {
        // Save current game state
        this.savedGameState = {
            direction: { ...this.game.direction },
            nextDirection: { ...this.game.nextDirection },
            gameLoop: this.game.gameLoop
        };
        
        // Initialize presentation features
        this.initializeDemoMode();
        this.initializeReplaySystem();
        this.initializeTutorial();
        this.initializeStatistics();
        
        // Update UI
        this.updateUI();
    }

    deactivatePresentationMode() {
        // Restore game state
        if (this.savedGameState) {
            this.game.direction = this.savedGameState.direction;
            this.game.nextDirection = this.savedGameState.nextDirection;
            this.game.gameLoop = this.savedGameState.gameLoop;
        }
        
        // Clean up
        this.cleanupPresentationMode();
        
        // Update UI
        this.updateUI();
    }

    // Demo Mode - AI vs AI battle
    toggleDemoMode() {
        this.demoMode = !this.demoMode;
        console.log(`Demo mode ${this.demoMode ? 'activated' : 'deactivated'}`);
        
        if (this.demoMode) {
            this.startAIBattle();
        } else {
            this.stopAIBattle();
        }
    }

    startAIBattle() {
        // Implement AI vs AI logic here
        console.log('Starting AI vs AI battle');
        // This would control both snakes in a vs mode
    }

    stopAIBattle() {
        console.log('Stopping AI battle');
        // Clean up AI battle resources
    }

    // Replay System
    toggleReplay() {
        this.replayMode = !this.replayMode;
        console.log(`Replay mode ${this.replayMode ? 'activated' : 'deactivated'}`);
        
        if (this.replayMode) {
            this.startReplay();
        } else {
            this.stopReplay();
        }
    }

    startReplay() {
        console.log('Starting replay');
        // Record current game state for replay
        this.replayData = [];
        // Start recording
    }

    stopReplay() {
        console.log('Stopping replay');
        // Stop recording and clean up
    }

    // Tutorial Mode
    toggleTutorial() {
        this.showTutorial = !this.showTutorial;
        console.log(`Tutorial ${this.showTutorial ? 'shown' : 'hidden'}`);
        // Show/hide tutorial elements
    }

    // Statistics Dashboard
    toggleStatistics() {
        this.showStats = !this.showStats;
        console.log(`Statistics ${this.showStats ? 'shown' : 'hidden'}`);
        // Show/hide statistics dashboard
    }

    // Helper methods
    initializeDemoMode() {
        // Initialize demo mode resources
    }

    initializeReplaySystem() {
        // Initialize replay system
    }

    initializeTutorial() {
        // Initialize tutorial content
    }

    initializeStatistics() {
        // Initialize statistics tracking
    }

    cleanupPresentationMode() {
        // Clean up resources
        this.demoMode = false;
        this.showTutorial = false;
        this.showStats = false;
        this.replayMode = false;
    }

    updateUI() {
        // Update UI elements based on presentation mode state
        const presentationInfo = document.getElementById('presentation-info') || 
            this.createPresentationInfoElement();
            
        presentationInfo.innerHTML = `
            <div class="presentation-overlay">
                <h3>Presentation Mode: ${this.isActive ? 'ON' : 'OFF'}</h3>
                ${this.isActive ? `
                    <p>Demo: ${this.demoMode ? 'ON' : 'OFF'}</p>
                    <p>Replay: ${this.replayMode ? 'ON' : 'OFF'}</p>
                    <p>Tutorial: ${this.showTutorial ? 'ON' : 'OFF'}</p>
                    <p>Stats: ${this.showStats ? 'ON' : 'OFF'}</p>
                ` : ''}
            </div>
        `;
    }

    createPresentationInfoElement() {
        const div = document.createElement('div');
        div.id = 'presentation-info';
        div.style.position = 'fixed';
        div.style.top = '10px';
        div.style.right = '10px';
        div.style.background = 'rgba(0,0,0,0.7)';
        div.style.color = 'white';
        div.style.padding = '10px';
        div.style.borderRadius = '5px';
        div.style.zIndex = '1000';
        document.body.appendChild(div);
        return div;
    }

    // Update function to be called in the game loop
    update() {
        if (!this.isActive) return;

        if (this.demoMode) {
            this.updateAIBattle();
        }

        if (this.replayMode) {
            this.updateReplay();
        }
    }

    updateAIBattle() {
        // AI battle logic goes here
    }

    updateReplay() {
        // Replay logic goes here
    }

    // Camera control for cinematic effects
    updateCamera() {
        if (!this.isActive) return;
        
        // Implement smooth camera following
        // This would control the game's viewport to follow the snake
    }

    // Slow motion effect
    toggleSlowMotion() {
        this.slowMotion = !this.slowMotion;
        this.game.updateInterval = this.slowMotion ? 
            (1000 / CONFIG.GAME_SPEED) * 2 : 
            (1000 / CONFIG.GAME_SPEED);
        console.log(`Slow motion ${this.slowMotion ? 'activated' : 'deactivated'}`);
    }
}

// Add styles for presentation mode
const style = document.createElement('style');
style.textContent = `
    .presentation-overlay {
        font-family: Arial, sans-serif;
        font-size: 14px;
    }
    
    .presentation-overlay h3 {
        margin: 0 0 10px 0;
        color: #4CAF50;
    }
    
    .presentation-overlay p {
        margin: 5px 0;
    }
`;
document.head.appendChild(style);
