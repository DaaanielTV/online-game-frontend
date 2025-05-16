import { GameEngine, Entity, InputManager, AssetManager } from '../../shared/engine.js';

class Animal extends Entity {
    constructor(x, y, species) {
        super(x, y, 80, 80);
        this.species = species;
        this.happiness = 100;
        this.hunger = 0;
        this.health = 100;
        this.lastFed = Date.now();
        this.lastCleaned = Date.now();
        this.isDirty = false;
        this.stats = this.getSpeciesStats();
    }

    getSpeciesStats() {
        return {
            elephant: {
                foodCost: 50,
                revenue: 100,
                space: 4,
                image: 'elephant'
            },
            lion: {
                foodCost: 40,
                revenue: 80,
                space: 3
            },
            penguin: {
                foodCost: 20,
                revenue: 40,
                space: 2
            },
            monkey: {
                foodCost: 25,
                revenue: 50,
                space: 2
            },
            giraffe: {
                foodCost: 35,
                revenue: 70,
                space: 3
            }
        }[this.species] || { foodCost: 20, revenue: 40, space: 2 };
    }

    update(deltaTime) {
        // Increase hunger over time
        const timeSinceLastFed = (Date.now() - this.lastFed) / 1000;
        this.hunger = Math.min(100, this.hunger + timeSinceLastFed * 0.01);

        // Decrease happiness if hungry or dirty
        if (this.hunger > 50 || this.isDirty) {
            this.happiness = Math.max(0, this.happiness - 0.1);
        }

        // Check if enclosure needs cleaning
        const timeSinceLastCleaned = (Date.now() - this.lastCleaned) / 1000;
        if (timeSinceLastCleaned > 300) { // 5 minutes
            this.isDirty = true;
        }

        // Update health based on conditions
        if (this.hunger > 80 || this.happiness < 20) {
            this.health = Math.max(0, this.health - 0.1);
        }
    }

    render(ctx) {
        // Draw animal enclosure
        ctx.fillStyle = this.isDirty ? '#8B4513' : '#90A4AE';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw animal
        ctx.fillStyle = this.getAnimalColor();
        ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, this.height - 20);

        // Draw status bars
        this.drawStatusBar(ctx, this.x, this.y - 30, this.health, '#F44336');
        this.drawStatusBar(ctx, this.x, this.y - 20, 100 - this.hunger, '#4CAF50');
        this.drawStatusBar(ctx, this.x, this.y - 10, this.happiness, '#2196F3');

        // Draw species name
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(this.species, this.x + 5, this.y + this.height - 5);
    }

    drawStatusBar(ctx, x, y, value, color) {
        const width = 80;
        const height = 5;
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, (width * Math.max(0, Math.min(value, 100))) / 100, height);
    }

    getAnimalColor() {
        const colors = {
            elephant: '#607D8B',
            lion: '#FFA726',
            penguin: '#212121',
            monkey: '#795548',
            giraffe: '#FDD835'
        };
        return colors[this.species] || '#9E9E9E';
    }

    feed() {
        this.hunger = 0;
        this.lastFed = Date.now();
        this.happiness = Math.min(100, this.happiness + 10);
    }

    clean() {
        this.isDirty = false;
        this.lastCleaned = Date.now();
        this.happiness = Math.min(100, this.happiness + 5);
    }
}

class ZooKeeper {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.animals = [];
        this.selectedAnimal = null;
        this.resources = {
            money: 5000,
            food: 1000,
            supplies: 100,
            reputation: 50,
            visitors: 0
        };
        this.costs = {
            elephant: 2000,
            lion: 1500,
            penguin: 800,
            monkey: 1000,
            giraffe: 1200
        };
        this.gridSize = 8;
        this.cellSize = 100;
        this.setupGame();
    }

    async setupGame() {
        // Load background
        try {
            await this.assets.loadImage('background', '../../enemy/nature-background.png');
            await this.assets.loadImage('elephant', '../../enemy/elephant.png');
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

        this.addStartingAnimals();
        this.engine.init();
        this.setupEventListeners();
        this.startGameLoop();
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

    addStartingAnimals() {
        this.addAnimal(1, 1, 'elephant');
        this.addAnimal(3, 1, 'lion');
    }

    addAnimal(gridX, gridY, species) {
        const animal = new Animal(
            gridX * this.cellSize,
            gridY * this.cellSize,
            species
        );
        this.animals.push(animal);
        this.engine.addEntity(animal);
    }

    renderUI(ctx) {
        // Draw resources
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Money: $${Math.floor(this.resources.money)}`, 20, 30);
        ctx.fillText(`Food: ${Math.floor(this.resources.food)}`, 200, 30);
        ctx.fillText(`Supplies: ${Math.floor(this.resources.supplies)}`, 350, 30);
        ctx.fillText(`Visitors: ${this.resources.visitors}`, 500, 30);
        ctx.fillText(`Reputation: ${Math.floor(this.resources.reputation)}%`, 650, 30);

        // Draw action buttons
        this.renderActionButtons(ctx);
    }

    renderActionButtons(ctx) {
        const buttonY = this.engine.canvas.height - 60;
        const buttons = [
            { text: 'Add Animal', color: '#4CAF50', x: 20 },
            { text: 'Feed', color: '#FFA726', x: 150 },
            { text: 'Clean', color: '#29B6F6', x: 280 },
            { text: 'Buy Food', color: '#FF7043', x: 410 },
            { text: 'Buy Supplies', color: '#9CCC65', x: 540 }
        ];

        buttons.forEach(button => {
            ctx.fillStyle = button.color;
            ctx.fillRect(button.x, buttonY, 110, 40);
            ctx.fillStyle = '#fff';
            ctx.fillText(button.text, button.x + 10, buttonY + 25);
        });
    }

    setupEventListeners() {
        const canvas = this.engine.canvas;
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (y > this.engine.canvas.height - 70) {
                this.handleButtonClick(x);
            } else {
                this.handleGameAreaClick(x, y);
            }
        });
    }

    handleButtonClick(x) {
        if (x < 130) this.showAnimalMenu();
        else if (x < 260 && this.selectedAnimal) this.feedAnimal();
        else if (x < 390 && this.selectedAnimal) this.cleanEnclosure();
        else if (x < 520) this.buyFood();
        else if (x < 650) this.buySupplies();
    }

    handleGameAreaClick(x, y) {
        const gridX = Math.floor(x / this.cellSize);
        const gridY = Math.floor(y / this.cellSize);

        if (gridX < this.gridSize && gridY < this.gridSize) {
            // Select animal if one exists at this location
            this.selectedAnimal = this.animals.find(animal => 
                Math.floor(animal.x / this.cellSize) === gridX && 
                Math.floor(animal.y / this.cellSize) === gridY
            );
        }
    }

    showAnimalMenu() {
        // Implementation for showing animal purchase menu
        console.log('Showing animal menu');
    }

    feedAnimal() {
        if (this.selectedAnimal && this.resources.food >= 10) {
            this.selectedAnimal.feed();
            this.resources.food -= 10;
        }
    }

    cleanEnclosure() {
        if (this.selectedAnimal && this.resources.supplies >= 5) {
            this.selectedAnimal.clean();
            this.resources.supplies -= 5;
        }
    }

    buyFood() {
        if (this.resources.money >= 100) {
            this.resources.food += 50;
            this.resources.money -= 100;
        }
    }

    buySupplies() {
        if (this.resources.money >= 50) {
            this.resources.supplies += 25;
            this.resources.money -= 50;
        }
    }

    update(deltaTime) {
        // Update all animals
        this.animals.forEach(animal => {
            animal.update(deltaTime);
            
            // Generate revenue based on animal happiness and health
            const efficiency = (animal.happiness + animal.health) / 200;
            this.resources.money += animal.stats.revenue * efficiency * (deltaTime / 1000);
        });

        // Update visitor count based on average animal happiness and zoo reputation
        const avgHappiness = this.animals.reduce((sum, animal) => sum + animal.happiness, 0) / this.animals.length;
        const targetVisitors = Math.floor((avgHappiness * this.resources.reputation) / 10);
        this.resources.visitors = Math.floor(this.resources.visitors * 0.95 + targetVisitors * 0.05);

        // Update reputation based on animal conditions
        const totalCondition = this.animals.reduce((sum, animal) => 
            sum + (animal.happiness + animal.health) / 2, 0);
        const avgCondition = this.animals.length > 0 ? totalCondition / this.animals.length : 50;
        this.resources.reputation = Math.min(100, Math.max(0, 
            this.resources.reputation * 0.99 + avgCondition * 0.01));
    }

    startGameLoop() {
        const now = Date.now();
        const deltaTime = now - (this.lastUpdate || now);
        this.lastUpdate = now;

        this.update(deltaTime);
        requestAnimationFrame(() => this.startGameLoop());
    }
}

// Don't forget to export the class
export default ZooKeeper;
