import { GameEngine, Entity, InputManager } from '../../shared/engine.js';

class TimeObject extends Entity {
    constructor(x, y, type) {
        super(x, y, 40, 40);
        this.type = type;
        this.initialX = x;
        this.initialY = y;
        this.timeStates = [];
        this.maxStates = 300; // 5 seconds at 60fps
        this.isMoving = false;
        this.velocity = { x: 0, y: 0 };
        this.gravity = type === 'dynamic' ? 0.5 : 0;
    }

    update() {
        if (this.type === 'dynamic') {
            // Apply gravity
            this.velocity.y += this.gravity;
            
            // Update position
            this.x += this.velocity.x;
            this.y += this.velocity.y;

            // Store current state
            this.timeStates.push({
                x: this.x,
                y: this.y,
                vx: this.velocity.x,
                vy: this.velocity.y
            });

            // Limit stored states
            if (this.timeStates.length > this.maxStates) {
                this.timeStates.shift();
            }
        }
    }

    render(ctx) {
        ctx.fillStyle = this.getTypeColor();
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw time trail
        if (this.timeStates.length > 1) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.beginPath();
            ctx.moveTo(this.timeStates[0].x + this.width / 2, this.timeStates[0].y + this.height / 2);
            for (let i = 1; i < this.timeStates.length; i++) {
                ctx.lineTo(this.timeStates[i].x + this.width / 2, this.timeStates[i].y + this.height / 2);
            }
            ctx.stroke();
        }
    }

    getTypeColor() {
        switch (this.type) {
            case 'static': return '#666666';
            case 'dynamic': return '#4CAF50';
            case 'goal': return '#FFD700';
            case 'hazard': return '#FF4444';
            default: return '#FFFFFF';
        }
    }

    reset() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.velocity = { x: 0, y: 0 };
        this.timeStates = [];
    }

    rewindTo(stateIndex) {
        if (this.timeStates[stateIndex]) {
            const state = this.timeStates[stateIndex];
            this.x = state.x;
            this.y = state.y;
            this.velocity = { x: state.vx, y: state.vy };
            this.timeStates = this.timeStates.slice(0, stateIndex + 1);
        }
    }

    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

class Level {
    constructor(objects, playerStart, goalPosition) {
        this.objects = objects;
        this.playerStart = playerStart;
        this.goalPosition = goalPosition;
    }
}

class TimeShifterGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.currentLevel = 0;
        this.timeState = 'playing'; // playing, rewinding, paused
        this.rewindIndex = 0;
        this.player = null;
        this.levels = this.createLevels();
        this.setup();
    }

    createLevels() {
        return [
            // Level 1: Simple jump to goal
            new Level(
                [
                    new TimeObject(100, 400, 'static'), // Platform
                    new TimeObject(300, 300, 'static'), // Platform
                    new TimeObject(500, 200, 'goal')    // Goal
                ],
                { x: 50, y: 300 },
                { x: 500, y: 200 }
            ),
            // Level 2: Moving platforms and hazards
            new Level(
                [
                    new TimeObject(100, 400, 'static'),    // Ground
                    new TimeObject(300, 350, 'dynamic'),   // Moving platform
                    new TimeObject(500, 300, 'hazard'),    // Hazard
                    new TimeObject(700, 200, 'goal')       // Goal
                ],
                { x: 50, y: 300 },
                { x: 700, y: 200 }
            ),
            // Add more levels as needed
        ];
    }

    setup() {
        this.loadLevel(this.currentLevel);

        // Add UI entity
        this.engine.addEntity({
            render: (ctx) => {
                ctx.fillStyle = '#ffffff';
                ctx.font = '24px Arial';
                ctx.fillText(`Level ${this.currentLevel + 1}`, 20, 30);
                ctx.fillText(`Time State: ${this.timeState}`, 20, 60);
                ctx.font = '16px Arial';
                ctx.fillText('R to Reset', 20, 90);
                ctx.fillText('Space to Time Shift', 20, 110);
                ctx.fillText('Arrow Keys to Move', 20, 130);
            }
        });

        // Override engine update
        this.engine.update = (deltaTime) => this.update(deltaTime);
    }

    loadLevel(levelIndex) {
        // Clear existing entities
        this.engine.entities = [];

        // Get level data
        const level = this.levels[levelIndex];
        
        // Create player
        this.player = new TimeObject(
            level.playerStart.x,
            level.playerStart.y,
            'dynamic'
        );
        this.player.game = this;
        this.engine.addEntity(this.player);

        // Add level objects
        for (const obj of level.objects) {
            obj.game = this;
            this.engine.addEntity(obj);
        }

        this.timeState = 'playing';
        this.rewindIndex = 0;
    }

    update(deltaTime) {
        if (this.input.isKeyPressed('r')) {
            this.resetLevel();
            return;
        }

        if (this.input.isKeyPressed(' ')) {
            this.toggleTimeState();
        }

        switch (this.timeState) {
            case 'playing':
                this.updatePlaying();
                break;
            case 'rewinding':
                this.updateRewinding();
                break;
            case 'paused':
                // No updates in paused state
                break;
        }

        // Check collisions
        this.checkCollisions();
    }

    updatePlaying() {
        // Player movement
        if (this.input.isKeyPressed('ArrowLeft')) {
            this.player.velocity.x = -5;
        } else if (this.input.isKeyPressed('ArrowRight')) {
            this.player.velocity.x = 5;
        } else {
            this.player.velocity.x *= 0.8; // Friction
        }

        // Jumping
        if (this.input.isKeyPressed('ArrowUp') && this.isOnGround(this.player)) {
            this.player.velocity.y = -12;
        }

        // Update all entities
        for (const entity of this.engine.entities) {
            if (entity.update) {
                entity.update();
            }
        }
    }

    updateRewinding() {
        if (this.rewindIndex > 0) {
            this.rewindIndex--;
            for (const entity of this.engine.entities) {
                if (entity.timeStates && entity.timeStates.length > 0) {
                    entity.rewindTo(this.rewindIndex);
                }
            }
        } else {
            this.timeState = 'playing';
        }
    }

    toggleTimeState() {
        switch (this.timeState) {
            case 'playing':
                this.timeState = 'rewinding';
                this.rewindIndex = this.player.timeStates.length - 1;
                break;
            case 'rewinding':
                this.timeState = 'playing';
                break;
            case 'paused':
                this.timeState = 'playing';
                break;
        }
    }

    isOnGround(entity) {
        const groundTest = new Entity(
            entity.x,
            entity.y + entity.height + 1,
            entity.width,
            1
        );

        for (const other of this.engine.entities) {
            if (other !== entity && other.type === 'static' && groundTest.collidesWith(other)) {
                return true;
            }
        }
        return false;
    }

    checkCollisions() {
        // Check collisions with static objects (platforms)
        for (const entity of this.engine.entities) {
            if (entity !== this.player && entity.type === 'static') {
                if (this.player.collidesWith(entity)) {
                    // Resolve collision
                    const overlapX = Math.min(
                        Math.abs(this.player.x + this.player.width - entity.x),
                        Math.abs(entity.x + entity.width - this.player.x)
                    );
                    const overlapY = Math.min(
                        Math.abs(this.player.y + this.player.height - entity.y),
                        Math.abs(entity.y + entity.height - this.player.y)
                    );

                    if (overlapX < overlapY) {
                        // Horizontal collision
                        if (this.player.x < entity.x) {
                            this.player.x = entity.x - this.player.width;
                        } else {
                            this.player.x = entity.x + entity.width;
                        }
                        this.player.velocity.x = 0;
                    } else {
                        // Vertical collision
                        if (this.player.y < entity.y) {
                            this.player.y = entity.y - this.player.height;
                            this.player.velocity.y = 0;
                        } else {
                            this.player.y = entity.y + entity.height;
                            this.player.velocity.y = 0;
                        }
                    }
                }
            } else if (entity.type === 'goal' && this.player.collidesWith(entity)) {
                // Level complete
                this.currentLevel++;
                if (this.currentLevel < this.levels.length) {
                    this.loadLevel(this.currentLevel);
                } else {
                    alert('Congratulations! You completed all levels!');
                    this.currentLevel = 0;
                    this.loadLevel(0);
                }
            } else if (entity.type === 'hazard' && this.player.collidesWith(entity)) {
                // Player dies
                this.resetLevel();
            }
        }
    }

    resetLevel() {
        this.loadLevel(this.currentLevel);
    }

    start() {
        this.engine.init();
    }
}

export default TimeShifterGame;