// Power-up Manager - Niki
// TODO: Implement power-up system
// - [ ] Create different power-up types
// - [ ] Add power-up spawning logic
// - [ ] Implement power-up effects
// - [ ] Add visual feedback for active power-ups

import { PowerUp } from './PowerUp.js';

export class PowerUpManager {
    constructor(game) {
        this.game = game;
        this.activePowerUps = [];
        this.availablePowerUps = [
            { type: 'speed', duration: 10000, probability: 0.3 },
            { type: 'slow', duration: 8000, probability: 0.3 },
            { type: 'grow', duration: 0, probability: 0.2 },
            { type: 'shrink', duration: 10000, probability: 0.2 }
        ];
    }

    update(deltaTime) {
        // Update active power-ups
        for (let i = this.activePowerUps.length - 1; i >= 0; i--) {
            const powerUp = this.activePowerUps[i];
            powerUp.update(deltaTime);
            
            if (powerUp.isExpired()) {
                this.deactivatePowerUp(powerUp);
                this.activePowerUps.splice(i, 1);
            }
        }
    }

    spawnPowerUp() {
        // Randomly decide if a power-up should spawn
        if (Math.random() < 0.1) { // 10% chance to spawn a power-up
            const available = this.availablePowerUps.filter(p => 
                !this.activePowerUps.some(active => active.type === p.type)
            );
            
            if (available.length > 0) {
                const powerUp = this.selectRandomPowerUp(available);
                this.activatePowerUp(powerUp);
            }
        }
    }

    selectRandomPowerUp(availablePowerUps) {
        const total = availablePowerUps.reduce((sum, p) => sum + p.probability, 0);
        let random = Math.random() * total;
        
        for (const powerUp of availablePowerUps) {
            if (random < powerUp.probability) {
                return new PowerUp(powerUp.type, powerUp.duration);
            }
            random -= powerUp.probability;
        }
        
        // Fallback to first available power-up
        return new PowerUp(availablePowerUps[0].type, availablePowerUps[0].duration);
    }

    activatePowerUp(powerUp) {
        this.activePowerUps.push(powerUp);
        powerUp.activate(this.game);
        
        // Visual feedback
        console.log(`Power-up activated: ${powerUp.type}`);
        
        return powerUp;
    }

    deactivatePowerUp(powerUp) {
        powerUp.deactivate(this.game);
        
        // Visual feedback
        console.log(`Power-up deactivated: ${powerUp.type}`);
    }

    clearPowerUps() {
        this.activePowerUps.forEach(powerUp => this.deactivatePowerUp(powerUp));
        this.activePowerUps = [];
    }

    hasPowerUp(type) {
        return this.activePowerUps.some(powerUp => powerUp.type === type);
    }
}
