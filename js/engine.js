// Core Game Engine
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.entities = [];
        this.isRunning = false;
        this.lastTime = 0;

        // Set up resize handling
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    // Initialize the game engine
    init() {
        this.isRunning = true;
        this.gameLoop();
    }    // Main game loop
    gameLoop(timestamp = 0) {
        if (!this.isRunning) return;

        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Clear canvas before each frame
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update and render all entities
        this.update(deltaTime);
        this.render();

        // Schedule next frame
        this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    // Update game state
    update(deltaTime) {
        for (const entity of this.entities) {
            if (entity.update) {
                entity.update(deltaTime);
            }
        }
    }

    // Render game state
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const entity of this.entities) {
            if (entity.render) {
                entity.render(this.ctx);
            }
        }
    }

    // Add game entity
    addEntity(entity) {
        this.entities.push(entity);
    }

    // Remove game entity
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    // Handle window resize
    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }    // Stop game loop
    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}

// Base Entity Class
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    // Check collision with another entity
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    // Default render method
    render(ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

// Asset Manager
class AssetManager {
    constructor() {
        this.images = new Map();
        this.sounds = new Map();
    }

    // Load an image
    async loadImage(key, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(key, img);
                resolve(img);
            };
            img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    // Get a loaded image
    getImage(key) {
        return this.images.get(key);
    }

    // Load a sound
    async loadSound(key, src) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.sounds.set(key, audio);
                resolve(audio);
            };
            audio.onerror = () => reject(new Error(`Failed to load sound: ${src}`));
            audio.src = src;
        });
    }

    // Get a loaded sound
    getSound(key) {
        return this.sounds.get(key);
    }
}

// Input Manager
class InputManager {
    constructor() {
        this.keys = new Map();
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.mouseDeltaX = 0;
        this.mouseDeltaY = 0;
        this.activeCanvas = null;

        // Key events
        window.addEventListener('keydown', (e) => {
            if (!e.repeat) this.keys.set(e.code, true);
        });
        window.addEventListener('keyup', (e) => this.keys.set(e.code, false));

        // Mouse events
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('mousedown', (e) => {
            this.mouseDown = true;
            this.handleMouseMove(e);
        });
        window.addEventListener('mouseup', () => this.mouseDown = false);
        
        // Handle focus/blur
        window.addEventListener('blur', () => this.clearKeys());
        window.addEventListener('focus', () => this.clearKeys());
    }

    isKeyPressed(code) {
        return this.keys.get(code) || false;
    }

    handleMouseMove(event) {
        const rect = event.target.getBoundingClientRect();
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
        this.mouseDeltaX = this.mouseX - this.lastMouseX;
        this.mouseDeltaY = this.mouseY - this.lastMouseY;
    }

    clearKeys() {
        this.keys.clear();
        this.mouseDown = false;
    }

    setActiveCanvas(canvas) {
        this.activeCanvas = canvas;
    }

    getMousePosition() {
        return { x: this.mouseX, y: this.mouseY };
    }

    getMouseDelta() {
        return { x: this.mouseDeltaX, y: this.mouseDeltaY };
    }
}
