import { GameEngine, Entity, InputManager, AssetManager } from '../../shared/engine.js';

class Monster extends Entity {
    constructor(x, y, type) {
        super(x, y, 50, 50);
        this.type = type;
        this.level = 1;
        this.experience = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.attack = 10;
        this.defense = 5;
        this.moves = this.getBaseMoves();
        this.isCaptured = false;
    }

    getBaseMoves() {
        return {
            tackle: { power: 40, accuracy: 100 },
            growl: { power: 0, effect: 'lower-attack' },
            protect: { power: 0, effect: 'raise-defense' }
        };
    }

    update(deltaTime) {
        // Monster update logic
    }

    render(ctx) {
        // Monster rendering
        ctx.fillStyle = this.getTypeColor();
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Health bar
        const healthWidth = (this.width - 10) * (this.health / this.maxHealth);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x + 5, this.y - 10, this.width - 10, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x + 5, this.y - 10, healthWidth, 5);

        // Level indicator
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`Lv.${this.level}`, this.x + 5, this.y - 15);
    }

    getTypeColor() {
        const colors = {
            fire: '#FF4444',
            water: '#4444FF',
            earth: '#88CC88',
            air: '#CCCCCC',
            light: '#FFFF88',
            dark: '#666666'
        };
        return colors[this.type] || '#FFFFFF';
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
        this.attack += 5;
        this.defense += 3;
        this.experience = 0;
    }
}

class MonsterTamerGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.player = null;
        this.capturedMonsters = [];
        this.activeMonster = null;
        this.isGameOver = false;
        this.setup();
    }

    async setup() {
        // Load background
        try {
            await this.assets.loadImage('background', '../../enemy/nature-background.png');
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

        // Create starter monster
        this.activeMonster = new Monster(
            this.engine.canvas.width / 2 - 25,
            this.engine.canvas.height / 2 - 25,
            'fire'
        );
        this.activeMonster.game = this;
        this.engine.addEntity(this.activeMonster);
        this.capturedMonsters.push(this.activeMonster);

        // Add UI
        this.engine.addEntity({
            render: (ctx) => {
                ctx.fillStyle = '#ffffff';
                ctx.font = '20px Arial';
                ctx.textAlign = 'left';
                
                // Active monster stats
                ctx.fillText(`Active Monster: Lv.${this.activeMonster.level}`, 20, 30);
                ctx.fillText(`Health: ${this.activeMonster.health}/${this.activeMonster.maxHealth}`, 20, 60);
                ctx.fillText(`XP: ${this.activeMonster.experience}/${this.activeMonster.level * 100}`, 20, 90);
                
                // Captured monsters count
                ctx.fillText(`Monsters: ${this.capturedMonsters.length}`, 20, 120);
            }
        });

        // Add keyboard handlers
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'Space':
                    this.spawnWildMonster();
                    break;
                case 'KeyC':
                    // Find nearest monster and attempt capture
                    const nearestMonster = this.engine.entities.find(
                        entity => entity instanceof Monster && !entity.isCaptured
                    );
                    if (nearestMonster) {
                        this.attemptCapture(nearestMonster);
                    }
                    break;
            }
        });
    }

    spawnWildMonster() {
        const types = ['fire', 'water', 'earth', 'air', 'light', 'dark'];
        const type = types[Math.floor(Math.random() * types.length)];
        const monster = new Monster(
            Math.random() * (this.engine.canvas.width - 100) + 50,
            Math.random() * (this.engine.canvas.height - 100) + 50,
            type
        );
        monster.game = this;
        this.engine.addEntity(monster);
    }

    attemptCapture(monster) {
        if (!monster.isCaptured && monster.health < monster.maxHealth * 0.3) {
            monster.isCaptured = true;
            this.capturedMonsters.push(monster);
        }
    }

    start() {
        this.engine.init();
    }
}

export default MonsterTamerGame;