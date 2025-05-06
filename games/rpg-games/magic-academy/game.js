import { GameEngine, Entity, InputManager, AssetManager } from '../../shared/engine.js';

class Spell {
    constructor(name, type, power, manaCost) {
        this.name = name;
        this.type = type;
        this.power = power;
        this.manaCost = manaCost;
        this.combinedWith = null;
    }

    combine(otherSpell) {
        if (!otherSpell) return null;
        
        const combinations = {
            'fire+water': 'steam',
            'fire+air': 'lightning',
            'water+earth': 'nature',
            'air+earth': 'dust',
            'light+dark': 'twilight',
            'fire+earth': 'lava',
            'water+air': 'ice'
        };

        const key = `${this.type}+${otherSpell.type}`;
        const reverseKey = `${otherSpell.type}+${this.type}`;
        const newType = combinations[key] || combinations[reverseKey];

        if (newType) {
            return new Spell(
                `${newType} blast`,
                newType,
                this.power + otherSpell.power,
                this.manaCost + otherSpell.manaCost
            );
        }
        return null;
    }
}

class Wizard extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 100;
        this.maxMana = 100;
        this.level = 1;
        this.experience = 0;
        this.knownSpells = [
            new Spell('Fireball', 'fire', 20, 15),
            new Spell('Water Jet', 'water', 15, 10)
        ];
        this.activeSpell = null;
        this.speed = 3;
    }

    update(deltaTime) {
        // Wizard update logic
        this.mana = Math.min(this.maxMana, this.mana + 0.1); // Mana regeneration
    }

    render(ctx) {
        // Wizard rendering
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Health bar
        const healthWidth = (this.width - 10) * (this.health / this.maxHealth);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x + 5, this.y - 15, this.width - 10, 5);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x + 5, this.y - 15, healthWidth, 5);

        // Mana bar
        const manaWidth = (this.width - 10) * (this.mana / this.maxMana);
        ctx.fillStyle = '#1E90FF';
        ctx.fillRect(this.x + 5, this.y - 8, manaWidth, 5);
    }

    castSpell(spell) {
        if (this.mana >= spell.manaCost) {
            this.mana -= spell.manaCost;
            return true;
        }
        return false;
    }

    learnSpell(spell) {
        if (!this.knownSpells.find(s => s.name === spell.name)) {
            this.knownSpells.push(spell);
        }
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
        this.maxMana += 15;
        this.health = this.maxHealth;
        this.mana = this.maxMana;
        this.experience = 0;

        // Learn new spell on level up
        const newSpells = {
            2: new Spell('Air Gust', 'air', 15, 12),
            3: new Spell('Earth Shield', 'earth', 10, 20),
            4: new Spell('Light Beam', 'light', 25, 18),
            5: new Spell('Dark Void', 'dark', 30, 25)
        };

        if (newSpells[this.level]) {
            this.learnSpell(newSpells[this.level]);
        }
    }
}

class MagicAcademyGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.wizard = null;
        this.selectedSpell = null;
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

        // Create wizard
        this.wizard = new Wizard(
            this.engine.canvas.width / 2 - 20,
            this.engine.canvas.height / 2 - 20
        );
        this.wizard.game = this;
        this.engine.addEntity(this.wizard);

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
                    ctx.fillText(`Level: ${this.wizard.level}`, 20, 30);
                    ctx.fillText(`Health: ${this.wizard.health}/${this.wizard.maxHealth}`, 20, 60);
                    ctx.fillText(`Mana: ${Math.floor(this.wizard.mana)}/${this.wizard.maxMana}`, 20, 90);
                    ctx.fillText(`XP: ${this.wizard.experience}/${this.wizard.level * 100}`, 20, 120);

                    // Display known spells
                    ctx.fillText('Spells:', 20, 160);
                    this.wizard.knownSpells.forEach((spell, index) => {
                        const isSelected = spell === this.selectedSpell;
                        ctx.fillStyle = isSelected ? '#ffff00' : '#ffffff';
                        ctx.fillText(
                            `${index + 1}: ${spell.name} (${spell.type}, Power: ${spell.power}, Mana: ${spell.manaCost})`,
                            20,
                            190 + index * 30
                        );
                    });
                }
            }
        });

        // Add keyboard handlers for spell selection
        window.addEventListener('keydown', (e) => {
            const number = parseInt(e.key);
            if (number && number <= this.wizard.knownSpells.length) {
                const spell = this.wizard.knownSpells[number - 1];
                if (this.selectedSpell && this.selectedSpell !== spell) {
                    const combinedSpell = this.selectedSpell.combine(spell);
                    if (combinedSpell) {
                        this.wizard.learnSpell(combinedSpell);
                        this.selectedSpell = null;
                    } else {
                        this.selectedSpell = spell;
                    }
                } else {
                    this.selectedSpell = spell;
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

export default MagicAcademyGame;