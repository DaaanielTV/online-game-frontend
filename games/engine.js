/**
 * Core Game Engine Module
 * Provides centralized game loop and rendering functionality for all games
 * Handles canvas management, entity updates, and timing
 */
class GameEngine {
    /**
     * Initialize the game engine with a canvas
     * @param {string} canvasId - The ID of the canvas element to use
     * @throws {Error} If canvas element is not found
     */
    constructor(canvasId) {
        // Initialize and validate core components
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id '${canvasId}' not found`);
        }
        
        // Set up rendering context
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Failed to get 2D rendering context');
        }

        // Entity management system
        this.entities = [];
        
        // Game state control
        this.isRunning = false;
        this.lastTimestamp = 0;
        this.frameId = null;

        // Set up event listeners
        this.setupEventListeners();
        
        // Ensure canvas is properly displayed
        this.canvas.style.display = 'block';
    }

    /**
     * Set up event listeners for window and canvas events
     * @private
     */
    setupEventListeners() {
        // Handle window resize
        window.addEventListener('resize', () => this.resize());
        
        // Handle visibility change to pause/resume
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    // Initialize the game engine
    init() {
        this.isRunning = true;
        // Initial resize
        this.resize();
        // Start the game loop
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
        // Update canvas dimensions
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    // Stop game loop
    stop() {
        this.isRunning = false;
    }

    // Pause the game
    pause() {
        this.isRunning = false;
    }

    // Resume the game
    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            window.requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
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