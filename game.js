class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupCanvas();

        // Game state
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            speed: 3, // Reduced from 5
            health: 5000,
            maxHealth: 5000,
            stamina: 100,
            score: 0,
            upgrades: {
                speed: 1,
                damage: 1
            },
            coins: 0
        };

        this.isGameOver = false;
        this.showShop = false;

        // Shop prices
        this.shopPrices = {
            speed: 100,
            damage: 150
        };

        // Entity system
        this.entities = [];
        this.entityTypes = ['elephant', 'monster'];
        this.lastSpawnTime = 0;
        this.spawnInterval = 5000; // 5 seconds

        // Add arrows array and trader spawn time
        this.arrows = [];
        this.lastTraderSpawn = 0;
        this.traderSpawnInterval = 30000; // 30 seconds

        // Add entity arrows array and shooting cooldown
        this.entityArrows = [];
        this.entityShootCooldown = 2000; // 2 seconds between shots

        // Add walls array
        this.walls = [];

        // Load images
        this.images = {};
        this.loadImages({
            background: 'enemy/game-background.png',
            player: 'enemy/player-avatar.png',
            elephant: 'enemy/elephant.png',
            trader: 'enemy/the-trader.png',
            monster: 'enemy/tricaluctus(underwater-monster).png',
            arrow: 'enemy/arrow.png',
            wall: 'enemy/wall.png'
        });

        // Spawn initial walls
        this.spawnWalls();

        // Input handling
        this.keys = {};
        this.setupInputs();
        this.setupClickHandler();
        this.setupShootingControls();

        // Database connection
        this.setupDatabase();

        // Setup UI handlers
        this.setupShopButton();

        // Start game loop
        this.lastTime = 0;
        this.gameLoop();
    }

    setupCanvas() {
        // Set canvas size to match window size
        const updateCanvasSize = () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        };
        updateCanvasSize();
        window.addEventListener('resize', updateCanvasSize);
    }

    loadImages(sources) {
        let loadedImages = 0;
        const totalImages = Object.keys(sources).length;

        for (const [key, src] of Object.entries(sources)) {
            const img = new Image();
            img.onload = () => {
                loadedImages++;
                if (loadedImages === totalImages) {
                    this.start();
                }
            };
            img.src = src;
            this.images[key] = img;
        }
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
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.entities.forEach((entity, index) => {
                if (this.isClickedOnEntity(x, y, entity)) {
                    entity.health -= 20;
                    if (entity.health <= 0) {
                        this.entities.splice(index, 1);
                        this.player.score += 10;
                        this.saveGameState();
                    }
                }
            });
        });
    }

    setupShopButton() {
        const shopBtn = document.getElementById('shopButton');
        shopBtn.addEventListener('click', () => {
            this.showShop = !this.showShop;
            document.getElementById('shop').style.display = this.showShop ? 'block' : 'none';
        });

        // Setup upgrade buttons
        document.getElementById('upgradeSpeed').addEventListener('click', () => this.upgrade('speed'));
        document.getElementById('upgradeDamage').addEventListener('click', () => this.upgrade('damage'));
    }

    upgrade(type) {
        const price = this.shopPrices[type];
        if (this.player.coins >= price) {
            this.player.coins -= price;
            this.player.upgrades[type]++;
            this.shopPrices[type] = Math.floor(price * 1.5); // Increase price for next upgrade
            
            if (type === 'speed') {
                this.player.speed = 5 + this.player.upgrades.speed;
            }
            
            this.updateShopUI();
            this.saveGameState();
        }
    }

    updateShopUI() {
        document.getElementById('speedPrice').textContent = this.shopPrices.speed;
        document.getElementById('damagePrice').textContent = this.shopPrices.damage;
        document.getElementById('currentCoins').textContent = this.player.coins;
        document.getElementById('currentSpeed').textContent = this.player.upgrades.speed;
        document.getElementById('currentDamage').textContent = this.player.upgrades.damage;
    }

    setupShootingControls() {
        window.addEventListener('click', (e) => {
            if (this.isGameOver || this.showShop) return;

            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            
            // Check if clicked on trader
            const traderIndex = this.entities.findIndex(entity => 
                entity.type === 'trader' && this.isClickedOnEntity(clickX, clickY, entity)
            );

            if (traderIndex !== -1) {
                // Remove half of all non-trader entities
                const nonTraderEntities = this.entities.filter(e => e.type !== 'trader');
                const removeCount = Math.ceil(nonTraderEntities.length * 0.5);
                this.entities = this.entities.filter(e => e.type === 'trader');
                this.entities.push(...nonTraderEntities.slice(removeCount));
                // Remove the trader after use
                this.entities = this.entities.filter(e => e !== this.entities[traderIndex]);
                return;
            }

            // Create new arrow
            const angle = Math.atan2(clickY - this.player.y, clickX - this.player.x);
            this.arrows.push({
                x: this.player.x + 25,
                y: this.player.y + 25,
                angle: angle,
                speed: 10,
                damage: 25 * this.player.upgrades.damage,
                width: 40,  // Bigger arrows
                height: 10
            });
        });
    }

    isClickedOnEntity(x, y, entity) {
        return x >= entity.x && 
               x <= entity.x + 50 && 
               y >= entity.y && 
               y <= entity.y + 50;
    }

    setupDatabase() {
        // Initialize IndexedDB
        const request = indexedDB.open('gameDB', 1);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('gameState')) {
                db.createObjectStore('gameState', { keyPath: 'id' });
            }
        };

        request.onsuccess = (event) => {
            this.db = event.target.result;
            this.loadGameState();
        };
    }

    saveGameState() {
        if (!this.db) return;

        const transaction = this.db.transaction(['gameState'], 'readwrite');
        const store = transaction.objectStore('gameState');
        const gameState = {
            id: 1,
            player: this.player,
            score: this.player.score,
            timestamp: Date.now()
        };

        store.put(gameState);
    }

    loadGameState() {
        if (!this.db) return;

        const transaction = this.db.transaction(['gameState'], 'readonly');
        const store = transaction.objectStore('gameState');
        const request = store.get(1);

        request.onsuccess = (event) => {
            if (request.result) {
                this.player = { ...this.player, ...request.result.player };
            }
        };
    }

    spawnWalls() {
        const numberOfWalls = 5 + Math.floor(Math.random() * 6); // Random number between 5 and 10
        
        for (let i = 0; i < numberOfWalls; i++) {
            const wall = {
                x: Math.random() * (this.canvas.width - 100), // Wall width is 100
                y: Math.random() * (this.canvas.height - 100), // Wall height is 100
                width: 100,
                height: 100
            };
            
            // Check if wall overlaps with player spawn
            if (!this.checkCollision(wall, {
                x: this.canvas.width / 2 - 100,
                y: this.canvas.height / 2 - 100,
                width: 200,
                height: 200
            })) {
                this.walls.push(wall);
            }
        }
    }

    updatePlayer() {
        const newX = this.player.x;
        const newY = this.player.y;

        // Store previous position
        const prevX = this.player.x;
        const prevY = this.player.y;

        // Update position based on input
        if (this.keys['ArrowUp'] || this.keys['w']) this.player.y -= this.player.speed;
        if (this.keys['ArrowDown'] || this.keys['s']) this.player.y += this.player.speed;
        if (this.keys['ArrowLeft'] || this.keys['a']) this.player.x -= this.player.speed;
        if (this.keys['ArrowRight'] || this.keys['d']) this.player.x += this.player.speed;

        // Check wall collisions
        const playerRect = {
            x: this.player.x,
            y: this.player.y,
            width: 50,
            height: 50
        };

        for (const wall of this.walls) {
            if (this.checkCollision(playerRect, wall)) {
                // Collision detected, revert position
                this.player.x = prevX;
                this.player.y = prevY;
                break;
            }
        }

        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.canvas.width - 50, this.player.x));
        this.player.y = Math.max(0, Math.min(this.canvas.height - 50, this.player.y));
    }

    updateEntities() {
        if (this.isGameOver) return;

        const currentTime = Date.now();

        this.entities.forEach(entity => {
            if (entity.type === 'trader') return;

            // Store previous position
            const prevX = entity.x;
            const prevY = entity.y;

            // Initialize lastShot if not exists
            if (entity.lastShot === undefined) {
                entity.lastShot = 0;
            }

            // Move towards player with improved movement
            const dx = this.player.x - entity.x;
            const dy = this.player.y - entity.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const speed = 1;
                const angle = Math.atan2(dy, dx);
                
                // Add slight randomization to movement
                const randomOffset = (Math.random() - 0.5) * 0.5;
                entity.x += Math.cos(angle + randomOffset) * speed;
                entity.y += Math.sin(angle + randomOffset) * speed;

                // Check wall collisions
                const entityRect = {
                    x: entity.x,
                    y: entity.y,
                    width: 50,
                    height: 50
                };

                let wallCollision = false;
                for (const wall of this.walls) {
                    if (this.checkCollision(entityRect, wall)) {
                        // Collision detected, revert position
                        entity.x = prevX;
                        entity.y = prevY;
                        wallCollision = true;
                        break;
                    }
                }

                // Only maintain distance if not colliding with wall
                if (!wallCollision && distance < 200) {
                    entity.x -= Math.cos(angle) * speed * 1.5;
                    entity.y -= Math.sin(angle) * speed * 1.5;
                }

                // Entity shooting logic
                if (currentTime - entity.lastShot >= this.entityShootCooldown) {
                    // Check if there's a clear line of sight (no walls between entity and player)
                    if (this.hasLineOfSight(entity, this.player)) {
                        const shootAngle = Math.atan2(dy, dx);
                        this.entityArrows.push({
                            x: entity.x + 25,
                            y: entity.y + 25,
                            angle: shootAngle,
                            speed: 5,
                            damage: 15,
                            width: 40,
                            height: 10,
                            isEnemy: true
                        });
                        entity.lastShot = currentTime;
                    }
                }
            }

            // Check collision with player
            if (this.checkCollision(entity, this.player)) {
                this.player.health -= 1;
                this.saveGameState();
            }

            if (entity.health <= 0) {
                this.player.coins += 25;
                this.updateShopUI();
            }
        });
    }

    hasLineOfSight(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.ceil(distance / 10); // Check every 10 pixels
        
        for (let i = 1; i < steps; i++) {
            const checkX = from.x + (dx * i) / steps;
            const checkY = from.y + (dy * i) / steps;
            
            const point = {
                x: checkX,
                y: checkY,
                width: 1,
                height: 1
            };
            
            for (const wall of this.walls) {
                if (this.checkCollision(point, wall)) {
                    return false;
                }
            }
        }
        return true;
    }

    updateArrows() {
        // Update player arrows
        for (let i = this.arrows.length - 1; i >= 0; i--) {
            const arrow = this.arrows[i];
            arrow.x += Math.cos(arrow.angle) * arrow.speed;
            arrow.y += Math.sin(arrow.angle) * arrow.speed;

            // Check wall collisions
            const arrowRect = {
                x: arrow.x,
                y: arrow.y,
                width: arrow.width,
                height: arrow.height
            };

            let hitWall = false;
            for (const wall of this.walls) {
                if (this.checkCollision(arrowRect, wall)) {
                    this.arrows.splice(i, 1);
                    hitWall = true;
                    break;
                }
            }

            if (hitWall) continue;

            if (this.isArrowOutOfBounds(arrow)) {
                this.arrows.splice(i, 1);
                continue;
            }

            this.checkArrowCollisions(arrow, i, this.arrows, this.entities);
        }

        // Update entity arrows
        for (let i = this.entityArrows.length - 1; i >= 0; i--) {
            const arrow = this.entityArrows[i];
            arrow.x += Math.cos(arrow.angle) * arrow.speed;
            arrow.y += Math.sin(arrow.angle) * arrow.speed;

            // Check wall collisions
            const arrowRect = {
                x: arrow.x,
                y: arrow.y,
                width: arrow.width,
                height: arrow.height
            };

            let hitWall = false;
            for (const wall of this.walls) {
                if (this.checkCollision(arrowRect, wall)) {
                    this.entityArrows.splice(i, 1);
                    hitWall = true;
                    break;
                }
            }

            if (hitWall) continue;

            if (this.isArrowOutOfBounds(arrow)) {
                this.entityArrows.splice(i, 1);
                continue;
            }

            // Check collision with player
            if (this.checkCollision(
                { x: arrow.x, y: arrow.y, width: arrow.width, height: arrow.height },
                { x: this.player.x, y: this.player.y, width: 50, height: 50 }
            )) {
                this.player.health -= arrow.damage;
                this.entityArrows.splice(i, 1);
            }
        }
    }

    isArrowOutOfBounds(arrow) {
        return arrow.x < 0 || arrow.x > this.canvas.width || 
               arrow.y < 0 || arrow.y > this.canvas.height;
    }

    checkArrowCollisions(arrow, arrowIndex, arrowArray, targets) {
        for (let j = targets.length - 1; j >= 0; j--) {
            const target = targets[j];
            if (this.checkCollision(
                { x: arrow.x, y: arrow.y, width: arrow.width, height: arrow.height },
                { x: target.x, y: target.y, width: 50, height: 50 }
            )) {
                target.health -= arrow.damage;
                arrowArray.splice(arrowIndex, 1);
                if (target.health <= 0) {
                    targets.splice(j, 1);
                    this.player.score += 10;
                    this.saveGameState();
                }
                return true;
            }
        }
        return false;
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + (rect2.width || 50) &&
               rect1.x + (rect1.width || 50) > rect2.x &&
               rect1.y < rect2.y + (rect2.height || 50) &&
               rect1.y + (rect1.height || 50) > rect2.y;
    }

    spawnEntities() {
        const currentTime = Date.now();
        
        // Spawn regular enemies
        if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
            for (let i = 0; i < 3; i++) {
                const type = this.entityTypes[Math.floor(Math.random() * this.entityTypes.length)];
                const entity = {
                    type,
                    x: Math.random() * (this.canvas.width - 50),
                    y: Math.random() * (this.canvas.height - 50),
                    health: 100
                };
                this.entities.push(entity);
            }
            this.lastSpawnTime = currentTime;
        }

        // Spawn trader
        if (currentTime - this.lastTraderSpawn >= this.traderSpawnInterval) {
            const trader = {
                type: 'trader',
                x: Math.random() * (this.canvas.width - 50),
                y: Math.random() * (this.canvas.height - 50),
                health: 100
            };
            this.entities.push(trader);
            this.lastTraderSpawn = currentTime;
        }
    }

    checkGameOver() {
        if (this.player.health <= 0 && !this.isGameOver) {
            this.isGameOver = true;
            document.getElementById('deathScreen').style.display = 'flex';
            document.getElementById('finalScore').textContent = this.player.score;
        }
    }

    restartGame() {
        this.isGameOver = false;
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            speed: 3, // Reduced from 5
            health: 5000,
            maxHealth: 5000,
            stamina: 100,
            score: 0,
            upgrades: {
                speed: 1,
                damage: 1
            },
            coins: 0
        };
        this.entities = [];
        this.arrows = [];
        this.entityArrows = [];
        this.walls = [];
        this.spawnWalls();
        this.updateShopUI();
        document.getElementById('deathScreen').style.display = 'none';
    }

    update() {
        if (!this.isGameOver) {
            this.updatePlayer();
            this.updateEntities();
            this.updateArrows();
            this.spawnEntities();
        }
        this.checkGameOver();
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
            }
        });

        // Draw entities
        this.entities.forEach(entity => {
            if (this.images[entity.type]) {
                this.ctx.drawImage(this.images[entity.type], entity.x, entity.y, 50, 50);
                
                // Draw health bar
                this.ctx.fillStyle = 'red';
                this.ctx.fillRect(entity.x, entity.y - 10, 50, 5);
                this.ctx.fillStyle = 'green';
                this.ctx.fillRect(entity.x, entity.y - 10, (entity.health / 100) * 50, 5);
            }
        });

        // Draw arrows with new size
        this.arrows.forEach(arrow => {
            if (this.images.arrow) {
                this.ctx.save();
                this.ctx.translate(arrow.x, arrow.y);
                this.ctx.rotate(arrow.angle);
                this.ctx.drawImage(this.images.arrow, 0, -arrow.height/2, arrow.width, arrow.height);
                this.ctx.restore();
            }
        });

        // Draw entity arrows
        this.entityArrows.forEach(arrow => {
            if (this.images.arrow) {
                this.ctx.save();
                this.ctx.translate(arrow.x, arrow.y);
                this.ctx.rotate(arrow.angle);
                this.ctx.drawImage(this.images.arrow, 0, -arrow.height/2, arrow.width, arrow.height);
                this.ctx.restore();
            }
        });

        // Draw player
        if (this.images.player) {
            this.ctx.drawImage(this.images.player, this.player.x, this.player.y, 50, 50);
        }

        // Update UI
        document.getElementById('health').textContent = `Health: ${this.player.health}`;
        document.getElementById('stamina').textContent = `Stamina: ${this.player.stamina}`;
        document.getElementById('resources').textContent = `Score: ${this.player.score} | Coins: ${this.player.coins}`;
    }

    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        this.update();
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    start() {
        // Game starts when all images are loaded
        this.gameLoop();
    }
}

// Start the game when the page loads
window.onload = () => {
    window.game = new Game();
};