import { GameEngine, Entity, InputManager, AssetManager } from '../../shared/engine.js';

class RobotPart extends Entity {
    constructor(x, y, width, height, type) {
        super(x, y, width, height);
        this.type = type;
        this.health = 100;
        this.maxHealth = 100;
        this.power = 0;
        this.weight = 1;
        this.isSelected = false;

        switch (type) {
            case 'chassis':
                this.power = 0;
                this.weight = 3;
                this.health = 200;
                this.maxHealth = 200;
                break;
            case 'weapon':
                this.power = 25;
                this.weight = 2;
                break;
            case 'armor':
                this.power = 0;
                this.weight = 2;
                this.health = 150;
                this.maxHealth = 150;
                break;
            case 'wheels':
                this.power = 0;
                this.weight = 1;
                break;
        }
    }

    render(ctx) {
        // Draw part base
        ctx.fillStyle = this.isSelected ? '#666666' : '#444444';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw part type indicator
        ctx.fillStyle = this.getTypeColor();
        ctx.fillRect(this.x + 5, this.y + 5, this.width - 10, this.height - 10);

        // Draw health bar
        if (this.health < this.maxHealth) {
            const healthBarWidth = this.width - 10;
            const healthBarHeight = 5;
            const healthPercent = this.health / this.maxHealth;
            
            ctx.fillStyle = '#ff0000';
            ctx.fillRect(this.x + 5, this.y - 8, healthBarWidth, healthBarHeight);
            ctx.fillStyle = '#00ff00';
            ctx.fillRect(this.x + 5, this.y - 8, healthBarWidth * healthPercent, healthBarHeight);
        }
    }

    getTypeColor() {
        switch (this.type) {
            case 'chassis': return '#8B4513';
            case 'weapon': return '#FF4444';
            case 'armor': return '#4444FF';
            case 'wheels': return '#44FF44';
            default: return '#FFFFFF';
        }
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            return true; // Part destroyed
        }
        return false;
    }
}

class Robot extends Entity {
    constructor(x, y, isPlayer) {
        super(x, y, 100, 100);
        this.parts = [];
        this.isPlayer = isPlayer;
        this.speed = 0;
        this.direction = isPlayer ? 0 : Math.PI;
        this.score = 0;
    }

    addPart(part) {
        this.parts.push(part);
        this.recalculateStats();
    }

    recalculateStats() {
        let totalWeight = 0;
        let totalPower = 0;
        
        for (const part of this.parts) {
            totalWeight += part.weight;
            totalPower += part.power;
        }

        this.speed = Math.max(2, 8 - totalWeight);
        return { totalWeight, totalPower };
    }

    update(deltaTime) {
        if (this.isPlayer) {
            const input = this.game.input;
            
            // Rotation
            if (input.isKeyPressed('ArrowLeft') || input.isKeyPressed('a')) {
                this.direction -= 0.05;
            }
            if (input.isKeyPressed('ArrowRight') || input.isKeyPressed('d')) {
                this.direction += 0.05;
            }

            // Movement
            if (input.isKeyPressed('ArrowUp') || input.isKeyPressed('w')) {
                this.x += Math.cos(this.direction) * this.speed;
                this.y += Math.sin(this.direction) * this.speed;
            }
            if (input.isKeyPressed('ArrowDown') || input.isKeyPressed('s')) {
                this.x -= Math.cos(this.direction) * this.speed * 0.5;
                this.y -= Math.sin(this.direction) * this.speed * 0.5;
            }

            // Attack
            if (input.isKeyPressed(' ')) {
                this.attack();
            }
        } else {
            // AI behavior
            const player = this.game.player;
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const angle = Math.atan2(dy, dx);
            
            // Rotate towards player
            const angleDiff = (angle - this.direction + Math.PI * 3) % (Math.PI * 2) - Math.PI;
            if (Math.abs(angleDiff) > 0.1) {
                this.direction += Math.sign(angleDiff) * 0.03;
            }

            // Move towards player if too far, away if too close
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance > 200) {
                this.x += Math.cos(this.direction) * this.speed * 0.5;
                this.y += Math.sin(this.direction) * this.speed * 0.5;
            } else if (distance < 100) {
                this.x -= Math.cos(this.direction) * this.speed * 0.3;
                this.y -= Math.sin(this.direction) * this.speed * 0.3;
            }

            // Attack if facing player and in range
            if (Math.abs(angleDiff) < 0.3 && distance < 150) {
                this.attack();
            }
        }

        // Keep robot in bounds
        this.x = Math.max(0, Math.min(this.game.engine.canvas.width - this.width, this.x));
        this.y = Math.max(0, Math.min(this.game.engine.canvas.height - this.height, this.y));

        // Update part positions
        this.updatePartPositions();
    }

    updatePartPositions() {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        for (let i = 0; i < this.parts.length; i++) {
            const part = this.parts[i];
            const angle = this.direction + (i * Math.PI * 2 / this.parts.length);
            const radius = 30;
            
            part.x = centerX + Math.cos(angle) * radius - part.width / 2;
            part.y = centerY + Math.sin(angle) * radius - part.height / 2;
        }
    }

    attack() {
        const totalPower = this.parts.reduce((sum, part) => sum + part.power, 0);
        if (totalPower <= 0) return;

        const projectile = new Projectile(
            this.x + this.width / 2,
            this.y + this.height / 2,
            this.direction,
            totalPower,
            this.isPlayer
        );
        projectile.game = this.game;
        this.game.engine.addEntity(projectile);
    }

    render(ctx) {
        // Draw robot body
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.direction);
        
        ctx.fillStyle = this.isPlayer ? '#4CAF50' : '#F44336';
        ctx.beginPath();
        ctx.moveTo(-this.width / 2, -this.height / 2);
        ctx.lineTo(this.width / 2, 0);
        ctx.lineTo(-this.width / 2, this.height / 2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();

        // Draw parts
        for (const part of this.parts) {
            part.render(ctx);
        }
    }

    takeDamage(amount) {
        // Distribute damage among parts
        const damagePerPart = amount / this.parts.length;
        const destroyedParts = [];

        for (const part of this.parts) {
            if (part.takeDamage(damagePerPart)) {
                destroyedParts.push(part);
            }
        }

        // Remove destroyed parts
        this.parts = this.parts.filter(part => !destroyedParts.includes(part));
        this.recalculateStats();

        // Check if robot is destroyed (no parts left)
        if (this.parts.length === 0) {
            return true;
        }
        return false;
    }
}

class Projectile extends Entity {
    constructor(x, y, direction, power, isPlayerProjectile) {
        super(x, y, 6, 6);
        this.direction = direction;
        this.speed = 10;
        this.power = power;
        this.isPlayerProjectile = isPlayerProjectile;
        this.lifetime = 60;
    }

    update() {
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;
        this.lifetime--;

        if (this.lifetime <= 0) {
            this.game.engine.removeEntity(this);
            return;
        }

        // Check for collisions
        for (const entity of this.game.engine.entities) {
            if (entity instanceof Robot && entity.isPlayer !== this.isPlayerProjectile) {
                if (this.collidesWith(entity)) {
                    if (entity.takeDamage(this.power)) {
                        if (this.isPlayerProjectile) {
                            this.game.player.score += 1000;
                            this.game.spawnEnemy(); // Spawn new enemy when one is destroyed
                        } else {
                            this.game.gameOver();
                        }
                    }
                    this.game.engine.removeEntity(this);
                    break;
                }
            }
        }
    }

    render(ctx) {
        ctx.fillStyle = this.isPlayerProjectile ? '#4CAF50' : '#F44336';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

class RobotWarsGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.player = null;
        this.isGameOver = false;
        this.partTypes = ['chassis', 'weapon', 'armor', 'wheels'];
        this.setup();
    }

    setup() {
        // Create player robot
        this.player = new Robot(100, 300, true);
        this.player.game = this;

        // Add initial parts
        this.player.addPart(new RobotPart(0, 0, 30, 30, 'chassis'));
        this.player.addPart(new RobotPart(0, 0, 30, 30, 'weapon'));
        this.player.addPart(new RobotPart(0, 0, 30, 30, 'armor'));
        this.player.addPart(new RobotPart(0, 0, 30, 30, 'wheels'));

        this.engine.addEntity(this.player);

        // Spawn initial enemy
        this.spawnEnemy();

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
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '24px Arial';
                    ctx.fillText(`Score: ${this.player.score}`, 20, 30);
                    const stats = this.player.recalculateStats();
                    ctx.fillText(`Power: ${stats.totalPower}`, 20, 60);
                    ctx.fillText(`Weight: ${stats.totalWeight}`, 20, 90);
                    ctx.fillText(`Speed: ${this.player.speed.toFixed(1)}`, 20, 120);
                }
            }
        });
    }

    spawnEnemy() {
        const enemy = new Robot(
            this.engine.canvas.width - 200,
            Math.random() * (this.engine.canvas.height - 100) + 50,
            false
        );
        enemy.game = this;

        // Add random parts
        for (let i = 0; i < 4; i++) {
            const type = this.partTypes[Math.floor(Math.random() * this.partTypes.length)];
            enemy.addPart(new RobotPart(0, 0, 30, 30, type));
        }

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

export default RobotWarsGame;