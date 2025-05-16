class RestaurantRush {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.customers = [];
        this.stations = [];
        this.orders = [];
        this.resources = {
            money: 5000,
            ingredients: 100,
            reputation: 50,
            satisfaction: 100
        };
        this.costs = {
            grill: 1000,
            prep: 800,
            counter: 600,
            register: 500,
            storage: 700
        };
        this.tables = [];
        this.staff = [];
        this.menu = [
            { name: 'Burger', price: 10, time: 60, ingredients: 2 },
            { name: 'Pizza', price: 15, time: 90, ingredients: 3 },
            { name: 'Salad', price: 8, time: 30, ingredients: 2 },
            { name: 'Pasta', price: 12, time: 45, ingredients: 2 }
        ];
        this.selectedStation = null;
        this.setupGame();
    }

    async setupGame() {
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
                // Draw restaurant layout
                this.renderLayout(ctx);
            }
        });

        // Add UI rendering
        this.engine.addEntity({
            render: (ctx) => this.renderUI(ctx)
        });

        // Initialize tables
        this.initializeTables();

        // Initialize starting stations
        this.initializeStartingStations();

        this.engine.init();
        this.setupEventListeners();
        this.startGameLoop();
    }

    initializeTables() {
        // Add some initial tables
        for (let i = 0; i < 4; i++) {
            this.tables.push({
                x: 100 + i * 150,
                y: 200,
                width: 80,
                height: 80,
                occupied: false,
                customer: null,
                order: null
            });
        }
    }

    initializeStartingStations() {
        // Add basic stations
        this.stations.push({
            type: 'register',
            x: 50,
            y: 50,
            width: 60,
            height: 60,
            inUse: false
        });

        this.stations.push({
            type: 'grill',
            x: 500,
            y: 50,
            width: 60,
            height: 60,
            inUse: false,
            currentOrder: null
        });
    }

    renderLayout(ctx) {
        // Draw tables
        this.tables.forEach(table => {
            ctx.fillStyle = table.occupied ? '#8B4513' : '#A0522D';
            ctx.fillRect(table.x, table.y, table.width, table.height);
        });

        // Draw stations
        this.stations.forEach(station => {
            ctx.fillStyle = station.inUse ? '#666' : '#888';
            ctx.fillRect(station.x, station.y, station.width, station.height);
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(station.type, station.x + 5, station.y + 35);
        });
    }

    renderUI(ctx) {
        // Draw resources
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Money: $${this.resources.money}`, 20, 30);
        ctx.fillText(`Ingredients: ${this.resources.ingredients}`, 200, 30);
        ctx.fillText(`Reputation: ${this.resources.reputation}%`, 400, 30);
        
        // Draw active orders
        this.renderOrders(ctx);
        
        // Draw action buttons
        this.renderActionButtons(ctx);
    }

    renderOrders(ctx) {
        ctx.font = '16px Arial';
        this.orders.forEach((order, index) => {
            const y = 60 + index * 25;
            ctx.fillStyle = order.inProgress ? '#FFD700' : '#fff';
            ctx.fillText(`${order.table}: ${order.item} (${Math.floor(order.progress)}%)`, 20, y);
        });
    }

    renderActionButtons(ctx) {
        const buttonY = this.engine.canvas.height - 60;
        const buttons = [
            { text: 'Hire Staff', color: '#4CAF50', x: 20 },
            { text: 'Buy Ingredients', color: '#2196F3', x: 150 },
            { text: 'Add Station', color: '#FF9800', x: 300 },
            { text: 'Upgrade', color: '#9C27B0', x: 450 }
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
        if (x < 130) this.hireStaff();
        else if (x < 260) this.buyIngredients();
        else if (x < 410) this.showStationMenu();
        else if (x < 560) this.showUpgradeMenu();
    }

    handleGameAreaClick(x, y) {
        // Check for station clicks
        this.stations.forEach(station => {
            if (x >= station.x && x <= station.x + station.width &&
                y >= station.y && y <= station.y + station.height) {
                this.selectStation(station);
            }
        });

        // Check for table clicks
        this.tables.forEach(table => {
            if (x >= table.x && x <= table.x + table.width &&
                y >= table.y && y <= table.y + table.height) {
                this.handleTableClick(table);
            }
        });
    }

    update() {
        // Update orders
        this.orders.forEach(order => {
            if (order.inProgress) {
                order.progress += 0.5;
                if (order.progress >= 100) {
                    this.completeOrder(order);
                }
            }
        });

        // Spawn customers
        if (Math.random() < 0.02 && this.customers.length < this.tables.length) {
            this.spawnCustomer();
        }

        // Update customer satisfaction
        this.customers.forEach(customer => {
            customer.patience -= 0.1;
            if (customer.patience <= 0) {
                this.handleUnhappyCustomer(customer);
            }
        });

        // Update resources
        this.updateResources();
    }

    startGameLoop() {
        this.update();
        requestAnimationFrame(() => this.startGameLoop());
    }
}

// Don't forget to export the class
export default RestaurantRush;
