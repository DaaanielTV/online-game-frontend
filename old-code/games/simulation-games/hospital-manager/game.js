import { GameEngine, Entity, InputManager, AssetManager } from '../../shared/engine.js';

class Patient extends Entity {
    constructor(x, y, condition) {
        super(x, y, 40, 40);
        this.condition = condition;
        this.severity = Math.random() * 100;
        this.waitTime = 0;
        this.treated = false;
        this.satisfaction = 100;
    }

    update(deltaTime) {
        if (!this.treated) {
            this.waitTime += deltaTime;
            this.satisfaction = Math.max(0, 100 - (this.waitTime / 1000));
            this.severity += (this.severity > 50 ? 0.1 : 0.05);
        }
    }

    render(ctx) {
        // Draw patient
        ctx.fillStyle = this.getConditionColor();
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Draw status bars
        this.drawStatusBar(ctx, this.x, this.y - 20, this.satisfaction, '#2196F3');
        this.drawStatusBar(ctx, this.x, this.y - 10, 100 - this.severity, '#F44336');
    }

    drawStatusBar(ctx, x, y, value, color) {
        const width = 40;
        const height = 5;
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, (width * Math.max(0, Math.min(value, 100))) / 100, height);
    }

    getConditionColor() {
        if (this.treated) return '#4CAF50';
        return this.severity > 75 ? '#F44336' : 
               this.severity > 50 ? '#FF9800' : 
               this.severity > 25 ? '#FFC107' : '#8BC34A';
    }
}

class Room extends Entity {
    constructor(x, y, type) {
        super(x, y, 80, 80);
        this.type = type;
        this.occupied = false;
        this.patient = null;
        this.staff = null;
        this.treatmentTime = 0;
        this.totalTreatmentTime = this.getTreatmentTime();
    }

    getTreatmentTime() {
        const times = {
            emergency: 30,
            surgery: 60,
            clinic: 20,
            lab: 15,
            pharmacy: 10
        };
        return (times[this.type] || 20) * 1000; // Convert to milliseconds
    }

    update(deltaTime) {
        if (this.occupied && this.staff && this.patient) {
            this.treatmentTime += deltaTime;
            if (this.treatmentTime >= this.totalTreatmentTime) {
                this.completePatient();
            }
        }
    }

    render(ctx) {
        // Draw room
        ctx.fillStyle = this.occupied ? '#455A64' : '#607D8B';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Draw room type
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.fillText(this.type, this.x + 5, this.y + 20);

        // Draw progress bar if treating
        if (this.occupied && this.treatmentTime > 0) {
            const progress = this.treatmentTime / this.totalTreatmentTime;
            ctx.fillStyle = '#4CAF50';
            ctx.fillRect(this.x, this.y + this.height - 5, 
                this.width * progress, 5);
        }
    }

    completePatient() {
        if (this.patient) {
            this.patient.treated = true;
            this.patient = null;
            this.staff = null;
            this.occupied = false;
            this.treatmentTime = 0;
        }
    }
}

class HospitalManager {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.rooms = [];
        this.patients = [];
        this.staff = [];
        this.waitingRoom = [];
        this.resources = {
            money: 10000,
            supplies: 100,
            reputation: 50,
            staff: 5
        };
        this.costs = {
            emergency: 5000,
            surgery: 8000,
            clinic: 3000,
            lab: 4000,
            pharmacy: 2000
        };
        this.selectedRoom = null;
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
                // Draw hospital layout
                this.renderLayout(ctx);
            }
        });

        // Add UI rendering
        this.engine.addEntity({
            render: (ctx) => this.renderUI(ctx)
        });

        // Initialize starting rooms
        this.initializeStartingRooms();

        this.engine.init();
        this.setupEventListeners();
        this.startGameLoop();
    }

    initializeStartingRooms() {
        // Add basic rooms
        this.addRoom(100, 100, 'emergency');
        this.addRoom(200, 100, 'clinic');
        this.addRoom(300, 100, 'pharmacy');
    }

    addRoom(x, y, type) {
        const room = new Room(x, y, type);
        this.rooms.push(room);
        this.engine.addEntity(room);
    }

    renderLayout(ctx) {
        // Draw waiting area
        ctx.fillStyle = '#E0E0E0';
        ctx.fillRect(50, 300, 500, 100);
        ctx.fillStyle = '#000';
        ctx.font = '16px Arial';
        ctx.fillText('Waiting Area', 250, 350);

        // Draw patients in waiting area
        this.waitingRoom.forEach((patient, index) => {
            const x = 60 + (index % 10) * 45;
            const y = 310 + Math.floor(index / 10) * 45;
            patient.x = x;
            patient.y = y;
            patient.render(ctx);
        });
    }

    renderUI(ctx) {
        // Draw resources
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Money: $${this.resources.money}`, 20, 30);
        ctx.fillText(`Supplies: ${this.resources.supplies}`, 200, 30);
        ctx.fillText(`Staff: ${this.resources.staff}`, 350, 30);
        ctx.fillText(`Reputation: ${this.resources.reputation}%`, 500, 30);

        // Draw action buttons
        this.renderActionButtons(ctx);
    }

    renderActionButtons(ctx) {
        const buttonY = this.engine.canvas.height - 60;
        const buttons = [
            { text: 'Add Room', color: '#4CAF50', x: 20 },
            { text: 'Hire Staff', color: '#2196F3', x: 150 },
            { text: 'Buy Supplies', color: '#FF9800', x: 280 },
            { text: 'Train Staff', color: '#9C27B0', x: 410 }
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
        if (x < 130) this.showRoomMenu();
        else if (x < 260) this.hireStaff();
        else if (x < 390) this.buySupplies();
        else if (x < 520) this.trainStaff();
    }

    handleGameAreaClick(x, y) {
        // Check for room clicks
        this.rooms.forEach(room => {
            if (x >= room.x && x <= room.x + room.width &&
                y >= room.y && y <= room.y + room.height) {
                this.selectRoom(room);
            }
        });

        // Check for patient clicks in waiting room
        this.waitingRoom.forEach(patient => {
            if (x >= patient.x && x <= patient.x + patient.width &&
                y >= patient.y && y <= patient.y + patient.height) {
                this.assignPatient(patient);
            }
        });
    }

    update(deltaTime) {
        // Update all rooms
        this.rooms.forEach(room => room.update(deltaTime));

        // Update all patients
        [...this.patients, ...this.waitingRoom].forEach(patient => {
            patient.update(deltaTime);
        });

        // Spawn new patients
        if (Math.random() < 0.02 && this.waitingRoom.length < 20) {
            this.spawnPatient();
        }

        // Update resources
        this.updateResources(deltaTime);
    }

    spawnPatient() {
        const conditions = ['fever', 'injury', 'chronic', 'emergency'];
        const condition = conditions[Math.floor(Math.random() * conditions.length)];
        const patient = new Patient(0, 0, condition);
        this.waitingRoom.push(patient);
        this.engine.addEntity(patient);
    }

    updateResources(deltaTime) {
        // Basic resource management
        const staffCost = this.resources.staff * 0.1;
        this.resources.money -= staffCost * (deltaTime / 1000);
        this.resources.supplies = Math.max(0, this.resources.supplies - 0.01 * (deltaTime / 1000));
    }

    startGameLoop() {
        this.update(16.67); // Approximately 60 FPS
        requestAnimationFrame(() => this.startGameLoop());
    }

    showRoomMenu() {
        // Implementation for showing room purchase menu
        console.log('Showing room menu');
    }

    hireStaff() {
        if (this.resources.money >= 1000) {
            this.resources.staff++;
            this.resources.money -= 1000;
        }
    }

    buySupplies() {
        if (this.resources.money >= 500) {
            this.resources.supplies = Math.min(100, this.resources.supplies + 25);
            this.resources.money -= 500;
        }
    }

    trainStaff() {
        if (this.resources.money >= 2000) {
            // Improve staff efficiency
            this.resources.money -= 2000;
        }
    }
}

// Don't forget to export the class
export default HospitalManager;
