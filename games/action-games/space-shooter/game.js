import { GameEngine, Entity, InputManager, AssetManager } from '../../shared/engine.js';

class Spaceship extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.speed = 5;
        this.fireRate = 250; // ms between shots
        this.lastShot = 0;
        this.health = 100;
        this.score = 0;
    }

    update(deltaTime) {
        const input = this.game.input;
        
        // Movement
        if (input.isKeyPressed('ArrowLeft') || input.isKeyPressed('a')) {
            this.x = Math.max(0, this.x - this.speed);
        }
        if (input.isKeyPressed('ArrowRight') || input.isKeyPressed('d')) {
            this.x = Math.min(this.game.engine.canvas.width - this.width, this.x + this.speed);
        }
        if (input.isKeyPressed('ArrowUp') || input.isKeyPressed('w')) {
            this.y = Math.max(0, this.y - this.speed);
        }
        if (input.isKeyPressed('ArrowDown') || input.isKeyPressed('s')) {
            this.y = Math.min(this.game.engine.canvas.height - this.height, this.y + this.speed);
        }

        // Shooting
        if (input.isKeyPressed(' ') && Date.now() - this.lastShot > this.fireRate) {
            this.shoot();
            this.lastShot = Date.now();
        }
    }

    shoot() {
        const bullet = new Bullet(this.x + this.width / 2, this.y);
        bullet.game = this.game;
        this.game.engine.addEntity(bullet);
    }

    render(ctx) {
        if (this.game.assets.getImage('player')) {
            ctx.drawImage(this.game.assets.getImage('player'), this.x, this.y, this.width, this.height);
        } else {
            // Fallback rendering
            ctx.fillStyle = '#4CAF50';
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.closePath();
            ctx.fill();
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.game.gameOver();
        }
    }
}

class Bullet extends Entity {
    constructor(x, y) {
        super(x - 2, y, 4, 10);
        this.speed = 7;
    }

    update() {
        this.y -= this.speed;
        if (this.y + this.height < 0) {
            this.game.engine.removeEntity(this);
        }
    }

    render(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class Enemy extends Entity {
    constructor(x, y) {
        super(x, y, 30, 30);
        this.speed = 2;
        this.direction = 1;
        this.fireRate = 2000;
        this.lastShot = 0;
    }

    update(deltaTime) {
        this.x += this.speed * this.direction;

        // Change direction at screen edges
        if (this.x <= 0 || this.x + this.width >= this.game.engine.canvas.width) {
            this.direction *= -1;
            this.y += 30;
        }

        // Random shooting
        if (Date.now() - this.lastShot > this.fireRate) {
            if (Math.random() < 0.1) {
                this.shoot();
                this.lastShot = Date.now();
            }
        }
    }

    shoot() {
        const bullet = new EnemyBullet(this.x + this.width / 2, this.y + this.height);
        bullet.game = this.game;
        this.game.engine.addEntity(bullet);
    }

    render(ctx) {
        if (this.game.assets.getImage('enemy')) {
            ctx.drawImage(this.game.assets.getImage('enemy'), this.x, this.y, this.width, this.height);
        } else {
            // Fallback rendering
            ctx.fillStyle = '#FF5252';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class EnemyBullet extends Entity {
    constructor(x, y) {
        super(x - 2, y, 4, 10);
        this.speed = 5;
    }

    update() {
        this.y += this.speed;
        if (this.y > this.game.engine.canvas.height) {
            this.game.engine.removeEntity(this);
        }
    }

    render(ctx) {
        ctx.fillStyle = '#FF5252';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

class SpaceShooterGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.player = null;
        this.isGameOver = false;
    }

    async loadAssets() {
        try {
            await this.assets.loadImage('player', '../../enemy/player-avatar.png');
            await this.assets.loadImage('enemy', '../../enemy/tricaluctus(underwater-monster).png');
            await this.assets.loadImage('background', '../../enemy/space-background.png');
        } catch (error) {
            console.warn('Failed to load some assets, using fallback graphics');
        }
    }

    async setup() {
        // Load assets first
        await this.loadAssets();

        // Create player
        this.player = new Spaceship(
            this.engine.canvas.width / 2 - 20,
            this.engine.canvas.height - 60
        );
        this.player.game = this;
        this.engine.addEntity(this.player);

        // Spawn initial enemies
        this.spawnEnemyWave();

        // Add collision detection to game loop
        this.engine.update = (deltaTime) => {
            if (this.isGameOver) return;

            // Update all entities
            for (const entity of this.engine.entities) {
                if (entity.update) {
                    entity.update(deltaTime);
                }
            }

            // Check collisions
            this.checkCollisions();

            // Spawn new enemies if needed
            if (this.countEnemies() === 0) {
                this.spawnEnemyWave();
            }
        };

        // Add score display
        this.engine.addEntity({
            render: (ctx) => {
                // Draw background first
                if (this.assets.getImage('background')) {
                    ctx.drawImage(this.assets.getImage('background'), 0, 0, this.engine.canvas.width, this.engine.canvas.height);
                }

                if (this.isGameOver) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '48px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('GAME OVER', this.engine.canvas.width / 2, this.engine.canvas.height / 2);
                    ctx.font = '24px Arial';
                    ctx.fillText(`Final Score: ${this.player.score}`, this.engine.canvas.width / 2, this.engine.canvas.height / 2 + 40);
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '20px Arial';
                    ctx.fillText(`Score: ${this.player.score}`, 20, 30);
                    ctx.fillText(`Health: ${this.player.health}`, 20, 60);
                }
            }
        });
    }

    spawnEnemyWave() {
        const rows = 3;
        const cols = 8;
        const spacing = 60;
        const startX = (this.engine.canvas.width - (cols * spacing)) / 2;
        const startY = 50;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const enemy = new Enemy(
                    startX + col * spacing,
                    startY + row * spacing
                );
                enemy.game = this;
                this.engine.addEntity(enemy);
            }
        }
    }

    checkCollisions() {
        const bullets = this.engine.entities.filter(e => e instanceof Bullet);
        const enemyBullets = this.engine.entities.filter(e => e instanceof EnemyBullet);
        const enemies = this.engine.entities.filter(e => e instanceof Enemy);

        // Check player bullets hitting enemies
        for (const bullet of bullets) {
            for (const enemy of enemies) {
                if (bullet.collidesWith(enemy)) {
                    this.engine.removeEntity(enemy);
                    this.engine.removeEntity(bullet);
                    this.player.score += 10;
                    break;
                }
            }
        }

        // Check enemy bullets hitting player
        for (const bullet of enemyBullets) {
            if (bullet.collidesWith(this.player)) {
                this.engine.removeEntity(bullet);
                this.player.takeDamage(10);
                break;
            }
        }

        // Check enemies colliding with player
        for (const enemy of enemies) {
            if (enemy.collidesWith(this.player)) {
                this.gameOver();
                break;
            }
        }
    }

    countEnemies() {
        return this.engine.entities.filter(e => e instanceof Enemy).length;
    }

    gameOver() {
        this.isGameOver = true;
        // Remove all entities except player and UI
        this.engine.entities = this.engine.entities.filter(
            e => e === this.player || !e.update
        );
    }

    async start() {
        await this.setup();
        this.engine.init();
    }
}

export default SpaceShooterGame;