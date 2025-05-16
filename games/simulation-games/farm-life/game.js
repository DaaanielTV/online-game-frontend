class Farm {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.crops = [];
        this.animals = [];
        this.buildings = [];
        this.resources = {
            money: 2000,
            seeds: 100,
            water: 200,
            feed: 150,
            happiness: 100
        };
        this.costs = {
            barn: 1000,
            silo: 800,
            well: 500,
            coop: 600,
            field: 400
        };
        this.gridSize = 10;
        this.cellSize = 50;
        this.selectedTool = null;
        this.setupGame();
    }

    async setupGame() {
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
                // Draw grid
                this.renderGrid(ctx);
            }
        });

        // Add UI rendering
        this.engine.addEntity({
            render: (ctx) => this.renderUI(ctx)
        });

        // Initialize the game engine
        this.engine.init();
        this.setupEventListeners();
        this.gameLoop();
    }

    renderGrid(ctx) {
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.gridSize; i++) {
            // Vertical lines
            ctx.beginPath();
            ctx.moveTo(i * this.cellSize, 0);
            ctx.lineTo(i * this.cellSize, this.gridSize * this.cellSize);
            ctx.stroke();
            
            // Horizontal lines
            ctx.beginPath();
            ctx.moveTo(0, i * this.cellSize);
            ctx.lineTo(this.gridSize * this.cellSize, i * this.cellSize);
            ctx.stroke();
        }
    }

    setupEventListeners() {
        const canvas = this.engine.canvas;
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Convert to grid coordinates
            const gridX = Math.floor(x / this.cellSize);
            const gridY = Math.floor(y / this.cellSize);

            if (gridX < this.gridSize && gridY < this.gridSize) {
                this.handleGridClick(gridX, gridY);
            } else {
                this.handleUIClick(x, y);
            }
        });
    }

    handleGridClick(gridX, gridY) {
        if (!this.selectedTool) return;

        switch (this.selectedTool.type) {
            case 'plant':
                if (this.resources.seeds > 0) {
                    this.plantCrop(gridX, gridY, this.selectedTool.crop);
                }
                break;
            case 'water':
                this.waterCrop(gridX, gridY);
                break;
            case 'harvest':
                this.harvestCrop(gridX, gridY);
                break;
            case 'build':
                if (this.resources.money >= this.costs[this.selectedTool.building]) {
                    this.buildStructure(gridX, gridY, this.selectedTool.building);
                }
                break;
        }
    }

    renderUI(ctx) {
        // Draw resources
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Money: $${this.resources.money}`, 20, this.gridSize * this.cellSize + 30);
        ctx.fillText(`Seeds: ${this.resources.seeds}`, 200, this.gridSize * this.cellSize + 30);
        ctx.fillText(`Water: ${this.resources.water}`, 350, this.gridSize * this.cellSize + 30);
        ctx.fillText(`Feed: ${this.resources.feed}`, 500, this.gridSize * this.cellSize + 30);

        // Draw action buttons
        this.renderActionButtons(ctx);
    }

    renderActionButtons(ctx) {
        const buttonY = this.engine.canvas.height - 60;
        const buttons = [
            { text: 'Plant', color: '#4CAF50', x: 20 },
            { text: 'Water', color: '#2196F3', x: 120 },
            { text: 'Harvest', color: '#FF9800', x: 220 },
            { text: 'Build', color: '#795548', x: 320 }
        ];

        buttons.forEach(button => {
            ctx.fillStyle = this.selectedTool?.text === button.text ? '#fff' : button.color;
            ctx.fillRect(button.x, buttonY, 80, 40);
            ctx.fillStyle = this.selectedTool?.text === button.text ? button.color : '#fff';
            ctx.fillText(button.text, button.x + 20, buttonY + 25);
        });
    }

    handleUIClick(x, y) {
        const buttonY = this.engine.canvas.height - 60;
        if (y >= buttonY && y <= buttonY + 40) {
            if (x >= 20 && x <= 100) this.selectedTool = { type: 'plant', text: 'Plant' };
            else if (x >= 120 && x <= 200) this.selectedTool = { type: 'water', text: 'Water' };
            else if (x >= 220 && x <= 300) this.selectedTool = { type: 'harvest', text: 'Harvest' };
            else if (x >= 320 && x <= 400) this.selectedTool = { type: 'build', text: 'Build' };
        }
    }

    buildStructure(type) {
        if (this.resources.money >= this.costs[type]) {
            const building = {
                type,
                x: Math.random() * (this.engine.canvas.width - 100),
                y: Math.random() * (this.engine.canvas.height - 100),
                width: 100,
                height: 100,
                health: 100
            };
            
            this.buildings.push(building);
            this.resources.money -= this.costs[type];
        }
    }

    plantCrop(x, y, type = 'wheat') {
        const existingCrop = this.crops.find(c => c.x === x && c.y === y);
        if (!existingCrop) {
            this.crops.push({
                x, y,
                type,
                growth: 0,
                water: 0,
                isWatered: false
            });
            this.resources.seeds--;
        }
    }

    waterCrop(x, y) {
        const crop = this.crops.find(c => c.x === x && c.y === y);
        if (crop && this.resources.water > 0) {
            crop.isWatered = true;
            this.resources.water--;
        }
    }

    harvestCrop(x, y) {
        const index = this.crops.findIndex(c => c.x === x && c.y === y && c.growth >= 100);
        if (index !== -1) {
            const crop = this.crops[index];
            this.resources.money += this.getCropValue(crop.type);
            this.crops.splice(index, 1);
        }
    }

    getCropValue(type) {
        const values = {
            wheat: 50,
            corn: 75,
            potato: 60,
            carrot: 45
        };
        return values[type] || 50;
    }

    update() {
        // Update crops
        this.crops.forEach(crop => {
            if (crop.isWatered) {
                crop.growth = Math.min(100, crop.growth + 0.1);
            }
        });

        // Update animals
        this.animals.forEach(animal => {
            animal.happiness = Math.max(0, animal.happiness - 0.1);
            if (this.resources.feed > 0 && animal.hunger > 50) {
                animal.hunger = 0;
                this.resources.feed--;
            }
        });

        // Natural resource regeneration
        this.resources.water = Math.min(200, this.resources.water + 0.05);
    }

    gameLoop() {
        this.update();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Don't forget to export the class
export default Farm;
