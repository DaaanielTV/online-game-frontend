import { GameEngine, Entity, InputManager, AssetManager } from '../../shared/engine.js';

class Ninja extends Entity {
    constructor(x, y) {
        super(x, y, 40, 60);
        this.velocityY = 0;
        this.velocityX = 0;
        this.isJumping = false;
        this.wallSliding = false;
        this.facing = 1; // 1 for right, -1 for left
        this.throwCooldown = 0;
        this.score = 0;
    }

    update(deltaTime) {
        const input = this.game.input;
        const gravity = 0.5;
        const jumpForce = -12;
        const moveSpeed = 5;
        const maxFallSpeed = 10;

        // Horizontal movement
        if (input.isKeyPressed('ArrowLeft') || input.isKeyPressed('a')) {
            this.velocityX = -moveSpeed;
            this.facing = -1;
        } else if (input.isKeyPressed('ArrowRight') || input.isKeyPressed('d')) {
            this.velocityX = moveSpeed;
            this.facing = 1;
        } else {
            this.velocityX = 0;
        }

        // Wall sliding
        this.wallSliding = false;
        if (this.isCollidingWithWall() && this.velocityY > 0) {
            this.wallSliding = true;
            this.velocityY = Math.min(this.velocityY, 2); // Reduced falling speed
        }

        // Jumping
        if ((input.isKeyPressed('ArrowUp') || input.isKeyPressed('w') || input.isKeyPressed(' '))) {
            if (!this.isJumping && this.isOnGround()) {
                this.velocityY = jumpForce;
                this.isJumping = true;
            } else if (this.wallSliding) {
                this.velocityY = jumpForce * 0.8;
                this.velocityX = this.facing * -moveSpeed * 1.5; // Jump away from wall
                this.isJumping = true;
            }
        }

        // Apply gravity
        this.velocityY = Math.min(this.velocityY + gravity, maxFallSpeed);

        // Update position
        this.x += this.velocityX;
        this.y += this.velocityY;

        // Ground collision
        if (this.y > this.game.engine.canvas.height - this.height) {
            this.y = this.game.engine.canvas.height - this.height;
            this.velocityY = 0;
            this.isJumping = false;
        }

        // Wall boundaries
        if (this.x < 0) {
            this.x = 0;
        } else if (this.x + this.width > this.game.engine.canvas.width) {
            this.x = this.game.engine.canvas.width - this.width;
        }

        // Throwing stars
        if (input.isKeyPressed('f') && this.throwCooldown <= 0) {
            this.throwStar();
            this.throwCooldown = 20;
        }
        if (this.throwCooldown > 0) {
            this.throwCooldown--;
        }
    }

    render(ctx) {
        // Draw ninja
        ctx.fillStyle = '#4a4a4a';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw headband
        ctx.fillStyle = '#ff0000';
        const headbandHeight = 10;
        ctx.fillRect(this.x, this.y + headbandHeight, this.width, headbandHeight / 2);

        // Draw eyes
        ctx.fillStyle = '#ffffff';
        const eyeSize = 5;
        if (this.facing > 0) {
            ctx.fillRect(this.x + this.width - 15, this.y + 15, eyeSize, eyeSize);
        } else {
            ctx.fillRect(this.x + 10, this.y + 15, eyeSize, eyeSize);
        }
    }

    isOnGround() {
        return this.y >= this.game.engine.canvas.height - this.height;
    }

    isCollidingWithWall() {
        return this.x <= 0 || this.x + this.width >= this.game.engine.canvas.width;
    }

    throwStar() {
        const star = new ThrowingStar(
            this.x + this.width / 2,
            this.y + this.height / 3,
            this.facing
        );
        star.game = this.game;
        this.game.engine.addEntity(star);
    }
}

class ThrowingStar extends Entity {
    constructor(x, y, direction) {
        super(x, y, 10, 10);
        this.speed = 10;
        this.direction = direction;
        this.rotation = 0;
    }

    update() {
        this.x += this.speed * this.direction;
        this.rotation += 0.2;

        // Remove if off screen
        if (this.x < 0 || this.x > this.game.engine.canvas.width) {
            this.game.engine.removeEntity(this);
        }

        // Check enemy collisions
        for (const entity of this.game.engine.entities) {
            if (entity instanceof Enemy && this.collidesWith(entity)) {
                this.game.engine.removeEntity(entity);
                this.game.engine.removeEntity(this);
                this.game.player.score += 100;
                break;
            }
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        ctx.fillStyle = '#silver';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, 0);
        ctx.lineTo(0, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(0, this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
}

class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 30, 30);
        this.speed = 2;
        this.direction = Math.random() < 0.5 ? -1 : 1;
    }

    update() {
        this.x += this.speed * this.direction;

        // Reverse direction at walls
        if (this.x < 0 || this.x + this.width > this.game.engine.canvas.width) {
            this.direction *= -1;
        }

        // Check player collision
        if (this.collidesWith(this.game.player)) {
            this.game.gameOver();
        }
    }

    render(ctx) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Platform extends Entity {
    constructor(x, y, width) {
        super(x, y, width, 20);
    }

    render(ctx) {
        ctx.fillStyle = '#555555';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class NinjaRunnerGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.player = null;
        this.isGameOver = false;
        this.spawnTimer = 0;
        this.assets = new AssetManager();
        this.setup();
    }

    async setup() {
        // Load background
        try {
            await this.assets.loadImage('background', '../../enemy/mystic-forest-background.png');
        } catch (error) {
            console.warn('Failed to load background, using fallback');
        }

        // Create player
        this.player = new Ninja(100, 300);
        this.player.game = this;
        this.engine.addEntity(this.player);

        // Add background rendering
        this.engine.addEntity({
            render: (ctx) => {
                // Draw background first
                if (this.assets.getImage('background')) {
                    ctx.drawImage(this.assets.getImage('background'), 0, 0, this.engine.canvas.width, this.engine.canvas.height);
                }
            }
        });

        // Create initial platforms
        this.createPlatforms();

        // Add score display
        this.engine.addEntity({
            render: (ctx) => {
                if (this.isGameOver) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '48px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('GAME OVER', this.engine.canvas.width / 2, this.engine.canvas.height / 2);
                    ctx.font = '24px Arial';
                    ctx.fillText(`Score: ${this.player.score}`, this.engine.canvas.width / 2, this.engine.canvas.height / 2 + 40);
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '24px Arial';
                    ctx.fillText(`Score: ${this.player.score}`, 20, 40);
                }
            }
        });

        // Update loop with enemy spawning
        this.engine.update = (deltaTime) => {
            if (this.isGameOver) return;

            // Update all entities
            for (const entity of this.engine.entities) {
                if (entity.update) {
                    entity.update(deltaTime);
                }
            }

            // Spawn enemies
            this.spawnTimer++;
            if (this.spawnTimer >= 120) { // Spawn every 2 seconds (60 fps)
                this.spawnEnemy();
                this.spawnTimer = 0;
            }
        };
    }

    createPlatforms() {
        // Add some platforms
        const platforms = [
            new Platform(100, 400, 200),
            new Platform(400, 300, 200),
            new Platform(700, 350, 200)
        ];

        for (const platform of platforms) {
            platform.game = this;
            this.engine.addEntity(platform);
        }
    }

    spawnEnemy() {
        const x = Math.random() * (this.engine.canvas.width - 30);
        const enemy = new Enemy(x, 0);
        enemy.game = this;
        this.engine.addEntity(enemy);
    }

    gameOver() {
        this.isGameOver = true;
        // Remove all entities except player and UI
        this.engine.entities = this.engine.entities.filter(
            e => e === this.player || !e.update
        );
    }

    start() {
        this.engine.init();
    }
}

export default NinjaRunnerGame;