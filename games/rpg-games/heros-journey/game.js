import { GameEngine, Entity, InputManager, AssetManager } from '../../shared/engine.js';

class Hero extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.health = 100;
        this.maxHealth = 100;
        this.level = 1;
        this.experience = 0;
        this.inventory = [];
        this.questLog = [];
        this.speed = 3;
        this.stats = {
            strength: 10,
            agility: 10,
            wisdom: 10,
            charisma: 10
        };
    }

    update(deltaTime) {
        // Hero update logic
    }

    render(ctx) {
        // Hero rendering
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
        
        // Increase random stats
        const stats = Object.keys(this.stats);
        for (let i = 0; i < 2; i++) {
            const stat = stats[Math.floor(Math.random() * stats.length)];
            this.stats[stat] += 2;
        }
    }

    addQuest(quest) {
        this.questLog.push({
            ...quest,
            status: 'active'
        });
    }

    completeQuest(questId) {
        const quest = this.questLog.find(q => q.id === questId && q.status === 'active');
        if (quest) {
            quest.status = 'completed';
            this.gainExperience(quest.experienceReward);
            return true;
        }
        return false;
    }
}

class NPC extends Entity {
    constructor(x, y, name, role) {
        super(x, y, 40, 40);
        this.name = name;
        this.role = role;
        this.dialogues = [];
        this.quests = [];
    }

    render(ctx) {
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // NPC name
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + this.width / 2, this.y - 5);
    }

    addDialogue(dialogue) {
        this.dialogues.push(dialogue);
    }

    addQuest(quest) {
        this.quests.push(quest);
    }

    interact(hero) {
        // Return available dialogue or quest
        const availableQuests = this.quests.filter(quest => 
            !hero.questLog.some(q => q.id === quest.id)
        );
        
        if (availableQuests.length > 0) {
            return {
                type: 'quest',
                content: availableQuests[0]
            };
        }

        return {
            type: 'dialogue',
            content: this.dialogues[Math.floor(Math.random() * this.dialogues.length)]
        };
    }
}

class HerosJourneyGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.hero = null;
        this.npcs = [];
        this.currentDialogue = null;
        this.isGameOver = false;
        this.storyProgress = 0;
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

        // Create hero
        this.hero = new Hero(
            this.engine.canvas.width / 2 - 20,
            this.engine.canvas.height / 2 - 20
        );
        this.hero.game = this;
        this.engine.addEntity(this.hero);

        // Create NPCs with stories and quests
        this.createNPCs();

        // Add UI
        this.engine.addEntity({
            render: (ctx) => {
                if (this.isGameOver) {
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '48px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('GAME OVER', this.engine.canvas.width / 2, this.engine.canvas.height / 2);
                } else {
                    // Stats UI
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '20px Arial';
                    ctx.textAlign = 'left';
                    ctx.fillText(`Level: ${this.hero.level}`, 20, 30);
                    ctx.fillText(`Health: ${this.hero.health}/${this.hero.maxHealth}`, 20, 60);
                    ctx.fillText(`XP: ${this.hero.experience}/${this.hero.level * 100}`, 20, 90);

                    // Stats
                    ctx.fillText('Stats:', 20, 130);
                    Object.entries(this.hero.stats).forEach(([stat, value], index) => {
                        ctx.fillText(`${stat}: ${value}`, 20, 160 + index * 30);
                    });

                    // Active quests
                    ctx.fillText('Quests:', 200, 30);
                    this.hero.questLog
                        .filter(quest => quest.status === 'active')
                        .forEach((quest, index) => {
                            ctx.fillText(`- ${quest.title}`, 200, 60 + index * 30);
                        });

                    // Current dialogue
                    if (this.currentDialogue) {
                        const dialogueBox = {
                            x: 50,
                            y: this.engine.canvas.height - 150,
                            width: this.engine.canvas.width - 100,
                            height: 100
                        };

                        // Dialogue background
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                        ctx.fillRect(
                            dialogueBox.x,
                            dialogueBox.y,
                            dialogueBox.width,
                            dialogueBox.height
                        );

                        // Dialogue text
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '16px Arial';
                        ctx.fillText(
                            this.currentDialogue.content,
                            dialogueBox.x + 20,
                            dialogueBox.y + 30
                        );

                        // Press space to continue
                        ctx.font = '14px Arial';
                        ctx.fillText(
                            'Press SPACE to continue...',
                            dialogueBox.x + 20,
                            dialogueBox.y + dialogueBox.height - 20
                        );
                    }
                }
            }
        });

        // Add keyboard handler for dialogue
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.currentDialogue) {
                if (this.currentDialogue.type === 'quest') {
                    this.hero.addQuest(this.currentDialogue.content);
                }
                this.currentDialogue = null;
            }
        });
    }

    createNPCs() {
        // Create village elder
        const elder = new NPC(100, 100, 'Elder Sage', 'mentor');
        elder.addDialogue('Welcome young hero. Our village needs your help.');
        elder.addQuest({
            id: 'quest1',
            title: 'The Beginning',
            description: 'Prove your worth by defeating 3 monsters.',
            experienceReward: 100
        });
        this.npcs.push(elder);
        this.engine.addEntity(elder);

        // Create mysterious traveler
        const traveler = new NPC(300, 150, 'Mysterious Traveler', 'quest_giver');
        traveler.addDialogue('I\'ve seen things you wouldn\'t believe...');
        traveler.addQuest({
            id: 'quest2',
            title: 'Ancient Secrets',
            description: 'Find the lost artifact in the cave.',
            experienceReward: 150
        });
        this.npcs.push(traveler);
        this.engine.addEntity(traveler);
    }

    checkNPCInteraction() {
        for (const npc of this.npcs) {
            if (this.hero.collidesWith(npc) && !this.currentDialogue) {
                this.currentDialogue = npc.interact(this.hero);
                break;
            }
        }
    }

    gameOver() {
        this.isGameOver = true;
    }

    start() {
        this.engine.init();
    }
}

export default HerosJourneyGame;