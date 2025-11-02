import { CONFIG } from './config.js';
import { PowerUpManager } from './powerups.js';

class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.scoreElement = document.getElementById('score');
    this.startButton = document.getElementById('startBtn');
    
    // Game state
    this.resetGame();
    this.setupEventListeners();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  resetGame() {
    this.snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    this.direction = { x: 1, y: 0 };
    this.nextDirection = { x: 1, y: 0 };
    this.food = this.generateFood();
    this.score = 0;
    this.gameOver = false;
    this.gameLoop = null;
    this.lastUpdateTime = 0;
    this.updateInterval = 1000 / CONFIG.GAME_SPEED;
    this.scoreElement.textContent = this.score;

    // Power-ups
    if (!this.powerups) {
      this.powerups = new PowerUpManager(this);
    }
    this.powerups.reset(performance.now());
  }

  setupEventListeners() {
    // Keyboard controls
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Touch controls
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
        // Horizontal movement
        if (dx > 0 && this.direction.x !== -1) {
          this.nextDirection = { x: 1, y: 0 }; // Right
        } else if (dx < 0 && this.direction.x !== 1) {
          this.nextDirection = { x: -1, y: 0 }; // Left
        }
      } else {
        // Vertical movement
        if (dy > 0 && this.direction.y !== -1) {
          this.nextDirection = { x: 0, y: 1 }; // Down
        } else if (dy < 0 && this.direction.y !== 1) {
          this.nextDirection = { x: 0, y: -1 }; // Up
        }
      }
      
      touchStartX = touchEndX;
      touchStartY = touchEndY;
      e.preventDefault();
    }, { passive: false });
    
    // Mobile controls
    document.getElementById('upBtn').addEventListener('click', () => 
      this.handleDirectionChange(0, -1));
    document.getElementById('downBtn').addEventListener('click', () => 
      this.handleDirectionChange(0, 1));
    document.getElementById('leftBtn').addEventListener('click', () => 
      this.handleDirectionChange(-1, 0));
    document.getElementById('rightBtn').addEventListener('click', () => 
      this.handleDirectionChange(1, 0));
        
    // Start button
    this.startButton.addEventListener('click', () => this.startGame());
  }

  handleDirectionChange(x, y) {
    // Prevent 180-degree turns
    if (this.direction.x !== -x && this.direction.y !== -y) {
      this.nextDirection = { x, y };
    }
  }

  handleKeyDown(e) {
    switch (e.key) {
      case CONFIG.CONTROLS.ARROW_UP:
        this.handleDirectionChange(0, -1);
        break;
      case CONFIG.CONTROLS.ARROW_DOWN:
        this.handleDirectionChange(0, 1);
        break;
      case CONFIG.CONTROLS.ARROW_LEFT:
        this.handleDirectionChange(-1, 0);
        break;
      case CONFIG.CONTROLS.ARROW_RIGHT:
        this.handleDirectionChange(1, 0);
        break;
      case CONFIG.CONTROLS.SPACE:
        if (this.gameOver) this.startGame();
        break;
      case CONFIG.CONTROLS.ESC:
        if (!this.gameOver) this.gameOver = true;
        break;
    }
  }

  startGame() {
    if (this.gameLoop) {
      cancelAnimationFrame(this.gameLoop);
    }
    this.resetGame();
    this.gameOver = false;
    this.startButton.textContent = 'Restart Game';
    this.lastUpdateTime = performance.now();
    this.gameLoop = requestAnimationFrame((timestamp) => this.gameStep(timestamp));
  }

  gameStep(timestamp) {
    // Calculate time since last update
    const deltaTime = timestamp - this.lastUpdateTime;
    
    // Update power-ups system
    this.powerups.update(timestamp);

    // Only update at the effective interval factoring power-ups
    const effectiveInterval = this.updateInterval / this.powerups.getSpeedScale();
    if (deltaTime >= effectiveInterval) {
      this.lastUpdateTime = timestamp - (deltaTime % this.updateInterval);
      
      if (!this.gameOver) {
        this.update();
      }
      this.draw();
    }
        
    if (!this.gameOver) {
      this.gameLoop = requestAnimationFrame((ts) => this.gameStep(ts));
    }
  }

  update() {
    // Update direction
    this.direction = { ...this.nextDirection };
    
    // Calculate new head position
    const head = {
      x: this.snake[0].x + this.direction.x,
      y: this.snake[0].y + this.direction.y
    };

    // Ghost mode: wrap through walls
    if (this.powerups && this.powerups.hasGhost()) {
      const max = CONFIG.TILE_COUNT;
      head.x = (head.x + max) % max;
      head.y = (head.y + max) % max;
    } else {
      // Check collision with walls
      if (head.x < 0 || head.x >= CONFIG.TILE_COUNT || head.y < 0 || head.y >= CONFIG.TILE_COUNT) {
        if (!(this.powerups && this.powerups.hasShield())) {
          this.gameOver = true;
          return;
        }
      }
    }

    // Self collision
    const hitSelf = this.snake.some(segment => segment.x === head.x && segment.y === head.y);
    if (hitSelf && !(this.powerups && this.powerups.hasShield())) {
      this.gameOver = true;
      return;
    }

    // Add new head
    this.snake.unshift(head);

    // Try collecting a spawned power-up
    if (this.powerups) {
      this.powerups.tryCollect(head, performance.now());
    }

    // Check if food is eaten
    if (head.x === this.food.x && head.y === this.food.y) {
      const mult = this.powerups ? this.powerups.getScoreMultiplier() : 1;
      this.score += 10 * mult;
      this.scoreElement.textContent = this.score;
      this.food = this.generateFood();
    } else {
      // Remove tail if no food was eaten
      this.snake.pop();
    }

    // Magnet: gently pull food toward head by 1 tile if path is free
    if (this.powerups && this.powerups.hasMagnet() && this.food) {
      const dx = Math.sign(head.x - this.food.x);
      const dy = Math.sign(head.y - this.food.y);
      const candidate = { x: this.food.x + (Math.abs(head.x - this.food.x) >= Math.abs(head.y - this.food.y) ? dx : 0),
                          y: this.food.y + (Math.abs(head.y - this.food.y) > Math.abs(head.x - this.food.x) ? dy : 0) };
      const blocked = this.snake.some(seg => seg.x === candidate.x && seg.y === candidate.y) ||
                      candidate.x < 0 || candidate.x >= CONFIG.TILE_COUNT ||
                      candidate.y < 0 || candidate.y >= CONFIG.TILE_COUNT;
      if (!blocked) {
        this.food = candidate;
      }
    }
  }

  checkCollision(position) {
    // Wall collision
    if (
      position.x < 0 || 
      position.x >= CONFIG.TILE_COUNT || 
      position.y < 0 || 
      position.y >= CONFIG.TILE_COUNT
    ) {
      return true;
    }

    // Self collision
    return this.snake.some(segment => 
      segment.x === position.x && segment.y === position.y
    );
  }

  generateFood() {
    let food;
    do {
      food = {
        x: Math.floor(Math.random() * CONFIG.TILE_COUNT),
        y: Math.floor(Math.random() * CONFIG.TILE_COUNT)
      };
    } while (this.snake.some(segment => 
      segment.x === food.x && segment.y === food.y
    ));
    return food;
  }

  draw() {
    const { ctx, canvas } = this;
    const tileSize = canvas.width / CONFIG.TILE_COUNT;
    
    // Clear canvas
    ctx.fillStyle = CONFIG.COLORS.BACKGROUND;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
        
    // Draw grid
    ctx.strokeStyle = CONFIG.COLORS.GRID;
    ctx.lineWidth = 0.5;
        
    for (let i = 0; i < CONFIG.TILE_COUNT; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * tileSize, 0);
      ctx.lineTo(i * tileSize, canvas.height);
      ctx.stroke();
            
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * tileSize);
      ctx.lineTo(canvas.width, i * tileSize);
      ctx.stroke();
    }
        
    // Draw active power-up pickup
    if (this.powerups) {
      this.powerups.drawPickup(ctx, tileSize);
    }

    // Draw snake
    this.snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? CONFIG.COLORS.SNAKE_HEAD : CONFIG.COLORS.SNAKE_BODY;
            
      // Add rounded corners to snake segments
      const x = segment.x * tileSize;
      const y = segment.y * tileSize;
      const radius = tileSize / 2;
            
      // Flashy glow when shield or speed active
      if (this.powerups && (this.powerups.hasShield())) {
        ctx.save();
        ctx.shadowColor = 'rgba(34,197,94,0.9)';
        ctx.shadowBlur = 20;
      } else if (this.powerups && (this.powerups.isActive && (this.powerups.isActive('speed') || this.powerups.isActive('slow')))) {
        ctx.save();
        ctx.shadowColor = this.powerups.isActive('speed') ? 'rgba(255,107,107,0.9)' : 'rgba(77,171,247,0.9)';
        ctx.shadowBlur = 15;
      }

      ctx.beginPath();
      ctx.arc(
        x + radius, 
        y + radius, 
        radius * 0.9, 
        0, 
        Math.PI * 2
      );
      ctx.fill();
            
      if (this.powerups && (this.powerups.hasShield() || (this.powerups.isActive && (this.powerups.isActive('speed') || this.powerups.isActive('slow'))))) {
        ctx.restore();
      }

      // Add eyes to the head
      if (isHead) {
        const eyeRadius = radius * 0.2;
        const eyeOffsetX = this.direction.x !== 0 ? 0.3 : 0.2;
        const eyeOffsetY = this.direction.y !== 0 ? 0.3 : 0.2;
        const eyeX = this.direction.x === 1 ? 0.7 : this.direction.x === -1 ? 0.3 : 0.5;
        const eyeY = this.direction.y === 1 ? 0.7 : this.direction.y === -1 ? 0.3 : 0.5;
                
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(
          x + eyeX * tileSize - (this.direction.x * eyeOffsetX * tileSize / 2),
          y + eyeY * tileSize - (this.direction.y * eyeOffsetY * tileSize / 2),
          eyeRadius,
          0,
          Math.PI * 2
        );
        ctx.arc(
          x + (1 - eyeX) * tileSize + (this.direction.x * eyeOffsetX * tileSize / 2),
          y + (1 - eyeY) * tileSize + (this.direction.y * eyeOffsetY * tileSize / 2),
          eyeRadius,
          0,
          Math.PI * 2
        );
        ctx.fill();
                
        // Pupils
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(
          x + eyeX * tileSize - (this.direction.x * eyeOffsetX * tileSize / 2) + (this.direction.x * eyeRadius * 0.5),
          y + eyeY * tileSize - (this.direction.y * eyeOffsetY * tileSize / 2) + (this.direction.y * eyeRadius * 0.5),
          eyeRadius * 0.5,
          0,
          Math.PI * 2
        );
        ctx.arc(
          x + (1 - eyeX) * tileSize + (this.direction.x * eyeOffsetX * tileSize / 2) + (this.direction.x * eyeRadius * 0.5),
          y + (1 - eyeY) * tileSize + (this.direction.y * eyeOffsetY * tileSize / 2) + (this.direction.y * eyeRadius * 0.5),
          eyeRadius * 0.5,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    });
        
    // Draw food
    ctx.fillStyle = CONFIG.COLORS.FOOD;
    ctx.beginPath();
    ctx.arc(
      (this.food.x * tileSize) + (tileSize / 2),
      (this.food.y * tileSize) + (tileSize / 2),
      tileSize * 0.4,
      0,
      Math.PI * 2
    );
    ctx.fill();
        
    // Draw game over screen
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = 'white';
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 30);
      
      ctx.font = '20px Arial';
      ctx.fillText(`Score: ${this.score}`, canvas.width / 2, canvas.height / 2 + 20);
      ctx.fillText('Press Space to Restart', canvas.width / 2, canvas.height / 2 + 60);
    }

    // Active power-ups HUD timers
    if (this.powerups) {
      this.powerups.drawHUD(ctx, canvas.width);
    }
  }

  resizeCanvas() {
    // Calculate maximum possible size that fits the container while maintaining aspect ratio
    const container = this.canvas.parentElement;
    const size = Math.min(
      container.clientWidth - 40, // 20px padding on each side
      500, // Max width
      window.innerHeight - 200 // Account for header and controls
    );
        
    this.canvas.width = size;
    this.canvas.height = size;
        
    // Redraw if game is running
    if (!this.gameOver) {
      this.draw();
    }
  }
}

// Initialize the game when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
});

// Expose CONFIG to the class so powerups.js can read tile count
Game.CONFIG = CONFIG;
