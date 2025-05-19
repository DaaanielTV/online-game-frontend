class Game {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.gameState = 'init'; // States: init, playing, paused, gameOver
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;

        // Initialize player
        this.player = {
            x: this.engine.canvas.width / 2,
            y: this.engine.canvas.height / 2,
            width: 50,
            height: 50,
            speed: 5,
            health: 100,
            maxHealth: 100,
            score: 0,
            powerups: []
        };

        // Game state
        this.enemies = [];
        this.projectiles = [];
        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = 2000;

        // Setup event handlers and start game
        this.setupGame();
    }

    async setupGame() {
        // Load assets
        try {
            await this.assets.loadImage('player', 'enemy/player-avatar.png');
            await this.assets.loadImage('enemy', 'enemy/tricaluctus(underwater-monster).png');
            await this.assets.loadImage('background', 'enemy/game-background.png');
        } catch (error) {
            console.warn('Failed to load some assets, using fallbacks');
        }

        // Add game entities
        this.engine.addEntity({
            render: (ctx) => this.renderBackground(ctx)
        });

        this.engine.addEntity({
            update: (deltaTime) => this.updateGame(deltaTime),
            render: (ctx) => this.renderGame(ctx)
        });

        // Start the game loop
        this.engine.init();
    }    updateGame(deltaTime) {
        // Always process input
        this.handleInput();

        // Only update game logic if playing
        if (this.gameState === 'playing') {
            // Spawn enemies
            this.updateEnemies(deltaTime);

            // Update projectiles
            this.updateProjectiles();

            // Check collisions
            this.checkCollisions();

            // Update power-ups
            this.updatePowerups(deltaTime);

            // Check win/lose conditions
            this.checkGameConditions();
        }
    }

    updatePowerups(deltaTime) {
        this.player.powerups = this.player.powerups.filter(powerup => {
            powerup.duration -= deltaTime;
            return powerup.duration > 0;
        });
    }

    checkGameConditions() {
        if (this.player.health <= 0) {
            this.setState('gameOver');
        }
    }

    updatePlayer() {
        // Movement
        if (this.input.isKeyPressed('ArrowUp') || this.input.isKeyPressed('KeyW')) {
            this.player.y -= this.player.speed;
        }
        if (this.input.isKeyPressed('ArrowDown') || this.input.isKeyPressed('KeyS')) {
            this.player.y += this.player.speed;
        }
        if (this.input.isKeyPressed('ArrowLeft') || this.input.isKeyPressed('KeyA')) {
            this.player.x -= this.player.speed;
        }
        if (this.input.isKeyPressed('ArrowRight') || this.input.isKeyPressed('KeyD')) {
            this.player.x += this.player.speed;
        }

        // Keep player in bounds
        this.player.x = Math.max(0, Math.min(this.engine.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.engine.canvas.height - this.player.height, this.player.y));
    }

    updateEnemies(deltaTime) {
        const now = Date.now();
        if (now - this.lastEnemySpawn > this.enemySpawnInterval) {
            this.spawnEnemy();
            this.lastEnemySpawn = now;
        }

        // Move enemies towards player
        for (let enemy of this.enemies) {
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed;
                enemy.y += (dy / distance) * enemy.speed;
            }
        }
    }

    updateProjectiles() {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            
            // Move projectile
            projectile.x += projectile.dx * projectile.speed;
            projectile.y += projectile.dy * projectile.speed;

            // Remove if out of bounds
            if (projectile.x < 0 || projectile.x > this.engine.canvas.width ||
                projectile.y < 0 || projectile.y > this.engine.canvas.height) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    spawnEnemy() {
        // Spawn enemy at random edge position
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? 0 : this.engine.canvas.width;
            y = Math.random() * this.engine.canvas.height;
        } else {
            x = Math.random() * this.engine.canvas.width;
            y = Math.random() < 0.5 ? 0 : this.engine.canvas.height;
        }

        this.enemies.push({
            x: x,
            y: y,
            width: 40,
            height: 40,
            speed: 2
        });
    }

    checkCollisions() {
        // Check enemy collisions with player
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (this.checkCollision(this.player, enemy)) {
                this.player.health -= 10;
                this.enemies.splice(i, 1);

                if (this.player.health <= 0) {
                    this.gameOver = true;
                }
                continue;
            }

            // Check projectile collisions with enemies
            for (let j = this.projectiles.length - 1; j >= 0; j--) {
                const projectile = this.projectiles[j];
                if (this.checkCollision(projectile, enemy)) {
                    this.enemies.splice(i, 1);
                    this.projectiles.splice(j, 1);
                    this.player.score += 10;
                    break;
                }
            }
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    renderBackground(ctx) {
        if (this.assets.getImage('background')) {
            ctx.drawImage(this.assets.getImage('background'), 0, 0, this.engine.canvas.width, this.engine.canvas.height);
        } else {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
        }
    }    renderGame(ctx) {
        switch (this.gameState) {
            case 'init':
                this.renderTitleScreen(ctx);
                break;
            
            case 'playing':
                this.renderGameplay(ctx);
                break;
            
            case 'paused':
                this.renderGameplay(ctx);
                this.renderPauseOverlay(ctx);
                break;
            
            case 'gameOver':
                this.renderGameplay(ctx);
                this.renderGameOverScreen(ctx);
                break;
        }
    }

    renderGameplay(ctx) {
        // Render player
        if (this.assets.getImage('player')) {
            ctx.drawImage(this.assets.getImage('player'), 
                this.player.x, this.player.y, 
                this.player.width, this.player.height);
        } else {
            ctx.fillStyle = '#00f';
            ctx.fillRect(this.player.x, this.player.y, 
                this.player.width, this.player.height);
        }

        // Render enemies
        for (const enemy of this.enemies) {
            if (this.assets.getImage('enemy')) {
                ctx.drawImage(this.assets.getImage('enemy'), 
                    enemy.x, enemy.y, 
                    enemy.width, enemy.height);
            } else {
                ctx.fillStyle = '#f00';
                ctx.fillRect(enemy.x, enemy.y, 
                    enemy.width, enemy.height);
            }
        }

        // Render projectiles
        ctx.fillStyle = '#ff0';
        for (const projectile of this.projectiles) {
            ctx.beginPath();
            ctx.arc(projectile.x, projectile.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Render game UI
        this.renderGameUI(ctx);
    }

    renderTitleScreen(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Title', this.engine.canvas.width / 2, this.engine.canvas.height / 3);
        
        ctx.font = '24px Arial';
        ctx.fillText('Press SPACE to Start', this.engine.canvas.width / 2, this.engine.canvas.height / 2);
        ctx.fillText('High Score: ' + this.highScore, this.engine.canvas.width / 2, this.engine.canvas.height * 2/3);
    }

    renderPauseOverlay(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', this.engine.canvas.width / 2, this.engine.canvas.height / 2);
        ctx.font = '24px Arial';
        ctx.fillText('Press ESC to Resume', this.engine.canvas.width / 2, this.engine.canvas.height / 2 + 40);
    }

    renderGameOverScreen(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
        
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', this.engine.canvas.width / 2, this.engine.canvas.height / 3);
        
        ctx.font = '24px Arial';
        ctx.fillText('Final Score: ' + this.score, this.engine.canvas.width / 2, this.engine.canvas.height / 2);
        ctx.fillText('High Score: ' + this.highScore, this.engine.canvas.width / 2, this.engine.canvas.height / 2 + 40);
        ctx.fillText('Press SPACE to Restart', this.engine.canvas.width / 2, this.engine.canvas.height * 2/3);
    }

    renderGameUI(ctx) {
        // Health bar
        ctx.fillStyle = '#f00';
        ctx.fillRect(10, 10, 200, 20);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(10, 10, (this.player.health / this.player.maxHealth) * 200, 20);

        // Score
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + this.score, 10, 50);

        // Power-ups
        let powerupX = 10;
        this.player.powerups.forEach((powerup, index) => {
            ctx.fillStyle = powerup.color;
            ctx.fillRect(powerupX, 60, 30, 30);
            powerupX += 40;
        });
    }

    setState(newState) {
        const oldState = this.gameState;
        this.gameState = newState;
        
        switch (newState) {
            case 'playing':
                if (oldState === 'paused') {
                    // Resuming from pause
                    this.engine.init();
                } else {
                    // Starting new game
                    this.resetGame();
                    this.engine.init();
                }
                break;
                
            case 'paused':
                this.engine.stop();
                break;
                
            case 'gameOver':
                // Update high score
                if (this.score > this.highScore) {
                    this.highScore = this.score;
                    localStorage.setItem('highScore', this.highScore);
                }
                break;
        }
    }

    resetGame() {
        // Reset player
        this.player.x = this.engine.canvas.width / 2;
        this.player.y = this.engine.canvas.height / 2;
        this.player.health = this.player.maxHealth;
        this.player.score = 0;
        this.player.powerups = [];

        // Reset game variables
        this.score = 0;
        this.enemies = [];
        this.projectiles = [];
        this.lastEnemySpawn = 0;
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.setState('paused');
        } else if (this.gameState === 'paused') {
            this.setState('playing');
        }
    }

    restartGame() {
        this.player.health = 100;
        this.player.score = 0;
        this.enemies = [];
        this.projectiles = [];
        this.gameOver = false;
    }

    handleInput() {
        // Global controls
        if (this.input.isKeyPressed('Escape')) {
            if (this.gameState === 'playing' || this.gameState === 'paused') {
                this.togglePause();
            }
            // Clear key to prevent multiple toggles
            this.input.keys.set('Escape', false);
        }

        // State-specific controls
        switch (this.gameState) {
            case 'init':
                if (this.input.isKeyPressed('Space')) {
                    this.setState('playing');
                    this.input.keys.set('Space', false);
                }
                break;

            case 'playing':
                // Movement
                if (this.input.isKeyPressed('ArrowUp') || this.input.isKeyPressed('KeyW')) {
                    this.player.y = Math.max(0, this.player.y - this.player.speed);
                }
                if (this.input.isKeyPressed('ArrowDown') || this.input.isKeyPressed('KeyS')) {
                    this.player.y = Math.min(this.engine.canvas.height - this.player.height, 
                        this.player.y + this.player.speed);
                }
                if (this.input.isKeyPressed('ArrowLeft') || this.input.isKeyPressed('KeyA')) {
                    this.player.x = Math.max(0, this.player.x - this.player.speed);
                }
                if (this.input.isKeyPressed('ArrowRight') || this.input.isKeyPressed('KeyD')) {
                    this.player.x = Math.min(this.engine.canvas.width - this.player.width, 
                        this.player.x + this.player.speed);
                }
                break;

            case 'gameOver':
                if (this.input.isKeyPressed('Space')) {
                    this.setState('playing');
                    this.input.keys.set('Space', false);
                }
                break;
        }
    }
}
