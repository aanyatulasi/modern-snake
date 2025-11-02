// Food Class - Aanya
// TODO: Implement different food types and effects
// - [ ] Add special food with power-ups
// - [ ] Implement food spawning rules
// - [ ] Add visual effects for food

export class Food {
    constructor(gridSize, snake) {
        this.gridSize = gridSize;
        this.position = this.generatePosition(snake);
        this.type = 'normal'; // Can be 'normal', 'bonus', 'special', etc.
    }

    generatePosition(snake) {
        let position;
        const occupied = new Set(
            snake.getSegments().map(segment => `${segment.x},${segment.y}`)
        );
        
        do {
            position = {
                x: Math.floor(Math.random() * this.gridSize),
                y: Math.floor(Math.random() * this.gridSize)
            };
        } while (occupied.has(`${position.x},${position.y}`));
        
        return position;
    }

    respawn(snake) {
        this.position = this.generatePosition(snake);
        // TODO: Randomly determine food type with different probabilities
        this.type = 'normal';
    }

    getPosition() {
        return { ...this.position };
    }

    getType() {
        return this.type;
    }
}
