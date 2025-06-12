// Unified Game Combining All Game Types
class AssetManager {
    constructor() {
        this.images = new Map();
        this.loadPromises = [];
        this.rootPath = this.getRootPath();
    }

    getRootPath() {
        const pathParts = window.location.pathname.split('/');
        const onlineGameIndex = pathParts.findIndex(part => part === 'online-game');
        if (onlineGameIndex !== -1) {
            return pathParts.slice(0, onlineGameIndex + 1).join('/');
        }
        return '';
    }

    async loadImage(key, relativePath) {
        try {
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

class ArrowPool {
    constructor() {
        this.pool = [];
    }
    
    get() {
        return this.pool.pop() || { x: 0, y: 0, angle: 0, active: false };
    }
    
    release(arrow) {
        arrow.active = false;
        this.pool.push(arrow);
    }
}

class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.active = true;
    }
}

class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            throw new Error(`Canvas with id '${canvasId}' not found`);
        }
        
        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            throw new Error('Failed to get 2D rendering context');
        }

        this.entities = [];
        this.isRunning = false;
        this.lastTimestamp = 0;
        this.setupEventListeners();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resize());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    init() {
        this.isRunning = true;
        this.resize();
        window.requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTimestamp;
        this.lastTimestamp = timestamp;

        this.update(deltaTime);
        this.render();

        if (this.isRunning) {
            window.requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
    }

    update(deltaTime) {
        for (const entity of this.entities) {
            if (entity.update) {
                entity.update(deltaTime);
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        for (const entity of this.entities) {
            if (entity.render) {
                entity.render(this.ctx);
            }
        }
    }

    addEntity(entity) {
        this.entities.push(entity);
    }

    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            this.entities.splice(index, 1);
        }
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    stop() {
        this.isRunning = false;
    }

    pause() {
        this.isRunning = false;
    }

    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            window.requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
        }
    }
}

class UnifiedGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        
        this.gameState = 'init';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;

        // Player state
        this.player = {
            x: 0,
            y: 0,
            width: 50,
            height: 50,
            speed: 5,
            health: 200,
            maxHealth: 200,
            stamina: 100,
            score: 0,
            arrows: [],
            lastArrowTime: 0,
            inventory: [],
            equipment: {
                weapon: null,
                armor: null,
                accessory: null
            }
        };

        // Game elements
        this.enemies = [];
        this.projectiles = [];
        this.powerups = [];
        this.walls = [];
        this.doors = [];

        // Spawn timers
        this.lastEnemySpawn = 0;
        this.lastWallSpawn = 0;
        this.enemySpawnInterval = 2000;
        this.wallSpawnInterval = 5000;

        // Resources
        this.resources = {
            money: 1000,
            materials: 100,
            energy: 100,
            minerals: 50
        };

        // Game specific elements
        this.buildings = [];
        this.units = [];
        this.modules = [];
        this.quests = [];

        // Initialize game systems
        this.arrowPool = new ArrowPool();
        this.setupGame();
    }

    async setupGame() {
        try {
            await this.loadAssets();
            this.setupInputHandlers();
            this.engine.init();
            
            // Initialize player's position
            this.player.x = this.engine.canvas.width / 2;
            this.player.y = this.engine.canvas.height / 2;
        } catch (error) {
            console.error('Failed to setup game:', error);
        }
    }

    async loadAssets() {
        try {
            await this.assets.loadImage('player', 'enemy/player-avatar.png');
            await this.assets.loadImage('enemy', 'enemy/tricaluctus(underwater-monster).png');
            await this.assets.loadImage('background', 'enemy/game-background.png');
            await this.assets.loadImage('wall', 'enemy/wall.png');
            await this.assets.loadImage('door', 'enemy/door.png');
            await this.assets.loadImage('arrow', 'enemy/arrow.png');
        } catch (error) {
            console.warn('Failed to load some assets:', error);
        }
    }

    setupInputHandlers() {
        window.addEventListener('keydown', (e) => {
            this.input.keys[e.key] = true;
            this.handleKeyPress(e.key);
        });
        
        window.addEventListener('keyup', (e) => {
            this.input.keys[e.key] = false;
        });

        this.engine.canvas.addEventListener('click', (e) => {
            this.handleClick(e);
        });
    }

    handleKeyPress(key) {
        if (key === 'Escape') {
            this.togglePause();
        }
    }

    handleClick(e) {
        if (this.gameState === 'playing') {
            const rect = this.engine.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            this.shoot(x, y);
        }
    }

    update(deltaTime) {
        if (this.gameState !== 'playing') return;

        this.updatePlayer(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updatePowerups(deltaTime);
        this.spawnEntities(deltaTime);
        this.checkCollisions();
        this.checkGameConditions();
    }

    updatePlayer(deltaTime) {
        // Handle movement
        if (this.input.isKeyPressed('ArrowUp') || this.input.isKeyPressed('w')) {
            this.player.y -= this.player.speed;
        }
        if (this.input.isKeyPressed('ArrowDown') || this.input.isKeyPressed('s')) {
            this.player.y += this.player.speed;
        }
        if (this.input.isKeyPressed('ArrowLeft') || this.input.isKeyPressed('a')) {
            this.player.x -= this.player.speed;
        }
        if (this.input.isKeyPressed('ArrowRight') || this.input.isKeyPressed('d')) {
            this.player.x += this.player.speed;
        }

        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.engine.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.engine.canvas.height - this.player.height, this.player.y));

        // Regenerate stamina
        if (this.player.stamina < 100) {
            this.player.stamina = Math.min(100, this.player.stamina + 0.1);
        }
    }

    updateEnemies(deltaTime) {
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // Move towards player
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
        }
    }

    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            proj.x += proj.dx * proj.speed;
            proj.y += proj.dy * proj.speed;

            // Remove projectiles that are off screen
            if (proj.x < 0 || proj.x > this.engine.canvas.width ||
                proj.y < 0 || proj.y > this.engine.canvas.height) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    updatePowerups(deltaTime) {
        // Update powerup effects and durations
    }

    spawnEntities(deltaTime) {
        this.spawnEnemies(deltaTime);
        this.spawnWalls(deltaTime);
        this.spawnPowerups(deltaTime);
    }

    spawnEnemies(deltaTime) {
        const now = Date.now();
        if (now - this.lastEnemySpawn >= this.enemySpawnInterval) {
            const side = Math.floor(Math.random() * 4);
            let x, y;
            
            switch(side) {
                case 0: // top
                    x = Math.random() * this.engine.canvas.width;
                    y = -50;
                    break;
                case 1: // right
                    x = this.engine.canvas.width + 50;
                    y = Math.random() * this.engine.canvas.height;
                    break;
                case 2: // bottom
                    x = Math.random() * this.engine.canvas.width;
                    y = this.engine.canvas.height + 50;
                    break;
                case 3: // left
                    x = -50;
                    y = Math.random() * this.engine.canvas.height;
                    break;
            }

            this.enemies.push({
                x,
                y,
                width: 50,
                height: 50,
                speed: 2,
                health: 100
            });

            this.lastEnemySpawn = now;
        }
    }

    spawnWalls(deltaTime) {
        const now = Date.now();
        if (now - this.lastWallSpawn >= this.wallSpawnInterval) {
            this.walls.push({
                x: Math.random() * (this.engine.canvas.width - 100),
                y: Math.random() * (this.engine.canvas.height - 100),
                width: 100,
                height: 100
            });
            this.lastWallSpawn = now;
        }
    }

    spawnPowerups(deltaTime) {
        // Spawn random powerups occasionally
    }

    checkCollisions() {
        // Player vs Enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (this.checkCollision(this.player, enemy)) {
                this.player.health -= 10;
                this.enemies.splice(i, 1);
                
                if (this.player.health <= 0) {
                    this.gameOver();
                }
            }
        }

        // Projectiles vs Enemies
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const proj = this.projectiles[i];
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.checkCollision(proj, enemy)) {
                    this.projectiles.splice(i, 1);
                    this.enemies.splice(j, 1);
                    this.score += 10;
                    break;
                }
            }
        }

        // Player vs Powerups
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const powerup = this.powerups[i];
            if (this.checkCollision(this.player, powerup)) {
                this.activatePowerup(powerup.type);
                this.powerups.splice(i, 1);
            }
        }

        // Player vs Walls
        for (const wall of this.walls) {
            if (this.checkCollision(this.player, wall)) {
                // Push player back
                const dx = this.player.x - wall.x;
                const dy = this.player.y - wall.y;
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.player.x += dx > 0 ? 5 : -5;
                } else {
                    this.player.y += dy > 0 ? 5 : -5;
                }
            }
        }
    }

    checkGameConditions() {
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    shoot(targetX, targetY) {
        const now = Date.now();
        if (now - this.player.lastArrowTime >= 300) { // Shooting cooldown
            const dx = targetX - (this.player.x + this.player.width/2);
            const dy = targetY - (this.player.y + this.player.height/2);
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            this.projectiles.push({
                x: this.player.x + this.player.width/2,
                y: this.player.y + this.player.height/2,
                width: 10,
                height: 10,
                dx: dx / distance,
                dy: dy / distance,
                speed: 10
            });

            this.player.lastArrowTime = now;
        }
    }

    activatePowerup(type) {
        switch (type) {
            case 'health':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + 50);
                break;
            case 'speed':
                this.player.speed *= 1.5;
                setTimeout(() => this.player.speed /= 1.5, 5000);
                break;
            case 'shield':
                // Implement shield logic
                break;
        }
    }

    render() {
        const ctx = this.engine.ctx;

        // Clear canvas
        ctx.clearRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);

        // Draw background
        const bgImage = this.assets.getImage('background');
        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, this.engine.canvas.width, this.engine.canvas.height);
        }

        // Draw walls
        const wallImage = this.assets.getImage('wall');
        this.walls.forEach(wall => {
            if (wallImage) {
                ctx.drawImage(wallImage, wall.x, wall.y, wall.width, wall.height);
            } else {
                ctx.fillStyle = '#666';
                ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            }
        });

        // Draw enemies
        const enemyImage = this.assets.getImage('enemy');
        this.enemies.forEach(enemy => {
            if (enemyImage) {
                ctx.drawImage(enemyImage, enemy.x, enemy.y, enemy.width, enemy.height);
            } else {
                ctx.fillStyle = 'red';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        });

        // Draw projectiles
        ctx.fillStyle = 'yellow';
        this.projectiles.forEach(proj => {
            ctx.fillRect(proj.x - 5, proj.y - 5, 10, 10);
        });

        // Draw player
        const playerImage = this.assets.getImage('player');
        if (playerImage) {
            ctx.drawImage(playerImage, this.player.x, this.player.y, this.player.width, this.player.height);
        } else {
            ctx.fillStyle = 'blue';
            ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }

        // Draw UI
        this.renderUI(ctx);
    }

    renderUI(ctx) {
        // Health bar
        ctx.fillStyle = 'red';
        ctx.fillRect(10, 10, 200, 20);
        ctx.fillStyle = 'green';
        const healthPercent = this.player.health / this.player.maxHealth;
        ctx.fillRect(10, 10, 200 * healthPercent, 20);

        // Stamina bar
        ctx.fillStyle = 'gray';
        ctx.fillRect(10, 40, 200, 10);
        ctx.fillStyle = 'yellow';
        ctx.fillRect(10, 40, 200 * (this.player.stamina / 100), 10);

        // Score
        ctx.fillStyle = 'white';
        ctx.font = '24px Arial';
        ctx.fillText(`Score: ${this.score}`, 10, 80);
        ctx.fillText(`High Score: ${this.highScore}`, 10, 110);

        // Game state messages
        if (this.gameState === 'paused') {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', this.engine.canvas.width/2, this.engine.canvas.height/2);
            ctx.font = '24px Arial';
            ctx.fillText('Press ESC to resume', this.engine.canvas.width/2, this.engine.canvas.height/2 + 40);
        }
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.engine.stop();
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.engine.resume();
        }
    }

    gameOver() {
        this.gameState = 'gameover';
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }
        this.engine.stop();
    }

    restart() {
        this.player.health = this.player.maxHealth;
        this.player.stamina = 100;
        this.player.x = this.engine.canvas.width / 2;
        this.player.y = this.engine.canvas.height / 2;
        this.score = 0;
        this.enemies = [];
        this.projectiles = [];
        this.powerups = [];
        this.gameState = 'playing';
        this.engine.resume();
    }
}

// Create game instance when window loads
window.addEventListener('load', () => {
    const game = new UnifiedGame('gameCanvas');
});
