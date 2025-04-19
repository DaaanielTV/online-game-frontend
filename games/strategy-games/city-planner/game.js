import { GameEngine, Entity, InputManager } from '../../shared/engine.js';

class Building extends Entity {
    constructor(x, y, type, size) {
        super(x, y, size * 40, size * 40);
        this.type = type;
        this.size = size;
        this.level = 1;
        this.happiness = 100;
        this.efficiency = 1.0;
        this.stats = this.getBuildingStats();
    }

    getBuildingStats() {
        return {
            residential: { 
                population: 20 * this.size,
                happiness: 5,
                maintenance: 5 * this.size
            },
            commercial: {
                jobs: 10 * this.size,
                income: 15 * this.size,
                maintenance: 8 * this.size
            },
            industrial: {
                jobs: 15 * this.size,
                income: 20 * this.size,
                pollution: 10 * this.size,
                maintenance: 12 * this.size
            },
            park: {
                happiness: 15,
                maintenance: 3 * this.size,
                pollution: -5
            },
            powerPlant: {
                power: 50 * this.size,
                pollution: 20 * this.size,
                maintenance: 25 * this.size
            },
            waterTreatment: {
                water: 40 * this.size,
                maintenance: 15 * this.size
            }
        }[this.type] || {};
    }

    update(deltaTime) {
        // Update building efficiency based on surrounding conditions
        return this.stats;
    }

    render(ctx) {
        ctx.fillStyle = this.getBuildingColor();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        // Draw building
        ctx.beginPath();
        ctx.rect(this.x, this.y, this.width, this.height);
        ctx.fill();
        ctx.stroke();

        // Draw building type indicator
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(this.type.slice(0, 3).toUpperCase(), 
            this.x + 5, this.y + 15);

        // Draw efficiency indicator if not optimal
        if (this.efficiency < 1) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(this.x, this.y + this.height - 4, 
                this.width * this.efficiency, 4);
        }
    }

    getBuildingColor() {
        return {
            residential: '#4CAF50',
            commercial: '#2196F3',
            industrial: '#FFC107',
            park: '#8BC34A',
            powerPlant: '#FF5722',
            waterTreatment: '#00BCD4'
        }[this.type] || '#9E9E9E';
    }
}

class CityPlanner {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.buildings = [];
        this.grid = [];
        this.gridSize = 20;
        this.cellSize = 40;
        this.selectedBuildingType = null;
        this.selectedSize = 1;
        this.resources = {
            money: 10000,
            population: 0,
            happiness: 50,
            power: 0,
            water: 0,
            pollution: 0,
            jobs: 0
        };
        this.costs = {
            residential: 1000,
            commercial: 1500,
            industrial: 2000,
            park: 500,
            powerPlant: 5000,
            waterTreatment: 3000
        };
        this.setupGame();
    }

    setupGame() {
        this.engine.init();
        this.initializeGrid();
        this.setupEventListeners();
        
        // Add UI rendering
        this.engine.addEntity({
            render: (ctx) => this.renderUI(ctx)
        });

        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }

    initializeGrid() {
        for (let y = 0; y < this.gridSize; y++) {
            this.grid[y] = [];
            for (let x = 0; x < this.gridSize; x++) {
                this.grid[y][x] = null;
            }
        }
    }

    setupEventListeners() {
        const canvas = this.engine.canvas;
        
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.cellSize);
            const y = Math.floor((e.clientY - rect.top) / this.cellSize);
            
            if (this.selectedBuildingType) {
                // Show building preview
                this.previewX = x;
                this.previewY = y;
            }
        });

        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.cellSize);
            const y = Math.floor((e.clientY - rect.top) / this.cellSize);
            
            if (this.selectedBuildingType) {
                this.tryPlaceBuilding(x, y);
            }
        });

        // Add building selection buttons
        const buildingTypes = ['residential', 'commercial', 'industrial', 
                             'park', 'powerPlant', 'waterTreatment'];
        const controls = document.querySelector('.controls');
        buildingTypes.forEach(type => {
            const button = document.createElement('button');
            button.textContent = type;
            button.onclick = () => {
                this.selectedBuildingType = type;
                document.querySelectorAll('.controls button')
                    .forEach(b => b.classList.remove('selected'));
                button.classList.add('selected');
            };
            controls.appendChild(button);
        });

        // Add size selection
        const sizeSelect = document.createElement('select');
        [1, 2, 3].forEach(size => {
            const option = document.createElement('option');
            option.value = size;
            option.textContent = `${size}x${size}`;
            sizeSelect.appendChild(option);
        });
        sizeSelect.onchange = (e) => {
            this.selectedSize = parseInt(e.target.value);
        };
        controls.appendChild(sizeSelect);
    }

    tryPlaceBuilding(x, y) {
        // Check if space is available
        for (let dy = 0; dy < this.selectedSize; dy++) {
            for (let dx = 0; dx < this.selectedSize; dx++) {
                if (y + dy >= this.gridSize || x + dx >= this.gridSize || 
                    this.grid[y + dy][x + dx] !== null) {
                    return false;
                }
            }
        }

        // Check if we can afford it
        const cost = this.costs[this.selectedBuildingType] * 
            (this.selectedSize * this.selectedSize);
        if (this.resources.money < cost) {
            return false;
        }

        // Place building
        const building = new Building(
            x * this.cellSize, 
            y * this.cellSize, 
            this.selectedBuildingType, 
            this.selectedSize
        );
        
        // Update grid
        for (let dy = 0; dy < this.selectedSize; dy++) {
            for (let dx = 0; dx < this.selectedSize; dx++) {
                this.grid[y + dy][x + dx] = building;
            }
        }

        this.buildings.push(building);
        this.resources.money -= cost;
        return true;
    }

    updateCity(deltaTime) {
        let newResources = { ...this.resources };
        
        // Update all buildings and collect their effects
        this.buildings.forEach(building => {
            const stats = building.update(deltaTime);
            Object.entries(stats).forEach(([resource, value]) => {
                if (resource in newResources) {
                    newResources[resource] += value * building.efficiency;
                }
            });
            
            // Deduct maintenance costs
            if (stats.maintenance) {
                newResources.money -= stats.maintenance * deltaTime / 1000;
            }
        });

        // Update happiness based on various factors
        newResources.happiness = this.calculateHappiness(newResources);
        
        // Apply changes
        this.resources = newResources;
    }

    calculateHappiness(resources) {
        let happiness = this.resources.happiness;
        
        // Factors affecting happiness
        if (resources.jobs < resources.population) {
            happiness -= 10;
        }
        if (resources.pollution > resources.population) {
            happiness -= 15;
        }
        if (resources.power < this.getTotalPowerDemand()) {
            happiness -= 20;
        }
        if (resources.water < this.getTotalWaterDemand()) {
            happiness -= 20;
        }

        return Math.max(0, Math.min(100, happiness));
    }

    getTotalPowerDemand() {
        return this.resources.population * 0.5 + 
            this.buildings.filter(b => b.type === 'industrial').length * 20;
    }

    getTotalWaterDemand() {
        return this.resources.population * 0.3 + 
            this.buildings.filter(b => b.type === 'industrial').length * 10;
    }

    renderUI(ctx) {
        // Draw grid
        ctx.strokeStyle = '#666666';
        ctx.lineWidth = 1;
        for (let y = 0; y <= this.gridSize; y++) {
            ctx.beginPath();
            ctx.moveTo(0, y * this.cellSize);
            ctx.lineTo(this.gridSize * this.cellSize, y * this.cellSize);
            ctx.stroke();
        }
        for (let x = 0; x <= this.gridSize; x++) {
            ctx.beginPath();
            ctx.moveTo(x * this.cellSize, 0);
            ctx.lineTo(x * this.cellSize, this.gridSize * this.cellSize);
            ctx.stroke();
        }

        // Draw buildings
        this.buildings.forEach(building => building.render(ctx));

        // Draw preview if building selected
        if (this.selectedBuildingType && 
            this.previewX !== undefined && 
            this.previewY !== undefined) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = new Building(0, 0, this.selectedBuildingType, 1)
                .getBuildingColor();
            ctx.fillRect(
                this.previewX * this.cellSize,
                this.previewY * this.cellSize,
                this.selectedSize * this.cellSize,
                this.selectedSize * this.cellSize
            );
            ctx.globalAlpha = 1.0;
        }

        // Draw resources
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        let y = 30;
        Object.entries(this.resources).forEach(([resource, value]) => {
            ctx.fillText(
                `${resource}: ${Math.floor(value)}`,
                this.engine.canvas.width - 200,
                y
            );
            y += 25;
        });
    }

    gameLoop() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastUpdateTime;
        this.lastUpdateTime = currentTime;
        
        this.updateCity(deltaTime);
        this.engine.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

export default CityPlanner;