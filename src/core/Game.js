// Core Game Module - Aanya
// TODO: Implement core game loop and state management
// - [ ] Optimize collision detection
// - [ ] Implement game state persistence
// - [ ] Add game difficulty levels

import { GameState } from './GameState.js';
import { InputHandler } from './InputHandler.js';

export class Game {
    constructor() {
        this.state = new GameState();
        this.input = new InputHandler(this);
        this.lastUpdateTime = 0;
        this.accumulator = 0;
        this.timestep = 1000/60; // 60 FPS
    }

    init() {
        this.state.init();
        this.lastUpdateTime = performance.now();
        this.gameLoop(this.lastUpdateTime);
    }

    update(deltaTime) {
        // Core game update logic
        this.state.update(deltaTime);
    }

    render() {
        // Core rendering logic
        this.state.render();
    }

    gameLoop(timestamp) {
        // Fixed timestep game loop
        let deltaTime = timestamp - this.lastUpdateTime;
        this.lastUpdateTime = timestamp;
        
        this.accumulator += deltaTime;
        
        while (this.accumulator >= this.timestep) {
            this.update(this.timestep);
            this.accumulator -= this.timestep;
        }
        
        this.render();
        
        if (!this.state.isGameOver) {
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    // Game controls
    pause() {
        this.state.pause();
    }

    resume() {
        this.state.resume();
    }

    reset() {
        this.state.reset();
    }
}
