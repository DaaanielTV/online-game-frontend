import { GameEngine, Entity, InputManager, AssetManager } from '../../shared/engine.js';

class Character extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.health = 100;
        this.maxHealth = 100;
        this.level = 1;
        this.experience = 0;
        this.speed = 3;
        this.inventory = [];
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
    }

    update(deltaTime) {
        // Character update logic
    }

    render(ctx) {
        // Character rendering
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Health bar
        const healthWidth = (this.width - 10) * (this.health / this.maxHealth);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x + 5, this.y - 10, this.width - 10, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x + 5, this.y - 10, healthWidth, 5);
    }

    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        return this.health <= 0;
    }

    gainExperience(amount) {
        this.experience += amount;
        if (this.experience >= this.level * 100) {
            this.levelUp();
        }
    }

    levelUp() {
        this.level++;
        this.maxHealth += 20;
        this.health = this.maxHealth;
        this.experience = 0;
    }
}

class PixelHeroesGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.player = null;
        this.isGameOver = false;
        this.setup();
    }

    async setup() {
        // Load background
        try {
            await this.assets.loadImage('background', '../../enemy/mystic-forest-background.png');
        } catch (error) {
            console.warn('Failed to load background, using fallback');
        }

        // Add background rendering
        this.engine.addEntity({
            render: (ctx) => {
                if (this.assets.getImage('background')) {
                    ctx.drawImage(this.assets.getImage('background'), 0, 0, this.engine.canvas.width, this.engine.canvas.height);
                }
            }
        });

        // Create player
        this.player = new Character(
            this.engine.canvas.width / 2 - 20,
            this.engine.canvas.height / 2 - 20
        );
        this.player.game = this;
        this.engine.addEntity(this.player);

        // Add UI
        this.engine.addEntity({
            render: (ctx) => {
                if (this.isGameOver) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '48px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('GAME OVER', this.engine.canvas.width / 2, this.engine.canvas.height / 2);
                } else {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText(`Level: ${this.player.level}`, 20, 30);
                    ctx.fillText(`Health: ${this.player.health}/${this.player.maxHealth}`, 20, 60);
                    ctx.fillText(`XP: ${this.player.experience}/${this.player.level * 100}`, 20, 90);
                }
            }
        });
    }

    gameOver() {
        this.isGameOver = true;
    }

    start() {
        this.engine.init();
    }
}

export default PixelHeroesGame;