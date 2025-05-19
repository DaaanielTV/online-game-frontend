/**
 * Core Game Engine Module
 * This module provides the fundamental game loop and rendering functionality
 * Handles canvas management, entity updates, and frame timing
 */
class GameEngine {
    /**
     * Initialize the game engine with a canvas
     * @param {string} canvasId - The ID of the canvas element to use
     */
    constructor(canvasId) {
        // Initialize core engine components
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        // Entity management system
        this.entities = [];
        
        // Game loop control variables
        this.isRunning = false;
        this.lastTime = 0;
        this.animationFrameId = null;

        // Set up responsive canvas handling
        window.addEventListener('resize', () => this.resize());
        this.resize();
    }

    /**
     * Initialize and start the game engine
     * Begins the main game loop
     */
    init() {
        this.isRunning = true;
        this.gameLoop();
    }

    /**
     * Main game loop - handles timing and frame updates
     * @param {number} timestamp - Current frame timestamp
     */
    gameLoop(timestamp = 0) {
        if (!this.isRunning) return;

        // Calculate time between frames
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        // Clear canvas and update game state
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.update(deltaTime);
        this.render();

        // Schedule next frame
        this.animationFrameId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    /**
     * Update all game entities
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        for (const entity of this.entities) {
            if (entity.update) {
                entity.update(deltaTime);
            }
        }
    }

    /**
     * Render all game entities
     * Clears the canvas and draws each entity
     */
    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const entity of this.entities) {
            if (entity.render) {
                entity.render(this.ctx);
            }
        }
    }

    /**
     * Add a new entity to the game
     * @param {Entity} entity - The entity to add
     */
    addEntity(entity) {
        this.entities.push(entity);
    }

    /**
     * Remove an entity from the game
     * @param {Entity} entity - The entity to remove
     */
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    /**
     * Handle window resize events
     * Adjusts the canvas size to match the window
     */
    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    /**
     * Stop the game engine
     * Halts the game loop and cancels the animation frame
     */
    stop() {
        this.isRunning = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
}

/**
 * Base Entity Class
 * Represents a rectangular object in the game world
 */
class Entity {
    /**
     * Create an entity
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} width - Width of the entity
     * @param {number} height - Height of the entity
     */
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }

    /**
     * Check collision with another entity
     * @param {Entity} other - The other entity to check against
     * @returns {boolean} True if colliding, false otherwise
     */
    collidesWith(other) {
        return this.x < other.x + other.width &&
               this.x + this.width > other.x &&
               this.y < other.y + other.height &&
               this.y + this.height > other.y;
    }

    /**
     * Default render method
     * Draws the entity as a white rectangle
     * @param {CanvasRenderingContext2D} ctx - The canvas rendering context
     */
    render(ctx) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}

/**
 * Asset Manager
 * Manages loading and accessing game assets like images and sounds
 */
class AssetManager {
    constructor() {
        this.images = new Map();
        this.sounds = new Map();
    }

    /**
     * Load an image asset
     * @param {string} key - The identifier for the image
     * @param {string} src - The source URL of the image
     * @returns {Promise<HTMLImageElement>} Promise resolving to the loaded image element
     */
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

    /**
     * Get a loaded image by key
     * @param {string} key - The identifier for the image
     * @returns {HTMLImageElement} The loaded image element
     */
    getImage(key) {
        return this.images.get(key);
    }

    /**
     * Load a sound asset
     * @param {string} key - The identifier for the sound
     * @param {string} src - The source URL of the sound
     * @returns {Promise<HTMLAudioElement>} Promise resolving to the loaded audio element
     */
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

    /**
     * Get a loaded sound by key
     * @param {string} key - The identifier for the sound
     * @returns {HTMLAudioElement} The loaded audio element
     */
    getSound(key) {
        return this.sounds.get(key);
    }
}

/**
 * Input Manager
 * Handles keyboard and mouse input for the game
 */
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

    /**
     * Check if a key is currently pressed
     * @param {string} code - The key code to check
     * @returns {boolean} True if the key is pressed, false otherwise
     */
    isKeyPressed(code) {
        return this.keys.get(code) || false;
    }

    /**
     * Handle mouse movement events
     * @param {MouseEvent} event - The mouse event
     */
    handleMouseMove(event) {
        const rect = event.target.getBoundingClientRect();
        this.lastMouseX = this.mouseX;
        this.lastMouseY = this.mouseY;
        this.mouseX = event.clientX - rect.left;
        this.mouseY = event.clientY - rect.top;
        this.mouseDeltaX = this.mouseX - this.lastMouseX;
        this.mouseDeltaY = this.mouseY - this.lastMouseY;
    }

    /**
     * Clear input states
     * Resets key and mouse states
     */
    clearKeys() {
        this.keys.clear();
        this.mouseDown = false;
    }

    /**
     * Set the active canvas for input events
     * @param {HTMLCanvasElement} canvas - The canvas element to set as active
     */
    setActiveCanvas(canvas) {
        this.activeCanvas = canvas;
    }

    /**
     * Get the current mouse position
     * @returns {{x: number, y: number}} The mouse position
     */
    getMousePosition() {
        return { x: this.mouseX, y: this.mouseY };
    }

    /**
     * Get the mouse movement delta since last frame
     * @returns {{x: number, y: number}} The mouse delta
     */
    getMouseDelta() {
        return { x: this.mouseDeltaX, y: this.mouseDeltaY };
    }
}
