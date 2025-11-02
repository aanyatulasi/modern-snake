// PowerUp Class - Niki
// TODO: Implement individual power-up behaviors
// - [ ] Add visual effects for each power-up
// - [ ] Balance power-up durations and effects
// - [ ] Add sound effects for power-up activation/deactivation

export class PowerUp {
    constructor(type, duration) {
        this.type = type;
        this.duration = duration;
        this.timeRemaining = duration;
        this.isActive = false;
        this.effects = {
            speed: { multiplier: 1.5, description: 'Speed Boost' },
            slow: { multiplier: 0.6, description: 'Slow Motion' },
            grow: { description: 'Grow' },
            shrink: { description: 'Shrink' },
            // Add more power-up types as needed
        };
    }

    activate(game) {
        if (this.isActive) return;
        
        this.isActive = true;
        this.timeRemaining = this.duration;
        
        switch (this.type) {
            case 'speed':
                game.state.snake.speed *= this.effects.speed.multiplier;
                break;
                
            case 'slow':
                game.state.snake.speed *= this.effects.slow.multiplier;
                break;
                
            case 'grow':
                game.state.snake.grow();
                game.state.score += 20; // Bonus points for grow power-up
                break;
                
            case 'shrink':
                // Shrink the snake (minimum 3 segments)
                while (game.state.snake.body.length > 3) {
                    game.state.snake.body.pop();
                }
                break;
                
            // Add more power-up effects here
        }
        
        // Visual and audio feedback
        this.showActivationEffect();
    }

    deactivate(game) {
        if (!this.isActive) return;
        
        this.isActive = false;
        
        // Revert power-up effects
        switch (this.type) {
            case 'speed':
                game.state.snake.speed /= this.effects.speed.multiplier;
                break;
                
            case 'slow':
                game.state.snake.speed /= this.effects.slow.multiplier;
                break;
                
            // Add reverts for other power-ups if needed
        }
        
        // Visual and audio feedback
        this.showDeactivationEffect();
    }

    update(deltaTime) {
        if (this.duration > 0) {
            this.timeRemaining -= deltaTime;
        }
    }

    isExpired() {
        return this.duration > 0 && this.timeRemaining <= 0;
    }

    showActivationEffect() {
        // TODO: Implement visual effect when power-up is activated
        console.log(`Activated ${this.type} power-up!`);
    }

    showDeactivationEffect() {
        // TODO: Implement visual effect when power-up expires
        console.log(`Deactivated ${this.type} power-up`);
    }

    getDescription() {
        return this.effects[this.type]?.description || this.type;
    }
}
