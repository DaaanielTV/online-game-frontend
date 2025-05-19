import { GameEngine, Entity, InputManager, AssetManager } from '../../shared/engine.js';

class DungeonRoom {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.doors = {
            north: false,
            south: false,
            east: false,
            west: false
        };
        this.type = this.generateRoomType();
        this.explored = false;
    }

    generateRoomType() {
        const types = ['monster', 'treasure', 'trap', 'empty'];
        const weights = [0.4, 0.2, 0.2, 0.2];
        const random = Math.random();
        let sum = 0;
        for (let i = 0; i < types.length; i++) {
            sum += weights[i];
            if (random <= sum) return types[i];
        }
        return 'empty';
    }
}

class Hero extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.health = 100;
        this.maxHealth = 100;
        this.level = 1;
        this.experience = 0;
        this.gold = 0;
        this.inventory = [];
        this.speed = 4;
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
    }

    collectGold(amount) {
        this.gold += amount;
    }
}

class DungeonCrawlerGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.hero = null;
        this.dungeonLevel = 1;
        this.currentRoom = null;
        this.rooms = [];
        this.isGameOver = false;
        this.setup();
    }

    generateDungeon() {
        this.rooms = [];
        const numRooms = 5 + Math.floor(this.dungeonLevel * 1.5);
        
        // Create rooms
        for (let i = 0; i < numRooms; i++) {
            const room = new DungeonRoom(
                Math.random() * (this.engine.canvas.width - 200) + 100,
                Math.random() * (this.engine.canvas.height - 200) + 100,
                200,
                200
            );
            this.rooms.push(room);
        }

        // Connect rooms with doors
        for (let i = 0; i < this.rooms.length - 1; i++) {
            const roomA = this.rooms[i];
            const roomB = this.rooms[i + 1];

            if (roomA.x < roomB.x) {
                roomA.doors.east = true;
                roomB.doors.west = true;
            } else {
                roomA.doors.west = true;
                roomB.doors.east = true;
            }

            if (roomA.y < roomB.y) {
                roomA.doors.south = true;
                roomB.doors.north = true;
            } else {
                roomA.doors.north = true;
                roomB.doors.south = true;
            }
        }

        this.currentRoom = this.rooms[0];
        this.currentRoom.explored = true;
    }

    async setup() {
        // Load background
        try {
            await this.assets.loadImage('background', '../../enemy/game-background.png');
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

        // Generate initial dungeon
        this.generateDungeon();

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
                    ctx.fillText(`Level: ${this.hero.level}`, 20, 30);
                    ctx.fillText(`Health: ${this.hero.health}/${this.hero.maxHealth}`, 20, 60);
                    ctx.fillText(`XP: ${this.hero.experience}/${this.hero.level * 100}`, 20, 90);
                    ctx.fillText(`Gold: ${this.hero.gold}`, 20, 120);
                    ctx.fillText(`Dungeon Level: ${this.dungeonLevel}`, 20, 150);
                }

                // Draw current room
                if (this.currentRoom) {
                    ctx.strokeStyle = '#666';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(
                        this.currentRoom.x,
                        this.currentRoom.y,
                        this.currentRoom.width,
                        this.currentRoom.height
                    );

                    // Draw doors
                    ctx.fillStyle = '#8B4513';
                    if (this.currentRoom.doors.north) {
                        ctx.fillRect(
                            this.currentRoom.x + this.currentRoom.width / 2 - 20,
                            this.currentRoom.y - 10,
                            40,
                            10
                        );
                    }
                    if (this.currentRoom.doors.south) {
                        ctx.fillRect(
                            this.currentRoom.x + this.currentRoom.width / 2 - 20,
                            this.currentRoom.y + this.currentRoom.height,
                            40,
                            10
                        );
                    }
                    if (this.currentRoom.doors.east) {
                        ctx.fillRect(
                            this.currentRoom.x + this.currentRoom.width,
                            this.currentRoom.y + this.currentRoom.height / 2 - 20,
                            10,
                            40
                        );
                    }
                    if (this.currentRoom.doors.west) {
                        ctx.fillRect(
                            this.currentRoom.x - 10,
                            this.currentRoom.y + this.currentRoom.height / 2 - 20,
                            10,
                            40
                        );
                    }
                }
            }
        });
    }

    nextLevel() {
        this.dungeonLevel++;
        this.generateDungeon();
        this.hero.health = this.hero.maxHealth;
    }

    gameOver() {
        this.isGameOver = true;
    }

    start() {
        this.engine.init();
    }
}

export default DungeonCrawlerGame;