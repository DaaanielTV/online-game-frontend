import { GameEngine, Entity, InputManager } from '../../shared/engine.js';

class Building extends Entity {
    constructor(x, y, type) {
        super(x, y, 60, 60);
        this.type = type;
        this.level = 1;
        this.production = this.getProductionRate();
        this.health = 100;
    }

    getProductionRate() {
        const rates = {
            house: { gold: 1, population: 5 },
            farm: { food: 2 },
            mine: { gold: 2 },
            barracks: { soldiers: 1 },
            market: { gold: 3, food: -1 },
            temple: { happiness: 2, gold: -1 }
        };
        return rates[this.type];
    }

    getUpgradeCost() {
        const baseCosts = {
            house: { gold: 50 },
            farm: { gold: 40 },
            mine: { gold: 60 },
            barracks: { gold: 80 },
            market: { gold: 100 },
            temple: { gold: 120 }
        };
        const cost = baseCosts[this.type];
        return Object.entries(cost).reduce((acc, [resource, amount]) => {
            acc[resource] = amount * this.level;
            return acc;
        }, {});
    }

    upgrade() {
        this.level++;
        this.production = this.getProductionRate();
        // Scale production with level
        Object.keys(this.production).forEach(resource => {
            this.production[resource] *= this.level;
        });
    }

    update(deltaTime) {
        // Production cycle every 5 seconds
        this.productionTime = (this.productionTime || 0) + deltaTime;
        if (this.productionTime >= 5000) {
            this.productionTime = 0;
            return this.production;
        }
        return null;
    }

    render(ctx) {
        // Draw building
        ctx.fillStyle = this.getBuildingColor();
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw level indicator
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText(`L${this.level}`, this.x + 5, this.y + 15);

        // Draw health bar
        const healthWidth = (this.width - 10) * (this.health / 100);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x + 5, this.y + this.height - 8, this.width - 10, 4);
        ctx.fillStyle = 'green';
        ctx.fillRect(this.x + 5, this.y + this.height - 8, healthWidth, 4);
    }

    getBuildingColor() {
        const colors = {
            house: '#8B4513',
            farm: '#228B22',
            mine: '#808080',
            barracks: '#8B0000',
            market: '#DAA520',
            temple: '#FFD700'
        };
        return colors[this.type] || '#000000';
    }
}

class TinyEmpireGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.resources = {
            gold: 100,
            food: 50,
            population: 10,
            soldiers: 0,
            happiness: 50
        };
        this.buildings = [];
        this.selectedBuildingType = null;
        this.selectedBuilding = null;
        this.gameTime = 0;
        this.events = [];
        this.eventTypes = [
            { type: 'drought', effect: { food: -10 }, duration: 20000 },
            { type: 'festival', effect: { happiness: 20, gold: -20 }, duration: 15000 },
            { type: 'tradingCaravan', effect: { gold: 30 }, duration: 10000 }
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

        this.setupEventListeners();
        this.engine.init();
        
        // Add UI entity for resource display
        this.engine.addEntity({
            render: (ctx) => this.renderUI(ctx)
        });

        // Start game loop
        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }

    setupEventListeners() {
        const canvas = this.engine.canvas;
        
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.selectedBuildingType) {
                this.addBuilding(this.selectedBuildingType, x - 30, y - 30);
                this.selectedBuildingType = null;
            } else {
                this.selectBuildingAt(x, y);
            }
        });

        // Add building selection buttons
        const buildingTypes = ['house', 'farm', 'mine', 'barracks', 'market', 'temple'];
        buildingTypes.forEach(type => {
            const button = document.createElement('button');
            button.textContent = type;
            button.onclick = () => this.selectedBuildingType = type;
            document.body.appendChild(button);
        });
    }

    gameLoop() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
        
        this.update(deltaTime);
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        this.gameTime += deltaTime;

        // Update buildings and collect resources
        this.buildings.forEach(building => {
            const production = building.update(deltaTime);
            if (production) {
                Object.entries(production).forEach(([resource, amount]) => {
                    this.resources[resource] = (this.resources[resource] || 0) + amount;
                });
            }
        });

        // Basic resource consumption
        if (this.gameTime % 10000 < deltaTime) {  // Every 10 seconds
            this.resources.food -= this.resources.population * 0.1;
            this.resources.happiness = Math.max(0, Math.min(100, 
                this.resources.happiness + (this.resources.food > 0 ? 1 : -5)));
        }

        // Random events
        if (Math.random() < deltaTime / 60000) { // Average one event per minute
            this.triggerRandomEvent();
        }

        // Update active events
        this.events = this.events.filter(event => {
            event.duration -= deltaTime;
            return event.duration > 0;
        });
    }

    triggerRandomEvent() {
        const event = this.eventTypes[Math.floor(Math.random() * this.eventTypes.length)];
        this.events.push({ ...event });
    }

    selectBuildingAt(x, y) {
        this.selectedBuilding = this.buildings.find(building => 
            x >= building.x && x <= building.x + building.width &&
            y >= building.y && y <= building.y + building.height
        );
    }

    addBuilding(type, x, y) {
        const costs = {
            house: { gold: 50 },
            farm: { gold: 40 },
            mine: { gold: 60 },
            barracks: { gold: 80 },
            market: { gold: 100 },
            temple: { gold: 120 }
        };

        const cost = costs[type];
        if (this.canAfford(cost)) {
            this.deductResources(cost);
            const building = new Building(x, y, type);
            this.buildings.push(building);
            this.engine.addEntity(building);
        }
    }

    canAfford(cost) {
        return Object.entries(cost).every(([resource, amount]) => 
            this.resources[resource] >= amount);
    }

    deductResources(cost) {
        Object.entries(cost).forEach(([resource, amount]) => {
            this.resources[resource] -= amount;
        });
    }

    renderUI(ctx) {
        // Render resources
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        let y = 30;
        Object.entries(this.resources).forEach(([resource, amount]) => {
            ctx.fillText(`${resource}: ${Math.floor(amount)}`, 10, y);
            y += 25;
        });

        // Render active events
        y += 20;
        ctx.fillText('Active Events:', 10, y);
        y += 25;
        this.events.forEach(event => {
            ctx.fillText(`${event.type} (${Math.ceil(event.duration / 1000)}s)`, 10, y);
            y += 20;
        });

        // Render selected building info
        if (this.selectedBuilding) {
            const buildingInfo = [
                `Type: ${this.selectedBuilding.type}`,
                `Level: ${this.selectedBuilding.level}`,
                `Health: ${Math.floor(this.selectedBuilding.health)}%`
            ];
            y += 20;
            buildingInfo.forEach(info => {
                ctx.fillText(info, 10, y);
                y += 20;
            });
        }
    }
}

export default TinyEmpireGame;
