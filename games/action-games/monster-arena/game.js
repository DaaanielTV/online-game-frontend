import { GameEngine, Entity, InputManager, AssetManager } from '../../shared/engine.js';

class Gladiator extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.speed = 5;
        this.attackRange = 60;
        this.health = 100;
        this.maxHealth = 100;
        this.attackCooldown = 0;
        this.attackDuration = 0;
        this.isAttacking = false;
        this.direction = { x: 1, y: 0 };
        this.score = 0;
    }

    update(deltaTime) {
        const input = this.game.input;
        
        // Movement
        let dx = 0;
        let dy = 0;
        
        if (input.isKeyPressed('ArrowLeft') || input.isKeyPressed('a')) dx -= 1;
        if (input.isKeyPressed('ArrowRight') || input.isKeyPressed('d')) dx += 1;
        if (input.isKeyPressed('ArrowUp') || input.isKeyPressed('w')) dy -= 1;
        if (input.isKeyPressed('ArrowDown') || input.isKeyPressed('s')) dy += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Update position
        this.x = Math.max(0, Math.min(this.game.engine.canvas.width - this.width, this.x + dx * this.speed));
        this.y = Math.max(0, Math.min(this.game.engine.canvas.height - this.height, this.y + dy * this.speed));

        // Update direction for attack
        if (dx !== 0 || dy !== 0) {
            this.direction = { x: dx, y: dy };
        }

        // Handle attack
        if (input.isKeyPressed(' ')) {
            this.startAttack();
        }

        // Update attack states
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }

        if (this.isAttacking) {
            this.attackDuration--;
            if (this.attackDuration <= 0) {
                this.isAttacking = false;
            }
        }
    }

    startAttack() {
        if (this.attackCooldown <= 0 && !this.isAttacking) {
            this.isAttacking = true;
            this.attackDuration = 10;
            this.attackCooldown = 30;
            
            // Check for hits
            const hitbox = this.getAttackHitbox();
            for (const entity of this.game.engine.entities) {
                if (entity instanceof Monster && this.checkAttackCollision(hitbox, entity)) {
                    entity.takeDamage(25);
                }
            }
        }
    }

    getAttackHitbox() {
        const hitboxWidth = this.attackRange;
        const hitboxHeight = this.attackRange / 2;
        
        return {
            x: this.direction.x > 0 ? this.x + this.width : this.x - hitboxWidth + this.width,
            y: this.y + this.height / 2 - hitboxHeight / 2,
            width: hitboxWidth,
            height: hitboxHeight
        };
    }

    checkAttackCollision(hitbox, entity) {
        return hitbox.x < entity.x + entity.width &&
               hitbox.x + hitbox.width > entity.x &&
               hitbox.y < entity.y + entity.height &&
               hitbox.y + hitbox.height > entity.y;
    }

    render(ctx) {
        // Draw player
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw attack animation if attacking
        if (this.isAttacking) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            const hitbox = this.getAttackHitbox();
            ctx.fillRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        }

        // Draw health bar
        const healthBarWidth = 50;
        const healthBarHeight = 5;
        const healthPercent = this.health / this.maxHealth;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - 5, this.y - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - 5, this.y - 10, healthBarWidth * healthPercent, healthBarHeight);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.game.gameOver();
        }
    }
}

class Monster extends Entity {
    constructor(x, y, type) {
        super(x, y, 30, 30);
        this.type = type;
        this.health = 50;
        this.maxHealth = 50;
        this.speed = 2;
        this.attackRange = 40;
        this.attackCooldown = 0;
        this.scoreValue = 100;
        
        // Customize based on type
        switch (type) {
            case 'fast':
                this.speed = 3;
                this.health = 30;
                this.maxHealth = 30;
                this.scoreValue = 150;
                break;
            case 'tank':
                this.speed = 1;
                this.health = 100;
                this.maxHealth = 100;
                this.scoreValue = 200;
                break;
        }
    }

    update() {
        // Move towards player
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > this.attackRange) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        } else if (this.attackCooldown <= 0) {
            this.attack();
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
    }

    render(ctx) {
        // Draw monster body
        switch (this.type) {
            case 'normal':
                ctx.fillStyle = '#ff4444';
                break;
            case 'fast':
                ctx.fillStyle = '#44ff44';
                break;
            case 'tank':
                ctx.fillStyle = '#4444ff';
                break;
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw health bar
        const healthBarWidth = 30;
        const healthBarHeight = 4;
        const healthPercent = this.health / this.maxHealth;
        
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y - 8, healthBarWidth, healthBarHeight);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y - 8, healthBarWidth * healthPercent, healthBarHeight);
    }

    attack() {
        const damage = this.type === 'tank' ? 20 : 10;
        this.game.player.takeDamage(damage);
        this.attackCooldown = 60;
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.game.engine.removeEntity(this);
            this.game.player.score += this.scoreValue;
        }
    }
}

class MonsterArenaGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.player = null;
        this.wave = 1;
        this.monstersRemaining = 0;
        this.spawnTimer = 0;
        this.isGameOver = false;

        // Add window resize handler
        window.addEventListener('resize', () => this.handleResize());
        this.setup();
    }

    handleResize() {
        this.engine.canvas.width = window.innerWidth;
        this.engine.canvas.height = window.innerHeight;
    }

    async setup() {
        // Set initial canvas size
        this.handleResize();

        // Load background
        try {
            await this.assets.loadImage('background', '../../enemy/game-background.png');
        } catch (error) {
            console.warn('Failed to load background, using fallback');
        }

        // Add background rendering first
        this.engine.addEntity({
            render: (ctx) => {
                if (this.assets.getImage('background')) {
                    ctx.drawImage(this.assets.getImage('background'), 0, 0, this.engine.canvas.width, this.engine.canvas.height);
                }
            }
        });

        // Create player
        this.player = new Gladiator(
            this.engine.canvas.width / 2 - 20,
            this.engine.canvas.height / 2 - 20
        );
        this.player.game = this;
        this.engine.addEntity(this.player);

        // Start first wave
        this.startWave();

        // Add UI
        this.engine.addEntity({
            render: (ctx) => {
                if (this.isGameOver) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '48px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('GAME OVER', this.engine.canvas.width / 2, this.engine.canvas.height / 2);
                    ctx.font = '24px Arial';
                    ctx.fillText(`Final Score: ${this.player.score}`, this.engine.canvas.width / 2, this.engine.canvas.height / 2 + 40);
                    ctx.fillText(`Waves Survived: ${this.wave - 1}`, this.engine.canvas.width / 2, this.engine.canvas.height / 2 + 70);
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '24px Arial';
                    ctx.fillText(`Score: ${this.player.score}`, 20, 30);
                    ctx.fillText(`Wave: ${this.wave}`, 20, 60);
                    ctx.fillText(`Monsters: ${this.monstersRemaining}`, 20, 90);
                }
            }
        });
    }

    startWave() {
        this.monstersRemaining = this.wave * 3;
        this.spawnTimer = 0;
    }

    spawnMonster() {
        if (this.monstersRemaining <= 0) return;

        // Determine spawn position (outside screen)
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -30 : this.engine.canvas.width + 30;
            y = Math.random() * this.engine.canvas.height;
        } else {
            x = Math.random() * this.engine.canvas.width;
            y = Math.random() < 0.5 ? -30 : this.engine.canvas.height + 30;
        }

        // Determine monster type
        let type = 'normal';
        const roll = Math.random();
        if (roll < 0.2) type = 'fast';
        else if (roll < 0.3) type = 'tank';

        const monster = new Monster(x, y, type);
        monster.game = this;
        this.engine.addEntity(monster);
        this.monstersRemaining--;
    }

    update(deltaTime) {
        if (this.isGameOver) return;

        // Spawn monsters
        this.spawnTimer++;
        if (this.spawnTimer >= 60 && this.monstersRemaining > 0) {
            this.spawnMonster();
            this.spawnTimer = 0;
        }

        // Check for wave completion
        const monsterCount = this.engine.entities.filter(e => e instanceof Monster).length;
        if (monsterCount === 0 && this.monstersRemaining === 0) {
            this.wave++;
            this.startWave();
        }
    }

    gameOver() {
        this.isGameOver = true;
        // Remove all monsters
        this.engine.entities = this.engine.entities.filter(
            e => !(e instanceof Monster)
        );
    }

    start() {
        this.engine.init();
    }
}

export default MonsterArenaGame;