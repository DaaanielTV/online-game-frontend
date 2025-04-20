import { GameEngine, Entity, InputManager } from '../../shared/engine.js';

class City extends Entity {
    constructor(x, y, name, resources) {
        super(x, y, 60, 60);
        this.name = name;
        this.resources = resources;
        this.tradingPartners = new Set();
        this.prices = this.generatePrices();
        this.demand = this.generateDemand();
    }

    generatePrices() {
        const basePrice = {
            spices: 100,
            silk: 150,
            gold: 200,
            tea: 80,
            porcelain: 120,
            ivory: 180
        };
        
        // Adjust prices based on available resources
        return Object.entries(basePrice).reduce((prices, [resource, price]) => {
            prices[resource] = this.resources.includes(resource) ? 
                price * 0.7 : price * 1.3;
            return prices;
        }, {});
    }

    generateDemand() {
        return Object.keys(this.prices).reduce((demand, resource) => {
            demand[resource] = this.resources.includes(resource) ? 
                0.5 : Math.random() + 0.5;
            return demand;
        }, {});
    }

    updatePrices() {
        Object.keys(this.prices).forEach(resource => {
            // Adjust prices based on supply and demand
            const demandFactor = this.demand[resource];
            this.prices[resource] *= 0.95 + (demandFactor * 0.1);
        });
    }

    render(ctx) {
        // Draw city
        ctx.fillStyle = '#34495e';
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(this.x + 30, this.y + 30, 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw city name
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + 30, this.y + 35);
    }
}

class TradeRoute extends Entity {
    constructor(cityA, cityB) {
        super(0, 0, 0, 0);
        this.cityA = cityA;
        this.cityB = cityB;
        this.established = false;
        this.efficiency = 1.0;
        this.tradedResources = new Set();
    }

    calculateDistance() {
        const dx = this.cityA.x - this.cityB.x;
        const dy = this.cityA.y - this.cityB.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    render(ctx) {
        const startX = this.cityA.x + 30;
        const startY = this.cityA.y + 30;
        const endX = this.cityB.x + 30;
        const endY = this.cityB.y + 30;

        // Draw trade route line
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = this.established ? '#27ae60' : '#bdc3c7';
        ctx.lineWidth = this.established ? 3 : 1;
        ctx.stroke();

        // Draw traded resources if route is established
        if (this.established && this.tradedResources.size > 0) {
            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;
            
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            Array.from(this.tradedResources).forEach((resource, index) => {
                ctx.fillText(resource, midX, midY - 10 + (index * 15));
            });
        }
    }
}

class TradeRoutesGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.setup();
    }

    async setup() {
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
            }
        });

        this.setupGame();
    }

    setupGame() {
        this.engine.init();
        this.createInitialCities();
        this.setupEventListeners();
        
        // Add game state rendering
        this.engine.addEntity({
            render: (ctx) => this.renderUI(ctx)
        });

        this.lastUpdateTime = Date.now();
        this.gameLoop();
    }

    createInitialCities() {
        const cityData = [
            { name: 'Constantinople', resources: ['silk', 'spices', 'gold'] },
            { name: 'Venice', resources: ['porcelain', 'gold'] },
            { name: 'Cairo', resources: ['spices', 'ivory'] },
            { name: 'Beijing', resources: ['silk', 'tea', 'porcelain'] },
            { name: 'Baghdad', resources: ['spices', 'silk'] },
            { name: 'Malacca', resources: ['spices', 'gold', 'ivory'] }
        ];

        cityData.forEach(({ name, resources }) => {
            const x = 100 + Math.random() * (this.engine.canvas.width - 200);
            const y = 100 + Math.random() * (this.engine.canvas.height - 200);
            this.cities.push(new City(x, y, name, resources));
        });
    }

    setupEventListeners() {
        const canvas = this.engine.canvas;
        
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if a city was clicked
            const clickedCity = this.findCityAt(x, y);
            if (clickedCity) {
                if (this.selectedCity && this.selectedCity !== clickedCity) {
                    this.establishTradeRoute(this.selectedCity, clickedCity);
                    this.selectedCity = null;
                } else {
                    this.selectedCity = clickedCity;
                }
            }
        });

        // Add end turn button
        const endTurnBtn = document.createElement('button');
        endTurnBtn.textContent = 'End Turn';
        endTurnBtn.onclick = () => this.endTurn();
        document.body.appendChild(endTurnBtn);
    }

    findCityAt(x, y) {
        return this.cities.find(city => {
            const dx = x - (city.x + 30);
            const dy = y - (city.y + 30);
            return Math.sqrt(dx * dx + dy * dy) <= 30;
        });
    }

    establishTradeRoute(cityA, cityB) {
        // Check if route already exists
        if (this.routes.some(route => 
            (route.cityA === cityA && route.cityB === cityB) ||
            (route.cityA === cityB && route.cityB === cityA))) {
            return;
        }

        const route = new TradeRoute(cityA, cityB);
        const distance = route.calculateDistance();
        const cost = Math.floor(distance * 2);

        if (this.money >= cost) {
            this.money -= cost;
            route.established = true;
            cityA.tradingPartners.add(cityB);
            cityB.tradingPartners.add(cityA);
            
            // Find tradeable resources
            const cityAResources = new Set(cityA.resources);
            const cityBResources = new Set(cityB.resources);
            cityA.resources.forEach(resource => {
                if (!cityBResources.has(resource) && cityB.demand[resource] > 0.8) {
                    route.tradedResources.add(resource);
                }
            });
            cityB.resources.forEach(resource => {
                if (!cityAResources.has(resource) && cityA.demand[resource] > 0.8) {
                    route.tradedResources.add(resource);
                }
            });

            this.routes.push(route);
            this.engine.addEntity(route);
        }
    }

    updateTrade() {
        this.routes.forEach(route => {
            if (route.established) {
                route.tradedResources.forEach(resource => {
                    const profit = Math.floor(
                        Math.abs(route.cityA.prices[resource] - 
                                route.cityB.prices[resource]) * 
                        route.efficiency
                    );
                    this.money += profit;
                    this.reputation += profit > 50 ? 1 : 0;
                });
            }
        });

        // Update prices and demand
        this.cities.forEach(city => {
            city.updatePrices();
            // Random events
            if (Math.random() < 0.1) {
                const resource = city.resources[
                    Math.floor(Math.random() * city.resources.length)
                ];
                city.demand[resource] = Math.min(2, city.demand[resource] * 1.5);
            }
        });
    }

    endTurn() {
        this.turn++;
        this.updateTrade();
        
        // Random events
        if (Math.random() < 0.2) {
            const route = this.routes[Math.floor(Math.random() * this.routes.length)];
            if (route) {
                route.efficiency = Math.max(0.5, route.efficiency - 0.1);
            }
        }
    }

    renderUI(ctx) {
        // Draw routes first
        this.routes.forEach(route => route.render(ctx));
        
        // Draw cities
        this.cities.forEach(city => {
            city.render(ctx);
            if (city === this.selectedCity) {
                // Highlight selected city
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(city.x + 30, city.y + 30, 35, 0, Math.PI * 2);
                ctx.stroke();

                // Show city details
                this.renderCityDetails(ctx, city);
            }
        });

        // Draw game info
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Money: ${this.money}`, 20, 30);
        ctx.fillText(`Reputation: ${this.reputation}`, 20, 60);
        ctx.fillText(`Turn: ${this.turn}`, 20, 90);
    }

    renderCityDetails(ctx, city) {
        const x = city.x + 70;
        const y = city.y;
        
        ctx.fillStyle = 'rgba(44, 62, 80, 0.9)';
        ctx.fillRect(x, y, 200, 160);
        
        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        ctx.textAlign = 'left';
        
        // Resources
        ctx.fillText('Resources:', x + 10, y + 25);
        city.resources.forEach((resource, index) => {
            ctx.fillText(`${resource}: ${Math.floor(city.prices[resource])}`, 
                x + 20, y + 50 + (index * 20));
        });

        // Trading partners
        ctx.fillText(`Trading Partners: ${city.tradingPartners.size}`, 
            x + 10, y + 140);
    }

    gameLoop() {
        this.engine.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

export default TradeRoutesGame;