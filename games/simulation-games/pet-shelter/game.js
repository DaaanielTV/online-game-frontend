class PetShelter {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.pets = [];
        this.facilities = [];
        this.resources = {
            money: 1000,
            food: 100,
            medicine: 50,
            happiness: 100,
            reputation: 50
        };
        this.costs = {
            kennels: 500,
            playArea: 800,
            medicalBay: 1200,
            groomingStation: 600
        };
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

    setupEventListeners() {
        const canvas = this.engine.canvas;
        canvas.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.handleClick(x, y);
        });
    }

    handleClick(x, y) {
        // Check if clicked on a pet
        for (const pet of this.pets) {
            if (x >= pet.x && x <= pet.x + pet.width &&
                y >= pet.y && y <= pet.y + pet.height) {
                this.selectPet(pet);
                return;
            }
        }

        // Check if clicked on a facility
        for (const facility of this.facilities) {
            if (x >= facility.x && x <= facility.x + facility.width &&
                y >= facility.y && y <= facility.y + facility.height) {
                this.useFacility(facility);
                return;
            }
        }
    }

    renderUI(ctx) {
        // Draw resources
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        ctx.fillText(`Money: $${this.resources.money}`, 20, 30);
        ctx.fillText(`Food: ${this.resources.food}`, 20, 60);
        ctx.fillText(`Medicine: ${this.resources.medicine}`, 20, 90);
        ctx.fillText(`Happiness: ${this.resources.happiness}%`, 20, 120);
        ctx.fillText(`Reputation: ${this.resources.reputation}%`, 20, 150);

        // Draw action buttons
        this.renderActionButtons(ctx);
    }

    renderActionButtons(ctx) {
        const buttonY = this.engine.canvas.height - 60;
        const buttons = [
            { text: 'Feed', color: '#4CAF50', x: 20 },
            { text: 'Play', color: '#2196F3', x: 120 },
            { text: 'Heal', color: '#F44336', x: 220 },
            { text: 'Clean', color: '#9C27B0', x: 320 }
        ];

        buttons.forEach(button => {
            ctx.fillStyle = button.color;
            ctx.fillRect(button.x, buttonY, 80, 40);
            ctx.fillStyle = '#fff';
            ctx.fillText(button.text, button.x + 20, buttonY + 25);
        });
    }

    selectPet(pet) {
        // Handle pet selection
        console.log('Selected pet:', pet);
    }

    useFacility(facility) {
        // Handle facility usage
        console.log('Using facility:', facility);
    }

    update() {
        // Update all pets
        for (const pet of this.pets) {
            pet.update();
        }

        // Update all facilities
        for (const facility of this.facilities) {
            facility.update();
        }

        // Update resources
        this.updateResources();
    }

    updateResources() {
        // Basic resource management
        this.resources.food = Math.max(0, this.resources.food - 0.1);
        this.resources.medicine = Math.max(0, this.resources.medicine - 0.05);
        
        // Calculate overall happiness
        let totalHappiness = this.pets.reduce((sum, pet) => sum + pet.happiness, 0);
        this.resources.happiness = this.pets.length > 0 ? totalHappiness / this.pets.length : 100;
        
        // Update reputation based on happiness
        this.resources.reputation = Math.min(100, Math.max(0, 
            this.resources.reputation + (this.resources.happiness > 75 ? 0.1 : -0.1)
        ));
    }

    gameLoop() {
        this.update();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Don't forget to export the class
export default PetShelter;
