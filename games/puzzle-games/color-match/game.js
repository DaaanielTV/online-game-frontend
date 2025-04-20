import { GameEngine, Entity, InputManager } from '../../shared/engine.js';

class ColorTile extends Entity {
    constructor(x, y, color, size = 60) {
        super(x, y, size, size);
        this.color = color;
        this.targetColor = null;
        this.isSelected = false;
        this.isMatched = false;
        this.animation = 0;
    }

    render(ctx) {
        // Draw tile background
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw selection indicator
        if (this.isSelected) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.strokeRect(this.x + 2, this.y + 2, this.width - 4, this.height - 4);
        }

        // Draw target color indicator
        if (this.targetColor) {
            const indicatorSize = 20;
            ctx.fillStyle = this.targetColor;
            ctx.fillRect(
                this.x + this.width - indicatorSize,
                this.y,
                indicatorSize,
                indicatorSize
            );
        }

        // Draw match animation
        if (this.isMatched) {
            this.animation = (this.animation + 0.1) % (Math.PI * 2);
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.save();
            ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
            ctx.rotate(this.animation);
            ctx.beginPath();
            ctx.moveTo(-20, -20);
            ctx.lineTo(20, 20);
            ctx.moveTo(-20, 20);
            ctx.lineTo(20, -20);
            ctx.stroke();
            ctx.restore();
        }
    }

    containsPoint(x, y) {
        return x >= this.x && x <= this.x + this.width &&
               y >= this.y && y <= this.y + this.height;
    }
}

class ColorMixer {
    static mix(color1, color2) {
        // Convert hex to RGB
        const rgb1 = ColorMixer.hexToRgb(color1);
        const rgb2 = ColorMixer.hexToRgb(color2);

        // Mix colors
        const mixed = {
            r: Math.floor((rgb1.r + rgb2.r) / 2),
            g: Math.floor((rgb1.g + rgb2.g) / 2),
            b: Math.floor((rgb1.b + rgb2.b) / 2)
        };

        // Convert back to hex
        return ColorMixer.rgbToHex(mixed);
    }

    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static rgbToHex({ r, g, b }) {
        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    }

    static areColorsEqual(color1, color2, tolerance = 5) {
        const rgb1 = ColorMixer.hexToRgb(color1);
        const rgb2 = ColorMixer.hexToRgb(color2);
        
        return Math.abs(rgb1.r - rgb2.r) <= tolerance &&
               Math.abs(rgb1.g - rgb2.g) <= tolerance &&
               Math.abs(rgb1.b - rgb2.b) <= tolerance;
    }
}

class ColorGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.tiles = [];
        this.selectedTile = null;
        this.level = 1;
        this.score = 0;
        this.colors = [
            '#FF0000', '#00FF00', '#0000FF',  // Primary
            '#FFFF00', '#FF00FF', '#00FFFF',  // Secondary
            '#FF8800', '#88FF00', '#0088FF'   // Tertiary
        ];
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
        
        this.createLevel();

        // Add mouse event handling
        const canvas = document.getElementById(this.engine.canvasId);
        canvas.addEventListener('click', (e) => this.handleClick(e));

        // Add UI entity
        this.engine.addEntity({
            render: (ctx) => this.renderUI(ctx)
        });
    }

    createLevel() {
        this.tiles = [];
        const gridSize = 4 + Math.min(2, Math.floor(this.level / 3));
        const tileSize = Math.min(
            (this.engine.canvas.width - 100) / gridSize,
            (this.engine.canvas.height - 150) / gridSize
        );
        
        // Calculate grid position
        const startX = (this.engine.canvas.width - (tileSize * gridSize)) / 2;
        const startY = (this.engine.canvas.height - (tileSize * gridSize)) / 2;

        // Create tiles
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const tile = new ColorTile(
                    startX + j * tileSize,
                    startY + i * tileSize,
                    this.getRandomColor(),
                    tileSize - 4
                );
                
                // Assign target colors to some tiles
                if (Math.random() < 0.3) {
                    tile.targetColor = this.getRandomColor();
                }
                
                this.tiles.push(tile);
                this.engine.addEntity(tile);
            }
        }
    }

    getRandomColor() {
        return this.colors[Math.floor(Math.random() * this.colors.length)];
    }

    handleClick(e) {
        const rect = this.engine.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check for tile clicks
        for (const tile of this.tiles) {
            if (tile.containsPoint(x, y)) {
                if (this.selectedTile === null) {
                    // Select first tile
                    this.selectedTile = tile;
                    tile.isSelected = true;
                } else if (this.selectedTile === tile) {
                    // Deselect tile
                    this.selectedTile.isSelected = false;
                    this.selectedTile = null;
                } else {
                    // Mix colors
                    const newColor = ColorMixer.mix(this.selectedTile.color, tile.color);
                    this.selectedTile.color = newColor;
                    tile.color = newColor;
                    
                    // Check for matches
                    this.checkMatches([this.selectedTile, tile]);
                    
                    // Reset selection
                    this.selectedTile.isSelected = false;
                    this.selectedTile = null;
                }
                break;
            }
        }

        // Check for level completion
        this.checkLevelComplete();
    }

    checkMatches(tiles) {
        for (const tile of tiles) {
            if (tile.targetColor && ColorMixer.areColorsEqual(tile.color, tile.targetColor)) {
                tile.isMatched = true;
                this.score += 100;
            }
        }
    }

    checkLevelComplete() {
        const targetTiles = this.tiles.filter(t => t.targetColor);
        if (targetTiles.length > 0 && targetTiles.every(t => t.isMatched)) {
            // Level complete
            setTimeout(() => {
                this.level++;
                this.score += 500;
                // Clear existing tiles
                this.engine.entities = this.engine.entities.filter(e => !(e instanceof ColorTile));
                this.createLevel();
            }, 1000);
        }
    }

    renderUI(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Level: ${this.level}`, 20, 40);
        ctx.fillText(`Score: ${this.score}`, 20, 70);

        // Draw instructions
        ctx.textAlign = 'center';
        ctx.font = '16px Arial';
        ctx.fillText('Click tiles to select and mix colors', this.engine.canvas.width / 2, this.engine.canvas.height - 30);
        ctx.fillText('Match the small colored squares in the corners', this.engine.canvas.width / 2, this.engine.canvas.height - 10);
    }

    start() {
        this.engine.init();
    }
}

export default ColorGame;