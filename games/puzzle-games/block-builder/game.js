// 10. Block Builder: Physics-based construction puzzle game

import { GameEngine, Entity, InputManager, AssetManager } from '../../shared/engine.js';

class ColorTile extends Entity {
    constructor(x, y, color, size = 60) {
        super(x, y, size, size);
        this.color = color;
        this.targetColor = this.getRandomColor();
        this.isSelected = false;
        this.isMatched = false;
        this.animation = 0;

        // Block Builder spezifisch
        this.isBlock = false;
        this.blockColor = this.getRandomColor();
    }

    getRandomColor() {
        const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        // Beispiel: Animationen basierend auf Zustand
        if (this.animation === 1) {
            // Animation zu targetColor (pseudo-code)
            this.color = this.targetColor;
        } else if (this.animation === 0) {
            // Animation zu originaler Farbe
            // Hier müsstest du eine ursprüngliche Farbe speichern
        }
    }
}

class Block extends Entity {
    constructor(x, y, type, size = 40) {
        super(x, y, size, size);
        this.type = type;
        this.mass = this.getMass(type);
        this.isStatic = false;
        this.velocity = { x: 0, y: 0 };
        this.rotation = 0;
    }

    getMass(type) {
        const masses = {
            wood: 1,
            stone: 2,
            metal: 3
        };
        return masses[type] || 1;
    }

    update(deltaTime) {
        if (!this.isStatic) {
            this.velocity.y += 0.5; // gravity
            this.x += this.velocity.x * deltaTime;
            this.y += this.velocity.y * deltaTime;
        }
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        ctx.fillStyle = this.getBlockColor();
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        ctx.restore();
    }

    getBlockColor() {
        const colors = {
            wood: '#8B4513',
            stone: '#808080',
            metal: '#C0C0C0'
        };
        return colors[this.type] || '#000000';
    }
}

class BlockBuilderGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.blocks = [];
        this.selectedBlockType = 'wood';
        this.isPlacing = false;
        this.setup();
    }

    async setup() {
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

        // Add ground
        const ground = new Block(0, this.engine.canvas.height - 40, 'stone');
        ground.width = this.engine.canvas.width;
        ground.isStatic = true;
        this.blocks.push(ground);

        this.setupEventListeners();
        this.engine.init();
    }

    setupEventListeners() {
        this.engine.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.engine.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.engine.canvas.addEventListener('mouseup', () => this.isPlacing = false);
    }

    handleMouseDown(e) {
        const rect = this.engine.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.isPlacing = true;
        this.placeBlock(x, y);
    }

    handleMouseMove(e) {
        if (!this.isPlacing) return;
        const rect = this.engine.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.placeBlock(x, y);
    }

    placeBlock(x, y) {
        const block = new Block(x - 20, y - 20, this.selectedBlockType);
        this.blocks.push(block);
        this.engine.addEntity(block);
    }

    update(deltaTime) {
        this.checkCollisions();
        this.blocks.forEach(block => block.update(deltaTime));
    }

    checkCollisions() {
        for (let i = 0; i < this.blocks.length; i++) {
            for (let j = i + 1; j < this.blocks.length; j++) {
                if (this.blocks[i].collidesWith(this.blocks[j])) {
                    this.resolveCollision(this.blocks[i], this.blocks[j]);
                }
            }
        }
    }

    resolveCollision(block1, block2) {
        if (block2.isStatic) {
            block1.velocity.y = 0;
            block1.y = block2.y - block1.height;
        }
    }
}

export default BlockBuilderGame;