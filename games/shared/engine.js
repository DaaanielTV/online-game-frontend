// Core Game Engine Utilities
class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.entities = [];
        this.isRunning = false;
        this.lastTimestamp = 0;
    }

    // Initialize the game engine
    init() {
        this.isRunning = true;
        window.requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    // Main game loop
    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        this.update(deltaTime);
        this.render();

        if (this.isRunning) {
            window.requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
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
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    // Stop game loop
    stop() {
        this.isRunning = false;
    }
}

// Input Manager
class InputManager {
    constructor() {
        this.keys = {};
        this.mouseX = 0;
        this.mouseY = 0;
        this.mouseDown = false;

        window.addEventListener('keydown', (e) => this.keys[e.key] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key] = false);
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
        window.addEventListener('mousedown', () => this.mouseDown = true);
        window.addEventListener('mouseup', () => this.mouseDown = false);
    }

    isKeyPressed(key) {
        return this.keys[key] || false;
    }
}

// Asset Manager
class AssetManager {
    constructor() {
        this.images = new Map();
        this.loadPromises = [];
        this.rootPath = this.getRootPath();
    }

    getRootPath() {
        // Get the root path by checking the current URL
        const pathParts = window.location.pathname.split('/');
        const onlineGameIndex = pathParts.findIndex(part => part === 'online-game');
        if (onlineGameIndex !== -1) {
            return pathParts.slice(0, onlineGameIndex + 1).join('/');
        }
        return '';
    }

    async loadImage(key, relativePath) {
        try {
            // Convert relative path to absolute
            const absolutePath = `${this.rootPath}/${relativePath}`;
            const img = new Image();
            const loadPromise = new Promise((resolve, reject) => {
                img.onload = () => {
                    this.images.set(key, img);
                    resolve(img);
                };
                img.onerror = () => {
                    console.error(`Failed to load image: ${absolutePath}`);
                    reject(new Error(`Failed to load image: ${absolutePath}`));
                };
            });
            img.src = absolutePath;
            this.loadPromises.push(loadPromise);
            return loadPromise;
        } catch (error) {
            console.error(`Error loading image ${key}:`, error);
            throw error;
        }
    }

    getImage(key) {
        return this.images.get(key);
    }

    async waitForLoad() {
        try {
            await Promise.all(this.loadPromises);
        } catch (error) {
            console.error('Error loading assets:', error);
        }
    }
}

// Entity base class
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    update(deltaTime) {
        // Override in child classes
    }

    render(ctx) {
        // Override in child classes
    }

    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }
}

export { GameEngine, InputManager, AssetManager, Entity };