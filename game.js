class Game {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();

        this.gameState = 'init';
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;

        this.player = {
            x: 0,
            y: 0,
            width: 50,
            height: 50,
            speed: 5,
            health: 100,
            maxHealth: 100,
            powerups: []
        };

        this.enemies = [];
        this.projectiles = [];
        this.powerups = [];

        this.lastEnemySpawn = 0;
        this.enemySpawnInterval = 2000;

        this.setupGame();
    }

    async setupGame() {
        try {
            await this.assets.loadImage('player', 'enemy/player-avatar.png');
            await this.assets.loadImage('enemy', 'enemy/tricaluctus(underwater-monster).png');
            await this.assets.loadImage('background', 'enemy/game-background.png');
        } catch (error) {
            console.warn('Failed to load assets:', error);
        }

        this.engine.addEntity({
            render: (ctx) => this.renderBackground(ctx)
        });

        this.engine.addEntity({
            update: (deltaTime) => this.updateGame(deltaTime),
            render: (ctx) => this.renderGame(ctx)
        });

        this.engine.init();
        // Initialize player's position once the canvas is available
        this.player.x = this.engine.canvas.width / 2;
        this.player.y = this.engine.canvas.height / 2;
    }

    updateGame(deltaTime) {
        this.handleInput();

        if (this.gameState === 'playing') {
            this.updatePlayer();
            this.updateEnemies(deltaTime);
            this.updateProjectiles();
            this.updatePowerups(deltaTime);
            this.checkCollisions();
            this.checkGameConditions();
        }
    }

    updatePlayer() {
        this.player.x = Math.max(0, Math.min(this.engine.canvas.width - this.player.width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.engine.canvas.height - this.player.height, this.player.y));
    }

    updateEnemies(deltaTime) {
        const now = Date.now();
        if (now - this.lastEnemySpawn > this.enemySpawnInterval) {
            this.spawnEnemy();
            this.lastEnemySpawn = now;
        }

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
            const proj = this.projectiles[i];
            proj.x += proj.dx * proj.speed;
            proj.y += proj.dy * proj.speed;

            if (proj.x < 0 || proj.x > this.engine.canvas.width || proj.y < 0 || proj.y > this.engine.canvas.height) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    updatePowerups(deltaTime) {
        this.player.powerups = this.player.powerups.filter(p => {
            p.duration -= deltaTime;
            return p.duration > 0;
        });
    }

    checkCollisions() {
        // Projectiles vs enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            for (let j = this.projectiles.length - 1; j >= 0; j--) {
                const proj = this.projectiles[j];
                if (this.checkCollision(proj, enemy)) {
                    this.enemies.splice(i, 1);
                    this.projectiles.splice(j, 1);
                    this.score += 10;
                    if (Math.random() < 0.2) {
                        this.spawnPowerup(enemy.x, enemy.y);
                    }
                    break;
                }
            }
        }

        // Enemies vs player
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (this.checkCollision(this.player, enemy)) {
                this.player.health -= 20;
                this.enemies.splice(i, 1);
            }
        }

        // Field powerups vs player
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (this.checkCollision(this.player, p)) {
                this.activatePowerup(p.type);
                this.powerups.splice(i, 1);
            }
        }
    }

    checkGameConditions() {
        if (this.player.health <= 0) {
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('highScore', this.highScore);
            }
            this.setState('gameOver');
        }
    }

    checkCollision(obj1, obj2) {
        return obj1.x < obj2.x + obj2.width &&
               obj1.x + obj1.width > obj2.x &&
               obj1.y < obj2.y + obj2.height &&
               obj1.y + obj1.height > obj2.y;
    }

    renderBackground(ctx) {
        const bg = this.assets.getImage('background');
        if (bg) {
            ctx.drawImage(bg, 0, 0, this.engine.canvas.width, this.engine.canvas.height);
        } else {
            ctx.fillStyle = 'lightblue';
            ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
        }
    }

    renderGame(ctx) {
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
        const playerImg = this.assets.getImage('player');
        if (playerImg) {
            ctx.drawImage(playerImg, this.player.x, this.player.y, this.player.width, this.player.height);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.player.x, this.player.y, this.player.width, this.player.height);
        }

        const enemyImg = this.assets.getImage('enemy');
        for (const enemy of this.enemies) {
            if (enemyImg) {
                ctx.drawImage(enemyImg, enemy.x, enemy.y, enemy.width, enemy.height);
            } else {
                ctx.fillStyle = 'green';
                ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
            }
        }

        ctx.fillStyle = '#ff0';
        for (const proj of this.projectiles) {
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        for (const p of this.powerups) {
            ctx.fillStyle = p.color || '#ffaa00';
            ctx.fillRect(p.x, p.y, p.width, p.height);
        }

        this.renderGameUI(ctx);
    }

    renderTitleScreen(ctx) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, this.engine.canvas.width, this.engine.canvas.height);
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Survival Game', this.engine.canvas.width / 2, this.engine.canvas.height / 3);
        ctx.font = '24px Arial';
        ctx.fillText('Press SPACE to Start', this.engine.canvas.width / 2, this.engine.canvas.height / 2);
        ctx.fillText('Use WASD or Arrow Keys to move', this.engine.canvas.width / 2, this.engine.canvas.height / 2 + 40);
        ctx.fillText('High Score: ' + this.highScore, this.engine.canvas.width / 2, this.engine.canvas.height * 2 / 3);
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
        ctx.fillText('Press SPACE to Restart', this.engine.canvas.width / 2, this.engine.canvas.height * 2 / 3);
    }

    renderGameUI(ctx) {
        const healthPercent = this.player.health / this.player.maxHealth;
        ctx.fillStyle = '#f00';
        ctx.fillRect(10, 10, 200, 20);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(10, 10, 200 * healthPercent, 20);
        ctx.fillStyle = '#000';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${this.player.health}/${this.player.maxHealth}`, 110, 25);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('Score: ' + this.score, 10, 50);
        ctx.fillText('High Score: ' + this.highScore, 10, 80);
        
        let powerupX = 10;
        this.player.powerups.forEach(p => {
            ctx.fillStyle = p.color || '#ffaa00';
            ctx.fillRect(powerupX, 90, 30, 30);
            powerupX += 40;
        });
    }

    setState(newState) {
        if (newState === 'gameOver' && this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }

        this.gameState = newState;

        if (newState === 'playing') {
            // If coming from paused state, simply restart the engine; otherwise reset the game
            if (this.gameState !== 'paused') {
                this.resetGame();
            }
            this.engine.init();
        } else if (newState === 'paused') {
            this.engine.stop();
        }
    }

    resetGame() {
        this.player.x = this.engine.canvas.width / 2;
        this.player.y = this.engine.canvas.height / 2;
        this.player.health = this.player.maxHealth;
        this.player.powerups = [];
        this.score = 0;
        this.enemies = [];
        this.projectiles = [];
        this.powerups = [];
        this.lastEnemySpawn = Date.now();
    }

    togglePause() {
        if (this.gameState === 'playing') {
            this.setState('paused');
        } else if (this.gameState === 'paused') {
            this.setState('playing');
        }
    }

    handleInput() {
        if (this.input.isKeyPressed('Escape')) {
            if (this.gameState === 'playing' || this.gameState === 'paused') {
                this.togglePause();
                this.input.keys.set('Escape', false);
            }
        }

        if (this.gameState === 'init' || this.gameState === 'gameOver') {
            if (this.input.isKeyPressed(' ')) {
                this.resetGame();
                this.setState('playing');
                this.input.keys.set(' ', false);
            }
        }

        if (this.gameState === 'playing') {
            if (this.input.isKeyPressed('ArrowUp') || this.input.isKeyPressed('w')) this.player.y -= this.player.speed;
            if (this.input.isKeyPressed('ArrowDown') || this.input.isKeyPressed('s')) this.player.y += this.player.speed;
            if (this.input.isKeyPressed('ArrowLeft') || this.input.isKeyPressed('a')) this.player.x -= this.player.speed;
            if (this.input.isKeyPressed('ArrowRight') || this.input.isKeyPressed('d')) this.player.x += this.player.speed;

            if (this.input.isKeyPressed(' ')) {
                this.shootProjectile();
                this.input.keys.set(' ', false);
            }
        }
    }

    shootProjectile() {
        const dx = 0;
        const dy = -1;
        this.projectiles.push({
            x: this.player.x + this.player.width / 2,
            y: this.player.y,
            dx: dx,
            dy: dy,
            speed: 10,
            width: 5,
            height: 5
        });
    }

    shoot() {
        const mousePos = this.input.getMousePosition();
        const dx = mousePos.x - (this.player.x + this.player.width / 2);
        const dy = mousePos.y - (this.player.y + this.player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 0) {
            this.projectiles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                dx: dx / distance,
                dy: dy / distance,
                speed: 8,
                width: 5,
                height: 5
            });
        }
    }

    spawnEnemy() {
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

    spawnPowerup(x, y) {
        this.powerups.push({
            type: 'heal',
            duration: 10000,
            x: x,
            y: y,
            width: 30,
            height: 30,
            color: '#ffaa00'
        });
    }

    activatePowerup(type) {
        if (type === 'heal') {
            this.player.health = Math.min(this.player.maxHealth, this.player.health + 20);
        }
        // Additional powerup types can be added here
    }
}
