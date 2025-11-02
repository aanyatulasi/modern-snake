// Input Handler - Aanya
// TODO: Implement input handling for different devices
// - [ ] Add touch controls for mobile
// - [ ] Support gamepad/controller input
// - [ ] Add input buffering

export class InputHandler {
    constructor(game) {
        this.game = game;
        this.keys = new Set();
        this.touchStart = null;
        
        // Keyboard event listeners
        window.addEventListener('keydown', this.handleKeyDown.bind(this));
        window.addEventListener('keyup', this.handleKeyUp.bind(this));
        
        // Touch event listeners
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    }

    handleKeyDown(event) {
        // Prevent default for game control keys
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
            event.preventDefault();
        }
        
        this.keys.add(event.key);
        this.processInput();
    }

    handleKeyUp(event) {
        this.keys.delete(event.key);
    }

    handleTouchStart(event) {
        this.touchStart = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
            time: Date.now()
        };
        event.preventDefault();
    }

    handleTouchMove(event) {
        if (!this.touchStart) return;
        
        const touch = event.touches[0];
        const dx = touch.clientX - this.touchStart.x;
        const dy = touch.clientY - this.touchStart.y;
        
        // Only process swipe if it's significant enough
        if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                this.keys.delete('ArrowUp');
                this.keys.delete('ArrowDown');
                this.keys.add(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
            } else {
                // Vertical swipe
                this.keys.delete('ArrowLeft');
                this.keys.delete('ArrowRight');
                this.keys.add(dy > 0 ? 'ArrowDown' : 'ArrowUp');
            }
            this.processInput();
            this.touchStart = null; // Reset to prevent multiple swipes
        }
        
        event.preventDefault();
    }

    handleTouchEnd() {
        this.touchStart = null;
    }

    processInput() {
        if (!this.game.state || this.game.state.isPaused) return;

        // Process keyboard input
        if (this.keys.has('ArrowUp')) this.game.state.snake.changeDirection({ x: 0, y: -1 });
        else if (this.keys.has('ArrowDown')) this.game.state.snake.changeDirection({ x: 0, y: 1 });
        else if (this.keys.has('ArrowLeft')) this.game.state.snake.changeDirection({ x: -1, y: 0 });
        else if (this.keys.has('ArrowRight')) this.game.state.snake.changeDirection({ x: 1, y: 0 });
        else if (this.keys.has(' ')) this.game.togglePause();
    }
}
