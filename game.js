// Define ArrowPool class before Game class
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

// Available games for teleportation
const AVAILABLE_GAMES = [
    'action-games/monster-arena',
    'action-games/ninja-runner',
    'action-games/robot-wars',
    'action-games/space-shooter',
    'puzzle-games/color-match',
    'puzzle-games/logic-gates',
    'puzzle-games/time-shifter',
    'puzzle-games/word-scramble',
    'strategy-games/card-commander',
    'strategy-games/city-planner',
    'strategy-games/space-colony',
    'strategy-games/tiny-empire',
    'strategy-games/trade-routes'
];

class Door {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 60;
        this.height = 100;
        this.destination = AVAILABLE_GAMES[Math.floor(Math.random() * AVAILABLE_GAMES.length)];
        this.spawnTime = Date.now();
        this.duration = 15000 + Math.random() * 15000; // 15-30 seconds
    }

    isExpired() {
        return Date.now() - this.spawnTime > this.duration;
    }

    teleport() {
        // Fix the path to be relative to the current location
        const gamePath = `./games/${this.destination}/index.html`;
        window.location.href = gamePath;
    }
}

class Game {
    constructor() {
        // Get canvas and context
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size to window size
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());

        // Initialize player with more health
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            speed: 5,
            health: 200,
            maxHealth: 200,
            stamina: 100,
            score: 0,
            arrows: [],
            lastArrowTime: 0
        };

        // Initialize game state
        this.enemies = [];
        this.walls = [];
        this.doors = [];
        this.lastEnemySpawn = 0;
        this.lastWallSpawn = 0;
        this.lastDoorSpawn = 0;
        this.enemySpawnInterval = 2000;
        this.wallSpawnInterval = 5000;
        this.doorSpawnInterval = 15000;
        this.gameOver = false;

        // Initialize arrow pool
        this.arrowPool = new ArrowPool();

        // Load images
        this.images = {};
        this.loadImages();

        // Setup input handlers
        this.keys = {};
        this.setupInputs();
        this.setupClickHandler();

        // Start game loop
        this.gameLoop();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    loadImages() {
        const images = {
            player: 'enemy/player-avatar.png',
            enemy: 'enemy/tricaluctus(underwater-monster).png',
            background: 'enemy/game-background.png',
            wall: 'enemy/wall.png',
            door: 'enemy/door.png',
            arrow: 'enemy/arrow.png'
        };

        Object.entries(images).forEach(([key, src]) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                console.log(`Loaded image: ${key}`);
            };
            img.onerror = () => {
                console.error(`Failed to load image: ${key}`);
            };
            this.images[key] = img;
        });
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
    }

    setupClickHandler() {
        this.canvas.addEventListener('click', (e) => {
            if (this.gameOver) return;
            
            const now = Date.now();
            if (now - this.player.lastArrowTime >= 500) { // Arrow cooldown
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                
                // Calculate angle
                const dx = mouseX - (this.player.x + 25);
                const dy = mouseY - (this.player.y + 25);
                const angle = Math.atan2(dy, dx);
                
                // Get arrow from pool
                const arrow = this.arrowPool.get();
                arrow.x = this.player.x + 25;
                arrow.y = this.player.y + 25;
                arrow.angle = angle;
                arrow.active = true;
                arrow.speed = 10;
                arrow.distance = 0;
                arrow.maxDistance = 500;
                
                this.player.arrows.push(arrow);
                this.player.lastArrowTime = now;
            }
        });
    }

    spawnEnemy() {
        const now = Date.now();
        if (now - this.lastEnemySpawn >= this.enemySpawnInterval) {
            // Spawn enemy at random position outside the screen
            const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
            let x, y;
            
            switch(side) {
                case 0: // top
                    x = Math.random() * this.canvas.width;
                    y = -50;
                    break;
                case 1: // right
                    x = this.canvas.width + 50;
                    y = Math.random() * this.canvas.height;
                    break;
                case 2: // bottom
                    x = Math.random() * this.canvas.width;
                    y = this.canvas.height + 50;
                    break;
                case 3: // left
                    x = -50;
                    y = Math.random() * this.canvas.height;
                    break;
            }

            this.enemies.push({
                x,
                y,
                speed: 2,
                size: 50
            });
            this.lastEnemySpawn = now;
        }
    }

    updatePlayer() {
        // Movement
        if (this.keys['ArrowUp'] || this.keys['w']) this.player.y -= this.player.speed;
        if (this.keys['ArrowDown'] || this.keys['s']) this.player.y += this.player.speed;
        if (this.keys['ArrowLeft'] || this.keys['a']) this.player.x -= this.player.speed;
        if (this.keys['ArrowRight'] || this.keys['d']) this.player.x += this.player.speed;

        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.canvas.width - 50, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height - 50, this.player.y));
    }

    updateEnemies() {
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

            // Check collision with player
            if (this.checkCollision(enemy, this.player)) {
                this.player.health -= 1;
                if (this.player.health <= 0) {
                    this.gameOver = true;
                }
            }
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + 50 &&
               obj1.x + obj1.size > obj2.x &&
               obj1.y < obj2.y + 50 &&
               obj1.y + obj1.size > obj2.y;
    }

    updateArrows() {
        for (let i = this.player.arrows.length - 1; i >= 0; i--) {
            const arrow = this.player.arrows[i];
            
            // Update position
            arrow.x += Math.cos(arrow.angle) * arrow.speed;
            arrow.y += Math.sin(arrow.angle) * arrow.speed;
            arrow.distance += arrow.speed;
            
            // Check if arrow should be removed
            if (arrow.distance >= arrow.maxDistance) {
                this.arrowPool.release(arrow);
                this.player.arrows.splice(i, 1);
                continue;
            }
            
            // Check enemy collisions
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (this.checkCollision(
                    { x: arrow.x - 5, y: arrow.y - 5, size: 10 },
                    { x: enemy.x, y: enemy.y, size: enemy.size }
                )) {
                    this.enemies.splice(j, 1);
                    this.arrowPool.release(arrow);
                    this.player.arrows.splice(i, 1);
                    this.player.score += 10;
                    break;
                }
            }
        }
    }

    spawnWall() {
        const now = Date.now();
        if (now - this.lastWallSpawn >= this.wallSpawnInterval) {
            const wall = {
                x: Math.random() * (this.canvas.width - 100),
                y: Math.random() * (this.canvas.height - 100),
                width: 100,
                height: 100
            };
            this.walls.push(wall);
            this.lastWallSpawn = now;
        }
    }

    spawnDoor() {
        const now = Date.now();
        if (now - this.lastDoorSpawn >= this.doorSpawnInterval) {
            const door = new Door(
                this,
                Math.random() * (this.canvas.width - 60),
                Math.random() * (this.canvas.height - 100)
            );
            this.doors.push(door);
            this.lastDoorSpawn = now;
        }
    }

    update() {
        if (this.gameOver) {
            document.getElementById('deathScreen').style.display = 'flex';
            document.getElementById('finalScore').textContent = this.player.score;
            return;
        }

        this.updatePlayer();
        this.spawnEnemy();
        this.updateEnemies();
        this.updateArrows();
        this.spawnWall();
        this.spawnDoor();
        
        // Update doors
        for (let i = this.doors.length - 1; i >= 0; i--) {
            const door = this.doors[i];
            if (door.isExpired()) {
                this.doors.splice(i, 1);
                continue;
            }
            
            // Check if player touches door
            if (this.checkCollision(
                { x: door.x, y: door.y, size: door.width },
                { x: this.player.x, y: this.player.y, size: 50 }
            )) {
                door.teleport();
            }
        }
        
        // Update UI
        document.getElementById('health').textContent = `Health: ${this.player.health}`;
        document.getElementById('stamina').textContent = `Stamina: ${this.player.stamina}`;
        document.getElementById('score').textContent = `Score: ${this.player.score}`;
    }

    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw background
        if (this.images.background) {
            this.ctx.drawImage(this.images.background, 0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw walls
        this.walls.forEach(wall => {
            if (this.images.wall) {
                this.ctx.drawImage(this.images.wall, wall.x, wall.y, wall.width, wall.height);
            } else {
                this.ctx.fillStyle = '#666';
                this.ctx.fillRect(wall.x, wall.y, wall.width, wall.height);
            }
        });

        // Draw doors
        this.doors.forEach(door => {
            if (this.images.door) {
                this.ctx.drawImage(this.images.door, door.x, door.y, door.width, door.height);
            } else {
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(door.x, door.y, door.width, door.height);
            }
        });

        // Draw player
        if (this.images.player) {
            this.ctx.drawImage(this.images.player, this.player.x, this.player.y, 50, 50);
        } else {
            this.ctx.fillStyle = 'blue';
            this.ctx.fillRect(this.player.x, this.player.y, 50, 50);
        }

        // Draw arrows
        this.player.arrows.forEach(arrow => {
            if (this.images.arrow) {
                this.ctx.save();
                this.ctx.translate(arrow.x, arrow.y);
                this.ctx.rotate(arrow.angle);
                this.ctx.drawImage(this.images.arrow, -25, -5, 50, 10);
                this.ctx.restore();
            } else {
                this.ctx.save();
                this.ctx.translate(arrow.x, arrow.y);
                this.ctx.rotate(arrow.angle);
                this.ctx.fillStyle = 'yellow';
                this.ctx.fillRect(-10, -2, 20, 4);
                this.ctx.restore();
            }
        });

        // Draw enemies
        this.enemies.forEach(enemy => {
            if (this.images.enemy) {
                this.ctx.drawImage(this.images.enemy, enemy.x, enemy.y, enemy.size, enemy.size);
            } else {
                this.ctx.fillStyle = 'red';
                this.ctx.fillRect(enemy.x, enemy.y, enemy.size, enemy.size);
            }
        });
    }

    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }

    restartGame() {
        this.player.health = 100;
        this.player.stamina = 100;
        this.player.score = 0;
        this.player.x = this.canvas.width / 2;
        this.player.y = this.canvas.height / 2;
        this.enemies = [];
        this.gameOver = false;
        document.getElementById('deathScreen').style.display = 'none';
    }
}

// Initialize game when window loads
window.onload = () => {
    window.game = new Game();
};