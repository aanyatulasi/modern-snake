// AdvancedSnakeGame.js - Modern Snake Game Engine with Advanced Features

const GAME_STATES = Object.freeze({
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAME_OVER: 'gameover'
});

export class AdvancedSnakeGame {
    constructor(canvasId, options = {}) {
        // Canvas setup
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Game configuration
        this.config = {
            gridSize: 20,
            cellSize: 20,
            tickRate: 10,
            showGrid: true,
            ...options
        };
        
        // Game state
        this.state = GAME_STATES.MENU;
        this.score = 0;
        this.highScore = 0;
        this.lastUpdate = 0;
        this.accumulator = 0;
        this.tickLength = 1000 / this.config.tickRate;
        
        // Game objects
        this.playerSnake = null;
        this.aiSnakes = [];
        this.food = [];
        this.particles = [];
        this.powerUps = [];
        
        // Initialize
        this.init();
    }
    
    // Initialize the game
    init() {
        this.setupEventListeners();
        this.resize();
        this.reset();
    }
    
    // Start the game
    start() {
        if (this.state === GAME_STATES.PLAYING) return;
        
        this.state = GAME_STATES.PLAYING;
        this.lastUpdate = performance.now();
        this.gameLoop(this.lastUpdate);
    }
    
    // Pause the game
    pause() {
        if (this.state === GAME_STATES.PLAYING) {
            this.state = GAME_STATES.PAUSED;
        } else if (this.state === GAME_STATES.PAUSED) {
            this.state = GAME_STATES.PLAYING;
            this.lastUpdate = performance.now();
            this.gameLoop(this.lastUpdate);
        }
    }
    
    // Reset the game
    reset() {
        // Reset game state
        this.score = 0;
        this.state = GAME_STATES.MENU;
        
        // Create player snake
        this.playerSnake = this.createSnake(10, 10, 'player');
        
        // Create AI snakes
        this.aiSnakes = [
            this.createSnake(15, 15, 'ai')
        ];
        
        // Spawn initial food
        this.spawnFood(5);
        
        // Clear particles
        this.particles = [];
    }
    
    // Create a new snake
    createSnake(x, y, type) {
        return {
            body: [
                {x, y},
                {x: x - 1, y},
                {x: x - 2, y}
            ],
            direction: {x: 1, y: 0},
            nextDirection: {x: 1, y: 0},
            type,
            speed: 1,
            growAmount: 0,
            color: type === 'player' ? '#4CAF50' : '#2196F3',
            isAlive: true
        };
    }
    
    // Spawn food at random positions
    spawnFood(count = 1) {
        for (let i = 0; i < count; i++) {
            this.food.push({
                x: Math.floor(Math.random() * this.config.gridSize),
                y: Math.floor(Math.random() * this.config.gridSize),
                type: 'normal',
                value: 10
            });
        }
    }
    
    // Game loop
    gameLoop(timestamp) {
        // Calculate delta time
        const deltaTime = timestamp - this.lastUpdate;
        this.lastUpdate = timestamp;
        
        // Fixed timestep update
        this.accumulator += deltaTime;
        while (this.accumulator >= this.tickLength) {
            if (this.state === GAME_STATES.PLAYING) {
                this.update(this.tickLength);
            }
            this.accumulator -= this.tickLength;
        }
        
        // Render
        this.render();
        
        // Continue the loop
        if (this.state !== GAME_STATES.GAME_OVER) {
            requestAnimationFrame(t => this.gameLoop(t));
        }
    }
    
    // Update game state
    update(deltaTime) {
        // Update player snake
        this.updateSnake(this.playerSnake, deltaTime);
        
        // Update AI snakes
        this.aiSnakes.forEach(snake => {
            if (snake.isAlive) {
                this.updateAISnake(snake, deltaTime);
                this.updateSnake(snake, deltaTime);
            }
        });
        
        // Update particles
        this.updateParticles(deltaTime);
        
        // Check collisions
        this.checkCollisions();
    }
    
    // Update snake movement
    updateSnake(snake, deltaTime) {
        if (!snake.isAlive) return;
        
        // Update direction
        snake.direction = {...snake.nextDirection};
        
        // Move snake
        const head = {...snake.body[0]};
        head.x += snake.direction.x * snake.speed * (deltaTime / 16);
        head.y += snake.direction.y * snake.speed * (deltaTime / 16);
        
        // Grid-based movement
        if (Math.abs(head.x - Math.round(head.x)) < 0.1 &&
            Math.abs(head.y - Math.round(head.y)) < 0.1) {
            
            const newHead = {
                x: Math.round(head.x),
                y: Math.round(head.y)
            };
            
            // Wrap around edges
            if (newHead.x >= this.config.gridSize) newHead.x = 0;
            if (newHead.x < 0) newHead.x = this.config.gridSize - 1;
            if (newHead.y >= this.config.gridSize) newHead.y = 0;
            if (newHead.y < 0) newHead.y = this.config.gridSize - 1;
            
            snake.body.unshift(newHead);
            
            if (snake.growAmount > 0) {
                snake.growAmount--;
            } else {
                snake.body.pop();
            }
        } else {
            snake.body[0] = head;
        }
    }
    
    // Simple AI for opponent snakes
    updateAISnake(snake, deltaTime) {
        if (!this.food.length) return;
        
        // Simple AI: Move towards the nearest food
        const head = snake.body[0];
        const nearestFood = this.findNearestFood(head);
        
        if (!nearestFood) return;
        
        const dx = nearestFood.x - head.x;
        const dy = nearestFood.y - head.y;
        
        // Change direction if needed
        if (Math.abs(dx) > Math.abs(dy)) {
            snake.nextDirection = {
                x: dx > 0 ? 1 : -1,
                y: 0
            };
        } else {
            snake.nextDirection = {
                x: 0,
                y: dy > 0 ? 1 : -1
            };
        }
        
        // Prevent 180-degree turns
        if (snake.direction.x === -snake.nextDirection.x && 
            snake.direction.y === -snake.nextDirection.y) {
            snake.nextDirection = {...snake.direction};
        }
    }
    
    // Find the nearest food to a position
    findNearestFood(position) {
        if (!this.food.length) return null;
        
        let nearest = this.food[0];
        let minDist = this.distance(position, nearest);
        
        for (const food of this.food) {
            const dist = this.distance(position, food);
            if (dist < minDist) {
                minDist = dist;
                nearest = food;
            }
        }
        
        return nearest;
    }
    
    // Calculate distance between two points
    distance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }
    
    // Update particle effects
    updateParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * deltaTime * 0.1;
            p.y += p.vy * deltaTime * 0.1;
            p.life -= deltaTime;
            
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    // Check for collisions
    checkCollisions() {
        // Check food collision
        const head = this.playerSnake.body[0];
        for (let i = this.food.length - 1; i >= 0; i--) {
            const food = this.food[i];
            if (Math.round(head.x) === food.x && Math.round(head.y) === food.y) {
                this.onFoodEaten(food, i);
            }
        }
        
        // Check self collision
        for (let i = 1; i < this.playerSnake.body.length; i++) {
            const segment = this.playerSnake.body[i];
            if (Math.round(head.x) === Math.round(segment.x) && 
                Math.round(head.y) === Math.round(segment.y)) {
                this.gameOver();
                return;
            }
        }
    }
    
    // Handle food being eaten
    onFoodEaten(food, index) {
        // Remove the eaten food
        this.food.splice(index, 1);
        
        // Increase score
        this.score += food.value;
        this.highScore = Math.max(this.score, this.highScore);
        
        // Grow snake
        this.playerSnake.growAmount += 3;
        
        // Spawn new food
        this.spawnFood(1);
        
        // Create particles
        this.createParticles(food.x + 0.5, food.y + 0.5, food.color || '#FF5252');
    }
    
    // Create particle effect
    createParticles(x, y, color) {
        const count = 10;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speed = 0.1 + Math.random() * 0.2;
            
            this.particles.push({
                x: x * this.config.cellSize,
                y: y * this.config.cellSize,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color,
                size: 2 + Math.random() * 3,
                life: 500 + Math.random() * 500
            });
        }
    }
    
    // Game over handler
    gameOver() {
        this.state = GAME_STATES.GAME_OVER;
        console.log('Game Over! Score:', this.score);
    }
    
    // Render the game
    render() {
        const { ctx, canvas } = this;
        const cellSize = this.config.cellSize;
        
        // Clear canvas
        ctx.fillStyle = '#121212';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        if (this.config.showGrid) {
            ctx.strokeStyle = '#1E1E1E';
            ctx.lineWidth = 0.5;
            
            // Vertical lines
            for (let x = 0; x <= canvas.width; x += cellSize) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, canvas.height);
                ctx.stroke();
            }
            
            // Horizontal lines
            for (let y = 0; y <= canvas.height; y += cellSize) {
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(canvas.width, y);
                ctx.stroke();
            }
        }
        
        // Draw food
        this.food.forEach(food => {
            ctx.fillStyle = food.color || '#FF5252';
            const size = cellSize * 0.6;
            const offset = (cellSize - size) / 2;
            ctx.fillRect(
                food.x * cellSize + offset,
                food.y * cellSize + offset,
                size,
                size
            );
        });
        
        // Draw snakes
        const drawSnake = (snake) => {
            if (!snake.isAlive) return;
            
            ctx.fillStyle = snake.color;
            
            // Draw body
            snake.body.forEach((segment, index) => {
                const isHead = index === 0;
                const size = isHead ? cellSize * 0.9 : cellSize * 0.8;
                const offset = (cellSize - size) / 2;
                
                ctx.fillRect(
                    segment.x * cellSize + offset,
                    segment.y * cellSize + offset,
                    size,
                    size
                );
                
                // Draw eyes on head
                if (isHead) {
                    const eyeSize = cellSize * 0.2;
                    const eyeOffset = cellSize * 0.25;
                    
                    ctx.fillStyle = '#FFFFFF';
                    
                    // Left eye
                    ctx.beginPath();
                    ctx.arc(
                        segment.x * cellSize + eyeOffset,
                        segment.y * cellSize + eyeOffset,
                        eyeSize,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                    
                    // Right eye
                    ctx.beginPath();
                    ctx.arc(
                        (segment.x + 1) * cellSize - eyeOffset,
                        segment.y * cellSize + eyeOffset,
                        eyeSize,
                        0,
                        Math.PI * 2
                    );
                    ctx.fill();
                    
                    // Reset color
                    ctx.fillStyle = snake.color;
                }
            });
        };
        
        // Draw all snakes
        drawSnake(this.playerSnake);
        this.aiSnakes.forEach(drawSnake);
        
        // Draw particles
        this.particles.forEach(p => {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.min(1, p.life / 500);
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;
        
        // Draw UI
        this.drawUI();
    }
    
    // Draw UI elements
    drawUI() {
        const { ctx, canvas } = this;
        
        // Score
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${this.score}`, 10, 30);
        ctx.fillText(`High Score: ${this.highScore}`, 10, 60);
        
        // Game state messages
        if (this.state === GAME_STATES.MENU) {
            this.drawCenteredText('SNAKE GAME', 40, '#4CAF50');
            this.drawCenteredText('Press SPACE to Start', canvas.height / 2, '#FFFFFF');
        } else if (this.state === GAME_STATES.PAUSED) {
            this.drawCenteredText('PAUSED', canvas.height / 2, '#FFFFFF');
        } else if (this.state === GAME_STATES.GAME_OVER) {
            this.drawCenteredText('GAME OVER', canvas.height / 2 - 30, '#FF5252');
            this.drawCenteredText(`Final Score: ${this.score}`, canvas.height / 2 + 10, '#FFFFFF');
            this.drawCenteredText('Press R to Restart', canvas.height / 2 + 50, '#FFFFFF');
        }
    }
    
    // Helper to draw centered text
    drawCenteredText(text, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, this.canvas.width / 2, y);
        this.ctx.textAlign = 'left';
    }
    
    // Handle window resize
    resize() {
        const size = Math.min(window.innerWidth - 40, window.innerHeight - 120, 600);
        this.canvas.width = size;
        this.canvas.height = size;
        this.config.cellSize = size / this.config.gridSize;
    }
    
    // Handle keyboard input
    handleInput(event) {
        if (this.state === GAME_STATES.MENU && event.code === 'Space') {
            this.start();
            return;
        }
        
        if (this.state === GAME_STATES.GAME_OVER && event.key.toLowerCase() === 'r') {
            this.reset();
            this.start();
            return;
        }
        
        if (this.state !== GAME_STATES.PLAYING) return;
        
        const key = event.key.toLowerCase();
        const dir = this.playerSnake.nextDirection;
        
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                if (this.playerSnake.direction.y === 0) {
                    dir.x = 0;
                    dir.y = -1;
                }
                break;
                
            case 'ArrowDown':
            case 'KeyS':
                if (this.playerSnake.direction.y === 0) {
                    dir.x = 0;
                    dir.y = 1;
                }
                break;
                
            case 'ArrowLeft':
            case 'KeyA':
                if (this.playerSnake.direction.x === 0) {
                    dir.x = -1;
                    dir.y = 0;
                }
                break;
                
            case 'ArrowRight':
            case 'KeyD':
                if (this.playerSnake.direction.x === 0) {
                    dir.x = 1;
                    dir.y = 0;
                }
                break;
                
            case 'Escape':
                this.pause();
                break;
        }
    }
    
    // Setup event listeners
    setupEventListeners() {
        window.addEventListener('keydown', this.handleInput.bind(this));
        window.addEventListener('resize', this.resize.bind(this));
        
        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        
        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (!touchStartX || !touchStartY) return;
            
            const touchEndX = e.touches[0].clientX;
            const touchEndY = e.touches[0].clientY;
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                // Horizontal swipe
                if (dx > 0 && this.playerSnake.direction.x >= 0) {
                    this.playerSnake.nextDirection = { x: 1, y: 0 };
                } else if (dx < 0 && this.playerSnake.direction.x <= 0) {
                    this.playerSnake.nextDirection = { x: -1, y: 0 };
                }
            } else {
                // Vertical swipe
                if (dy > 0 && this.playerSnake.direction.y >= 0) {
                    this.playerSnake.nextDirection = { x: 0, y: 1 };
                } else if (dy < 0 && this.playerSnake.direction.y <= 0) {
                    this.playerSnake.nextDirection = { x: 0, y: -1 };
                }
            }
            
            touchStartX = touchEndX;
            touchStartY = touchEndY;
            e.preventDefault();
        }, { passive: false });
    }
    
    // Clean up
    destroy() {
        window.removeEventListener('keydown', this.handleInput);
        window.removeEventListener('resize', this.resize);
        this.state = GAME_STATES.GAME_OVER;
    }
}

// Export the game class
export default AdvancedSnakeGame;
