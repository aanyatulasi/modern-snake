// Game State Module - Aanya
// TODO: Implement game state management
// - [ ] Add save/load game state
// - [ ] Implement game state transitions
// - [ ] Add validation for game state

import { CONFIG } from '../config.js';
import { Snake } from './Snake.js';
import { Food } from './Food.js';

export class GameState {
    constructor() {
        this.score = 0;
        this.highScore = 0;
        this.level = 1;
        this.isPaused = false;
        this.isGameOver = false;
        this.snake = null;
        this.food = null;
        this.gridSize = CONFIG.GRID_SIZE;
    }

    init() {
        this.score = 0;
        this.level = 1;
        this.isPaused = false;
        this.isGameOver = false;
        this.snake = new Snake(this.gridSize);
        this.food = new Food(this.gridSize, this.snake);
    }

    update(deltaTime) {
        if (this.isPaused || this.isGameOver) return;

        // Update game objects
        this.snake.update(deltaTime);
        
        // Check for collisions
        this.checkCollisions();
        
        // Check if food is eaten
        this.checkFoodCollision();
    }

    checkCollisions() {
        // Wall collision
        const head = this.snake.getHead();
        if (head.x < 0 || head.x >= this.gridSize || 
            head.y < 0 || head.y >= this.gridSize) {
            this.gameOver();
            return;
        }

        // Self collision
        if (this.snake.checkSelfCollision()) {
            this.gameOver();
        }
    }

    checkFoodCollision() {
        const head = this.snake.getHead();
        const food = this.food.position;
        
        if (head.x === food.x && head.y === food.y) {
            this.snake.grow();
            this.score += 10 * this.level;
            this.food.respawn(this.snake);
            
            // Level up every 100 points
            if (this.score >= this.level * 100) {
                this.level++;
                this.snake.increaseSpeed();
            }
        }
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    reset() {
        this.init();
    }

    gameOver() {
        this.isGameOver = true;
        this.highScore = Math.max(this.score, this.highScore);
        // TODO: Save high score to local storage
    }
}
