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
            coins: 0,
            dashCooldown: 2000, // 2 seconds
            lastDashTime: 0,
            isDashing: false,
            dashSpeed: 15,
            dashDuration: 150, // milliseconds
            class: 'archer',
            level: 1,
            experience: 0,
            experienceToLevel: 100,
            elements: {
                fire: 0,
                ice: 0,
                poison: 0
            },
            inventory: [],
            maxInventorySize: 20,
            skills: {},
            achievements: new Set(),
            statistics: {
                enemiesKilled: 0,
                damageDealt: 0,
                powerUpsCollected: 0,
                wavesCompleted: 0
            },
            pets: [],
            activePet: null,
            guild: null
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

        // Load images and start game
        this.loadImages({
            background: 'enemy/game-background.png',
            player: 'enemy/player-avatar.png',
            elephant: 'enemy/elephant.png',
            trader: 'enemy/the-trader.png',
            monster: 'enemy/tricaluctus(underwater-monster).png',
            arrow: 'enemy/arrow.png',
            wall: 'enemy/wall.png'
        });

        // Input handling
        this.keys = {};
        this.setupInputs();
        this.setupClickHandler();
        this.setupShootingControls();

        // Database connection
        this.setupDatabase();

        // Setup UI handlers
        this.setupShopButton();

        // Power-up system
        this.powerUps = [];
        this.powerUpTypes = [
            { type: 'health', bonus: 1000, duration: 10000 },
            { type: 'speed', bonus: 2, duration: 5000 },
            { type: 'invincibility', duration: 3000 }
        ];
        this.lastPowerUpSpawn = 0;
        this.powerUpSpawnInterval = 15000; // 15 seconds

        // Wave system
        this.wave = 1;
        this.enemiesPerWave = 3;
        this.enemiesRemaining = this.enemiesPerWave;
        this.waveDelay = 5000; // 5 seconds between waves
        this.lastWaveTime = 0;
        this.isWaveInProgress = false;

        // Character class system
        this.characterClasses = {
            warrior: {
                baseHealth: 6000,
                baseDamage: 30,
                special: 'berserk',
                description: 'High health and melee damage'
            },
            archer: {
                baseHealth: 4000,
                baseDamage: 40,
                special: 'multishot',
                description: 'High ranged damage and mobility'
            },
            mage: {
                baseHealth: 3500,
                baseDamage: 50,
                special: 'frostbolt',
                description: 'Powerful elemental attacks'
            }
        };

        // Time and weather system
        this.environment = {
            time: 0, // 0-24 hours
            dayLength: 300000, // 5 minutes per day
            weather: 'clear',
            weatherEffects: ['clear', 'rain', 'storm', 'fog'],
            lastWeatherChange: 0,
            weatherDuration: 60000 // 1 minute
        };

        // Resource nodes
        this.resources = [];
        this.resourceTypes = ['wood', 'stone', 'metal', 'herb'];

        // Initialize new systems
        this.initializeSkillTrees();
        this.initializeQuestSystem();
        this.initializeSoundSystem();
        this.spawnInitialResources();
        this.initializeEventSystem();
        this.setupLeaderboard();
        this.initializeTutorial();

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
                    this.startGame(); // Changed from this.start()
                }
            };
            img.src = src;
            this.images[key] = img;
        }
    }

    startGame() {
        // Initialize game state
        this.lastTime = 0;
        this.lastSpawnTime = Date.now();
        this.lastWaveTime = Date.now();
        this.lastTraderSpawn = Date.now();
        this.spawnWalls();
        // Start first wave
        this.startNewWave();
        // Start game loop
        this.gameLoop();
    }

    setupInputs() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // Add dash on Space
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.tryDash();
            }
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
            this.shopPrices[type] = Math.floor(price * 1.5);
            
            switch(type) {
                case 'speed':
                    this.player.speed = 5 + this.player.upgrades.speed;
                    break;
                case 'health':
                    this.player.maxHealth = 5000 + (this.player.upgrades.health * 1000);
                    this.player.health = this.player.maxHealth;
                    break;
                case 'attackSpeed':
                    // Attack speed is handled in shooting controls
                    break;
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
        // Add attack speed property if not exists
        if (!this.player.upgrades.attackSpeed) {
            this.player.upgrades.attackSpeed = 1;
        }
        if (!this.player.lastShot) {
            this.player.lastShot = 0;
        }

        window.addEventListener('click', (e) => {
            if (this.isGameOver || this.showShop) return;

            const currentTime = Date.now();
            const shootingCooldown = 500 / this.player.upgrades.attackSpeed; // Base 500ms cooldown, reduced by attack speed
            
            if (currentTime - this.player.lastShot < shootingCooldown) {
                return; // Still on cooldown
            }

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
            
            this.player.lastShot = currentTime;
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

    tryDash() {
        const currentTime = Date.now();
        if (currentTime - this.player.lastDashTime >= this.player.dashCooldown) {
            this.player.isDashing = true;
            this.player.lastDashTime = currentTime;
            
            // Get dash direction from current movement
            let dashDirX = 0;
            let dashDirY = 0;
            if (this.keys['ArrowUp'] || this.keys['w']) dashDirY = -1;
            if (this.keys['ArrowDown'] || this.keys['s']) dashDirY = 1;
            if (this.keys['ArrowLeft'] || this.keys['a']) dashDirX = -1;
            if (this.keys['ArrowRight'] || this.keys['d']) dashDirX = 1;
            
            // Normalize direction
            const length = Math.sqrt(dashDirX * dashDirX + dashDirY * dashDirY) || 1;
            this.player.dashDirX = dashDirX / length;
            this.player.dashDirY = dashDirY / length;
            
            setTimeout(() => {
                this.player.isDashing = false;
            }, this.player.dashDuration);
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
        
        if (this.player.isDashing) {
            this.player.x += this.player.dashDirX * this.player.dashSpeed;
            this.player.y += this.player.dashDirY * this.player.dashSpeed;
        }
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
        
        // Wave-based enemy spawning
        if (!this.isWaveInProgress && currentTime - this.lastWaveTime >= this.waveDelay) {
            this.startNewWave();
        }

        // Trader spawn logic remains the same
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

    startNewWave() {
        this.isWaveInProgress = true;
        this.enemiesRemaining = this.enemiesPerWave;
        
        // Spawn initial wave enemies
        for (let i = 0; i < this.enemiesPerWave; i++) {
            const type = this.entityTypes[Math.floor(Math.random() * this.entityTypes.length)];
            const entity = {
                type,
                x: Math.random() * (this.canvas.width - 50),
                y: Math.random() * (this.canvas.height - 50),
                health: 100 + (this.wave * 20), // Health scales with wave
                damage: 15 + (this.wave * 2), // Damage scales with wave
                speed: 1 + (this.wave * 0.1) // Speed scales with wave
            };
            this.entities.push(entity);
        }
    }

    checkWaveComplete() {
        const remainingEnemies = this.entities.filter(e => e.type !== 'trader').length;
        if (remainingEnemies === 0 && this.isWaveInProgress) {
            this.wave++;
            this.enemiesPerWave += 1;
            this.isWaveInProgress = false;
            this.lastWaveTime = Date.now();
            
            // Calculate and show wave bonus
            const waveBonus = this.wave * 50;
            const scoreBonus = this.wave * 100;
            this.player.coins += waveBonus;
            this.player.score += scoreBonus;
            
            // Show wave completion notification
            const waveComplete = document.getElementById('waveComplete');
            document.getElementById('waveBonus').textContent = waveBonus;
            waveComplete.style.display = 'block';
            setTimeout(() => {
                waveComplete.style.display = 'none';
            }, 2000);
            
            this.updateShopUI();
        }
    }

    spawnPowerUp() {
        const currentTime = Date.now();
        if (currentTime - this.lastPowerUpSpawn >= this.powerUpSpawnInterval) {
            const powerUpType = this.powerUpTypes[Math.floor(Math.random() * this.powerUpTypes.length)];
            const powerUp = {
                type: powerUpType.type,
                x: Math.random() * (this.canvas.width - 30),
                y: Math.random() * (this.canvas.height - 30),
                width: 30,
                height: 30,
                bonus: powerUpType.bonus,
                duration: powerUpType.duration
            };
            this.powerUps.push(powerUp);
            this.lastPowerUpSpawn = currentTime;
        }
    }

    updatePowerUps() {
        const playerRect = {
            x: this.player.x,
            y: this.player.y,
            width: 50,
            height: 50
        };

        for (let i = this.powerUps.length - 1; i >= 0; i--) {
            const powerUp = this.powerUps[i];
            if (this.checkCollision(playerRect, powerUp)) {
                this.applyPowerUp(powerUp);
                this.powerUps.splice(i, 1);
            }
        }
    }

    applyPowerUp(powerUp) {
        switch (powerUp.type) {
            case 'health':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + powerUp.bonus);
                break;
            case 'speed':
                const originalSpeed = this.player.speed;
                this.player.speed += powerUp.bonus;
                setTimeout(() => {
                    this.player.speed = originalSpeed;
                }, powerUp.duration);
                break;
            case 'invincibility':
                this.player.isInvincible = true;
                setTimeout(() => {
                    this.player.isInvincible = false;
                }, powerUp.duration);
                break;
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
            coins: 0,
            dashCooldown: 2000, // 2 seconds
            lastDashTime: 0,
            isDashing: false,
            dashSpeed: 15,
            dashDuration: 150, // milliseconds
            class: 'archer',
            level: 1,
            experience: 0,
            experienceToLevel: 100,
            elements: {
                fire: 0,
                ice: 0,
                poison: 0
            },
            inventory: [],
            maxInventorySize: 20,
            skills: {},
            achievements: new Set(),
            statistics: {
                enemiesKilled: 0,
                damageDealt: 0,
                powerUpsCollected: 0,
                wavesCompleted: 0
            },
            pets: [],
            activePet: null,
            guild: null
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
            
            // Check spawn time for entities
            const currentTime = Date.now();
            if (currentTime - this.lastSpawnTime >= this.spawnInterval) {
                this.spawnEntities();
                this.lastSpawnTime = currentTime;
            }
            
            this.spawnPowerUp();
            this.updatePowerUps();
            this.checkWaveComplete();
            this.updatePlayerState();
            this.updateResources();
            this.updateQuests();
            this.checkAchievements();
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

        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            this.ctx.fillStyle = powerUp.type === 'health' ? 'red' : 
                               powerUp.type === 'speed' ? 'yellow' : 'blue';
            this.ctx.fillRect(powerUp.x, powerUp.y, powerUp.width, powerUp.height);
        });

        // Draw player
        if (this.images.player) {
            this.ctx.drawImage(this.images.player, this.player.x, this.player.y, 50, 50);
        }

        // Update UI
        document.getElementById('health').textContent = `Health: ${this.player.health}`;
        document.getElementById('stamina').textContent = `Dash Cooldown: ${Math.ceil(Math.max(0, this.player.dashCooldown - (Date.now() - this.player.lastDashTime)) / 1000)}s`;
        document.getElementById('resources').textContent = `Score: ${this.player.score} | Coins: ${this.player.coins}`;

        // Draw wave information
        this.ctx.fillStyle = 'white';
        this.ctx.font = '20px Arial';
        this.ctx.fillText(`Wave: ${this.wave}`, 10, this.canvas.height - 20);

        this.renderEnvironmentEffects();
        this.renderMinimap();
        this.renderUI();
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

    // New method for leveling system
    gainExperience(amount) {
        this.player.experience += amount;
        while (this.player.experience >= this.player.experienceToLevel) {
            this.levelUp();
        }
    }

    levelUp() {
        this.player.experience -= this.player.experienceToLevel;
        this.player.level++;
        this.player.experienceToLevel = Math.floor(this.player.experienceToLevel * 1.5);
        this.player.maxHealth += 100;
        this.player.health = this.player.maxHealth;
        this.showLevelUpNotification();
    }

    // Initialize skill trees for each class
    initializeSkillTrees() {
        this.skillTrees = {
            warrior: [
                { id: 'heavyStrike', level: 0, maxLevel: 5, damage: 50 },
                { id: 'toughness', level: 0, maxLevel: 3, healthBonus: 200 },
                { id: 'whirlwind', level: 0, maxLevel: 1, unlockLevel: 5 }
            ],
            archer: [
                { id: 'preciseShot', level: 0, maxLevel: 5, critChance: 10 },
                { id: 'quickDraw', level: 0, maxLevel: 3, attackSpeed: 10 },
                { id: 'multishot', level: 0, maxLevel: 1, unlockLevel: 5 }
            ],
            mage: [
                { id: 'elementalMastery', level: 0, maxLevel: 5, elementalDamage: 20 },
                { id: 'manaShield', level: 0, maxLevel: 3, damageReduction: 15 },
                { id: 'chainLightning', level: 0, maxLevel: 1, unlockLevel: 5 }
            ]
        };
    }

    // Quest system
    initializeQuestSystem() {
        this.quests = {
            daily: [],
            story: [],
            achievement: []
        };
        this.generateDailyQuests();
    }

    generateDailyQuests() {
        const questTypes = [
            { type: 'kill', count: 20, reward: 100 },
            { type: 'collect', count: 10, reward: 150 },
            { type: 'survive', waves: 5, reward: 200 }
        ];
        // Reset and generate new daily quests
        this.quests.daily = questTypes.map(quest => ({
            ...quest,
            progress: 0,
            completed: false
        }));
    }

    // Sound system
    initializeSoundSystem() {
        this.sounds = {
            background: new Audio('sounds/background.mp3'),
            attack: new Audio('sounds/attack.mp3'),
            powerup: new Audio('sounds/powerup.mp3'),
            levelUp: new Audio('sounds/levelup.mp3')
        };
        this.sounds.background.loop = true;
    }

    // Resource system
    spawnInitialResources() {
        for (let i = 0; i < 10; i++) {
            this.spawnResource();
        }
    }

    spawnResource() {
        const type = this.resourceTypes[Math.floor(Math.random() * this.resourceTypes.length)];
        const resource = {
            type,
            x: Math.random() * (this.canvas.width - 30),
            y: Math.random() * (this.canvas.height - 30),
            amount: Math.floor(Math.random() * 5) + 1
        };
        this.resources.push(resource);
    }

    // Event system
    initializeEventSystem() {
        this.events = {
            current: null,
            available: [
                {
                    name: 'Blood Moon',
                    duration: 300000,
                    effect: () => this.startBloodMoonEvent()
                },
                {
                    name: 'Treasure Hunt',
                    duration: 180000,
                    effect: () => this.startTreasureHuntEvent()
                }
            ]
        };
        setInterval(() => this.checkForRandomEvent(), 600000);
    }

    // Leaderboard system
    setupLeaderboard() {
        this.leaderboard = {
            highScores: [],
            weeklyBest: [],
            updateInterval: 60000
        };
        setInterval(() => this.updateLeaderboard(), this.leaderboard.updateInterval);
    }

    // Tutorial system
    initializeTutorial() {
        this.tutorial = {
            steps: [
                { id: 'movement', completed: false, text: 'Use WASD to move' },
                { id: 'combat', completed: false, text: 'Click to attack' },
                { id: 'upgrade', completed: false, text: 'Press U to open upgrades' }
            ],
            currentStep: 0,
            isActive: true
        };
    }

    // Update enhanced player state
    updatePlayerState() {
        if (this.player.activePet) {
            this.updatePetBehavior();
        }
        this.updateEnvironment();
        this.checkQuestProgress();
        this.updateStatistics();
    }

    // Environment updates
    updateEnvironment() {
        const now = Date.now();
        // Update day/night cycle
        this.environment.time = (now % this.environment.dayLength) / this.environment.dayLength * 24;
        
        // Update weather
        if (now - this.environment.lastWeatherChange > this.environment.weatherDuration) {
            this.environment.weather = this.environment.weatherEffects[
                Math.floor(Math.random() * this.environment.weatherEffects.length)
            ];
            this.environment.lastWeatherChange = now;
        }
    }

    renderEnvironmentEffects() {
        // Apply visual effects based on time and weather
        const timeOfDay = this.environment.time;
        const alpha = timeOfDay > 12 ? (timeOfDay - 12) / 12 : 1 - (timeOfDay / 12);
        
        // Night overlay
        this.ctx.fillStyle = `rgba(0, 0, 50, ${alpha * 0.5})`;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Weather effects
        switch (this.environment.weather) {
            case 'rain':
                this.renderRain();
                break;
            case 'storm':
                this.renderStorm();
                break;
            case 'fog':
                this.renderFog();
                break;
        }
    }

    renderMinimap() {
        const mapSize = 150;
        const mapX = this.canvas.width - mapSize - 10;
        const mapY = 10;
        
        // Draw minimap background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(mapX, mapY, mapSize, mapSize);
        
        // Draw entities on minimap
        this.ctx.fillStyle = 'red';
        this.entities.forEach(entity => {
            const minimapX = mapX + (entity.x / this.canvas.width) * mapSize;
            const minimapY = mapY + (entity.y / this.canvas.height) * mapSize;
            this.ctx.fillRect(minimapX, minimapY, 3, 3);
        });
        
        // Draw player on minimap
        this.ctx.fillStyle = 'blue';
        const playerMinimapX = mapX + (this.player.x / this.canvas.width) * mapSize;
        const playerMinimapY = mapY + (this.player.y / this.canvas.height) * mapSize;
        this.ctx.fillRect(playerMinimapX, playerMinimapY, 4, 4);
    }

    renderUI() {
        // Draw experience bar
        const expBarWidth = 200;
        const expBarHeight = 10;
        const expBarX = 10;
        const expBarY = this.canvas.height - 30;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(expBarX, expBarY, expBarWidth, expBarHeight);
        
        const expProgress = this.player.experience / this.player.experienceToLevel;
        this.ctx.fillStyle = 'rgb(0, 255, 200)';
        this.ctx.fillRect(expBarX, expBarY, expBarWidth * expProgress, expBarHeight);
        
        // Draw level
        this.ctx.fillStyle = 'white';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Level ${this.player.level}`, expBarX, expBarY - 5);
        
        // Draw current quests
        this.renderQuestLog();
    }

    renderQuestLog() {
        const questY = 100;
        this.ctx.fillStyle = 'white';
        this.ctx.font = '14px Arial';
        this.quests.daily.forEach((quest, index) => {
            if (!quest.completed) {
                this.ctx.fillText(
                    `${quest.type}: ${quest.progress}/${quest.count}`,
                    10,
                    questY + (index * 20)
                );
            }
        });
    }
}
window.onload = () => {
    window.game = new Game();
};