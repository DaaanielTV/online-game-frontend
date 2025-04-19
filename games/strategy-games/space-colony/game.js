import { GameEngine, Entity, InputManager } from '../../shared/engine.js';

class SpaceModule extends Entity {
    constructor(x, y, type) {
        super(x, y, 70, 70);
        this.type = type;
        this.level = 1;
        this.oxygen = 100;
        this.power = 100;
        this.efficiency = 1.0;
        this.moduleStats = this.getModuleStats();
    }

    getModuleStats() {
        return {
            habitat: { population: 10, oxygen: -5, power: -5 },
            oxygenGenerator: { oxygen: 20, power: -10 },
            powerPlant: { power: 30 },
            hydroponics: { food: 15, oxygen: 5, power: -8 },
            scienceLab: { research: 10, power: -15 },
            miningDrill: { minerals: 10, power: -12 }
        }[this.type] || {};
    }

    update(deltaTime) {
        // Update module resources every second
        this.updateTime = (this.updateTime || 0) + deltaTime;
        if (this.updateTime >= 1000) {
            this.updateTime = 0;
            // Calculate production based on power and oxygen availability
            const production = {};
            Object.entries(this.moduleStats).forEach(([resource, amount]) => {
                production[resource] = amount * this.efficiency * this.level;
            });
            return production;
        }
        return null;
    }

    render(ctx) {
        // Draw module hexagon shape
        ctx.beginPath();
        const sides = 6;
        const size = this.width / 2;
        for (let i = 0; i < sides; i++) {
            const angle = (i * 2 * Math.PI / sides) + Math.PI / 6;
            const x = this.x + size + (size * Math.cos(angle));
            const y = this.y + size + (size * Math.sin(angle));
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        
        // Fill with module color
        ctx.fillStyle = this.getModuleColor();
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw efficiency indicators
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText(`L${this.level}`, this.x + size - 8, this.y + size);
    }

    getModuleColor() {
        return {
            habitat: '#4CAF50',
            oxygenGenerator: '#00BCD4',
            powerPlant: '#FFC107',
            hydroponics: '#8BC34A',
            scienceLab: '#9C27B0',
            miningDrill: '#795548'
        }[this.type] || '#666666';
    }
}

class SpaceColonyGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.modules = [];
        this.resources = {
            population: 20,
            oxygen: 100,
            power: 100,
            food: 50,
            minerals: 0,
            research: 0
        };
        this.selectedModuleType = null;
        this.gameTime = 0;
        this.alerts = [];
        this.setup();
    }

    setup() {
        this.setupEventListeners();
        this.engine.init();
        
        // Add resource monitoring
        this.engine.addEntity({
            render: (ctx) => this.renderUI(ctx)
        });

        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }

    setupEventListeners() {
        const canvas = this.engine.canvas;
        
        // Handle module placement
        canvas.addEventListener('click', (e) => {
            if (!this.selectedModuleType) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if placement is valid (not overlapping other modules)
            if (this.canPlaceModuleAt(x, y)) {
                this.addModule(this.selectedModuleType, x - 35, y - 35);
                this.selectedModuleType = null;
            }
        });

        // Add module selection buttons in html
        const moduleTypes = ['habitat', 'oxygenGenerator', 'powerPlant', 
                           'hydroponics', 'scienceLab', 'miningDrill'];
        const controls = document.querySelector('.controls');
        moduleTypes.forEach(type => {
            const button = document.createElement('button');
            button.textContent = type;
            button.onclick = () => {
                this.selectedModuleType = type;
                document.querySelectorAll('.controls button').forEach(b => 
                    b.classList.remove('selected'));
                button.classList.add('selected');
            };
            controls.appendChild(button);
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

        // Update all modules and collect resources
        this.modules.forEach(module => {
            const production = module.update(deltaTime);
            if (production) {
                Object.entries(production).forEach(([resource, amount]) => {
                    this.resources[resource] = Math.max(0, 
                        (this.resources[resource] || 0) + amount);
                });
            }
        });

        // Basic life support checks every second
        if (this.gameTime % 1000 < deltaTime) {
            // Population consumes oxygen and food
            this.resources.oxygen -= this.resources.population * 0.1;
            this.resources.food -= this.resources.population * 0.05;
            
            // Check critical resources
            if (this.resources.oxygen < 20) {
                this.addAlert('Low oxygen levels!');
            }
            if (this.resources.power < 20) {
                this.addAlert('Power critically low!');
            }
            if (this.resources.food < 10) {
                this.addAlert('Food supplies critical!');
            }

            // Update module efficiencies based on power and oxygen
            this.updateModuleEfficiencies();
        }

        // Clear old alerts
        this.alerts = this.alerts.filter(alert => 
            currentTime - alert.time < 5000);
    }

    addAlert(message) {
        this.alerts.push({ message, time: Date.now() });
    }

    updateModuleEfficiencies() {
        const powerFactor = Math.min(1, this.resources.power / 
            (this.modules.length * 10));
        const oxygenFactor = Math.min(1, this.resources.oxygen / 
            (this.resources.population * 5));
        
        this.modules.forEach(module => {
            module.efficiency = Math.min(powerFactor, oxygenFactor);
        });
    }

    canPlaceModuleAt(x, y) {
        // Check distance from other modules
        return !this.modules.some(module => {
            const dx = module.x + module.width/2 - x;
            const dy = module.y + module.height/2 - y;
            return Math.sqrt(dx*dx + dy*dy) < module.width;
        });
    }

    addModule(type, x, y) {
        const costs = {
            habitat: { minerals: 50 },
            oxygenGenerator: { minerals: 40 },
            powerPlant: { minerals: 60 },
            hydroponics: { minerals: 45 },
            scienceLab: { minerals: 80 },
            miningDrill: { minerals: 30 }
        };

        if (this.canAfford(costs[type])) {
            this.deductResources(costs[type]);
            const module = new SpaceModule(x, y, type);
            this.modules.push(module);
            this.engine.addEntity(module);
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

        // Render alerts
        this.alerts.forEach((alert, index) => {
            const alpha = Math.max(0, 1 - (Date.now() - alert.time) / 5000);
            ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
            ctx.fillText(alert.message, 10, this.engine.canvas.height - 20 - (index * 25));
        });

        // Render selected module preview
        if (this.selectedModuleType) {
            const mouseX = this.input.mouseX;
            const mouseY = this.input.mouseY;
            ctx.globalAlpha = 0.5;
            const preview = new SpaceModule(mouseX - 35, mouseY - 35, this.selectedModuleType);
            preview.render(ctx);
            ctx.globalAlpha = 1.0;
        }
    }
}

export default SpaceColonyGame;