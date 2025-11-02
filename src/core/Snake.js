// Snake Class - Aanya
// TODO: Implement snake movement and growth
// - [ ] Add smooth movement interpolation
// - [ ] Implement different snake skins
// - [ ] Add trail effects

export class Snake {
    constructor(gridSize) {
        this.gridSize = gridSize;
        this.reset();
    }

    reset() {
        this.body = [
            { x: Math.floor(this.gridSize / 2), y: Math.floor(this.gridSize / 2) },
            { x: Math.floor(this.gridSize / 2) - 1, y: Math.floor(this.gridSize / 2) },
            { x: Math.floor(this.gridSize / 2) - 2, y: Math.floor(this.gridSize / 2) }
        ];
        this.direction = { x: 1, y: 0 };
        this.nextDirection = { x: 1, y: 0 };
        this.speed = 0.15; // cells per millisecond
        this.moveCounter = 0;
        this.growNextUpdate = false;
    }

    update(deltaTime) {
        // Update direction
        this.direction = { ...this.nextDirection };
        
        // Move snake based on speed
        this.moveCounter += deltaTime * this.speed;
        
        if (this.moveCounter >= 1) {
            this.moveCounter = 0;
            this.move();
        }
    }

    move() {
        const head = this.getHead();
        const newHead = {
            x: head.x + this.direction.x,
            y: head.y + this.direction.y
        };

        // Add new head
        this.body.unshift(newHead);
        
        // Remove tail if not growing
        if (!this.growNextUpdate) {
            this.body.pop();
        } else {
            this.growNextUpdate = false;
        }
    }

    grow() {
        this.growNextUpdate = true;
    }

    changeDirection(newDirection) {
        // Prevent 180-degree turns
        if (this.direction.x !== -newDirection.x || this.direction.y !== -newDirection.y) {
            this.nextDirection = newDirection;
        }
    }

    getHead() {
        return this.body[0];
    }

    checkSelfCollision() {
        const head = this.getHead();
        // Skip the head when checking for collisions
        return this.body.slice(1).some(segment => 
            segment.x === head.x && segment.y === head.y
        );
    }

    increaseSpeed() {
        this.speed *= 1.1; // Increase speed by 10% each level
    }

    getSegments() {
        return [...this.body];
    }
}
