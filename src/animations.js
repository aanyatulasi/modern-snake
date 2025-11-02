// Particle System for Modern Snake Game
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        document.body.appendChild(this.canvas);
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles(x, y, count, color, options = {}) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = (options.speed || 1) * (0.5 + Math.random() * 0.5);
            const size = (options.size || 2) * (0.5 + Math.random());
            
            this.particles.push({
                x,
                y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size,
                color: color || this.getRandomColor(),
                life: 1.0,
                decay: 0.02 + Math.random() * 0.03,
                gravity: options.gravity || 0,
                friction: options.friction || 0.95
            });
        }
    }

    getRandomColor() {
        const colors = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00', '#ff9900'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Update position
            p.x += p.vx;
            p.y += p.vy;
            
            // Apply physics
            p.vy += p.gravity;
            p.vx *= p.friction;
            p.vy *= p.friction;
            
            // Update life
            p.life -= p.decay;
            
            // Remove dead particles
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }
            
            // Draw particle
            this.ctx.globalAlpha = p.life;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1.0;
        requestAnimationFrame(() => this.update());
    }
}

// Animation Manager
class AnimationManager {
    constructor() {
        this.particleSystem = new ParticleSystem();
        this.particleSystem.update();
        this.shakeIntensity = 0;
        this.screenShakeTimeout = null;
    }

    // Snake trail effect
    createSnakeTrail(x, y, color) {
        this.particleSystem.createParticles(x, y, 3, color, {
            size: 2,
            speed: 0.5,
            gravity: 0.1,
            friction: 0.9
        });
    }

    // Food collection effect
    createFoodEffect(x, y) {
        // Flash effect
        this.screenFlash('#00ff00', 0.2);
        
        // Particle explosion
        for (let i = 0; i < 20; i++) {
            this.particleSystem.createParticles(x, y, 1, '#00ff00', {
                size: 3,
                speed: 3,
                gravity: 0.1,
                friction: 0.9
            });
        }
        
        // Score popup
        this.createScorePopup(x, y, '+1');
    }

    // Power-up collection effect
    createPowerUpEffect(x, y) {
        // Screen flash
        this.screenFlash('#ff00ff', 0.3);
        
        // Rainbow explosion
        for (let i = 0; i < 50; i++) {
            this.particleSystem.createParticles(x, y, 1, null, {
                size: 4,
                speed: 5,
                gravity: 0.1,
                friction: 0.9
            });
        }
        
        // Screen shake
        this.screenShake(10, 200);
        
        // Score popup
        this.createScorePopup(x, y, 'POWER UP!', '#ff00ff');
    }

    // Score popup animation
    createScorePopup(x, y, text, color = '#00ff00') {
        const popup = document.createElement('div');
        popup.textContent = text;
        popup.style.position = 'absolute';
        popup.style.left = `${x}px`;
        popup.style.top = `${y}px`;
        popup.style.color = color;
        popup.style.fontWeight = 'bold';
        popup.style.fontSize = '20px';
        popup.style.textShadow = '0 0 10px rgba(255,255,255,0.7)';
        popup.style.pointerEvents = 'none';
        popup.style.transform = 'translate(-50%, -50%)';
        popup.style.transition = 'all 0.5s ease-out';
        popup.style.opacity = '0';
        
        document.body.appendChild(popup);
        
        // Trigger reflow
        void popup.offsetWidth;
        
        // Animate
        popup.style.opacity = '1';
        popup.style.transform = 'translate(-50%, -100%)';
        
        // Remove after animation
        setTimeout(() => {
            popup.style.opacity = '0';
            popup.style.transform = 'translate(-50%, -200%)';
            setTimeout(() => popup.remove(), 500);
        }, 500);
    }

    // Screen shake effect
    screenShake(intensity, duration) {
        this.shakeIntensity = intensity;
        
        if (this.screenShakeTimeout) {
            clearTimeout(this.screenShakeTimeout);
        }
        
        this.screenShakeTimeout = setTimeout(() => {
            this.shakeIntensity = 0;
            document.body.style.transform = '';
        }, duration);
    }

    // Screen flash effect
    screenFlash(color, duration) {
        const flash = document.createElement('div');
        flash.style.position = 'fixed';
        flash.style.top = '0';
        flash.style.left = '0';
        flash.style.width = '100%';
        flash.style.height = '100%';
        flash.style.backgroundColor = color;
        flash.style.opacity = '0.3';
        flash.style.pointerEvents = 'none';
        flash.style.transition = `opacity ${duration}s ease-out`;
        
        document.body.appendChild(flash);
        
        // Trigger reflow
        void flash.offsetWidth;
        
        // Start fade out
        flash.style.opacity = '0';
        
        // Remove after animation
        setTimeout(() => {
            flash.remove();
        }, duration * 1000);
    }

    // Update function to be called in game loop
    update() {
        // Apply screen shake if active
        if (this.shakeIntensity > 0) {
            const x = (Math.random() - 0.5) * this.shakeIntensity * 2;
            const y = (Math.random() - 0.5) * this.shakeIntensity * 2;
            document.body.style.transform = `translate(${x}px, ${y}px)`;
        }
    }
}

// Initialize animation manager
const animationManager = new AnimationManager();

export default animationManager;
