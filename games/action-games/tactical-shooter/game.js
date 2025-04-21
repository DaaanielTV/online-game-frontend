import { GameEngine, Entity, InputManager, AssetManager } from '../../shared/engine.js';

class Agent extends Entity {
    constructor(x, y, type) {
        super(x, y, 40, 40);
        this.type = type;
        this.speed = 5;
        this.health = 100;
        this.armor = 0;
        this.credits = 800;
        this.direction = 0;
        this.abilities = this.initializeAbilities();
        this.ultimate = 0;
        this.ultimatePoints = 0;
        this.weapon = null;
        this.team = null;
        this.isAlive = true;
    }

    initializeAbilities() {
        // Ability configuration based on agent type
        const abilities = {
            signature: { cooldown: 0, cost: 0, isReady: true },
            basic: { cooldown: 0, cost: 200, isReady: true },
            tactical: { cooldown: 0, cost: 300, isReady: true },
            ultimate: { points: 7, current: 0, isReady: false }
        };

        switch(this.type) {
            case 'duelist':
                abilities.signature.name = 'Dash';
                abilities.basic.name = 'Flash';
                abilities.tactical.name = 'Smoke';
                abilities.ultimate.name = 'Combat Stim';
                break;
            case 'sentinel':
                abilities.signature.name = 'Trap';
                abilities.basic.name = 'Slow';
                abilities.tactical.name = 'Wall';
                abilities.ultimate.name = 'Lockdown';
                break;
            // Add more agent types here
        }

        return abilities;
    }

    update(deltaTime) {
        const input = this.game.input;

        // Movement
        let dx = 0;
        let dy = 0;
        if (input.isKeyPressed('w')) dy -= 1;
        if (input.isKeyPressed('s')) dy += 1;
        if (input.isKeyPressed('a')) dx -= 1;
        if (input.isKeyPressed('d')) dx += 1;

        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
            dx *= 0.707;
            dy *= 0.707;
        }

        // Update position
        this.x = Math.max(0, Math.min(this.game.engine.canvas.width - this.width, this.x + dx * this.speed));
        this.y = Math.max(0, Math.min(this.game.engine.canvas.height - this.height, this.y + dy * this.speed));

        // Update direction (angle towards mouse)
        const mouseX = input.mouseX;
        const mouseY = input.mouseY;
        this.direction = Math.atan2(mouseY - (this.y + this.height/2), mouseX - (this.x + this.width/2));

        // Ability activation
        if (input.isKeyPressed('q')) this.useAbility('signature');
        if (input.isKeyPressed('e')) this.useAbility('basic');
        if (input.isKeyPressed('c')) this.useAbility('tactical');
        if (input.isKeyPressed('x')) this.useAbility('ultimate');

        // Shooting
        if (input.mouseDown && this.weapon) {
            this.weapon.shoot();
        }
    }

    render(ctx) {
        // Draw agent body
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.direction);
        
        ctx.fillStyle = this.team === 'attack' ? '#ff4444' : '#4444ff';
        ctx.fillRect(-this.width/2, -this.height/2, this.width, this.height);
        
        // Draw direction indicator
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(this.width/2, 0);
        ctx.lineTo(this.width/2 - 10, -5);
        ctx.lineTo(this.width/2 - 10, 5);
        ctx.fill();
        
        ctx.restore();

        // Draw health bar
        const healthBarWidth = 40;
        const healthBarHeight = 4;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x, this.y - 10, healthBarWidth, healthBarHeight);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x, this.y - 10, healthBarWidth * (this.health/100), healthBarHeight);
    }

    useAbility(type) {
        const ability = this.abilities[type];
        if (!ability.isReady || this.credits < ability.cost) return;
        
        if (type === 'ultimate' && this.ultimatePoints < ability.points) return;

        // Implement ability effects here
        switch(ability.name) {
            case 'Dash':
                // Implement dash logic
                break;
            case 'Flash':
                // Implement flash logic
                break;
            // Add more abilities
        }

        // Apply costs and cooldowns
        this.credits -= ability.cost;
        ability.isReady = false;
        if (type === 'ultimate') {
            this.ultimatePoints = 0;
        }
    }

    takeDamage(amount) {
        const armorDamage = Math.min(this.armor, amount * 0.5);
        this.armor -= armorDamage;
        this.health -= (amount - armorDamage);

        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.isAlive = false;
        this.game.checkRoundEnd();
    }
}

class Weapon extends Entity {
    constructor(type) {
        super(0, 0, 0, 0);
        this.type = type;
        this.configure();
    }

    configure() {
        switch(this.type) {
            case 'pistol':
                this.damage = 20;
                this.fireRate = 400;
                this.cost = 0;
                break;
            case 'rifle':
                this.damage = 35;
                this.fireRate = 100;
                this.cost = 2900;
                break;
            // Add more weapon types
        }
        this.lastShot = 0;
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot < this.fireRate) return;

        // Create bullet
        const bullet = new Bullet(
            this.owner.x + this.owner.width/2,
            this.owner.y + this.owner.height/2,
            this.owner.direction,
            this.damage,
            this.owner.team
        );
        bullet.game = this.game;
        this.game.engine.addEntity(bullet);

        this.lastShot = now;
    }
}

class Bullet extends Entity {
    constructor(x, y, direction, damage, team) {
        super(x, y, 4, 4);
        this.direction = direction;
        this.speed = 15;
        this.damage = damage;
        this.team = team;
    }

    update() {
        this.x += Math.cos(this.direction) * this.speed;
        this.y += Math.sin(this.direction) * this.speed;

        // Check for collisions with agents
        for (const entity of this.game.engine.entities) {
            if (entity instanceof Agent && entity.team !== this.team && entity.isAlive) {
                if (this.collidesWith(entity)) {
                    entity.takeDamage(this.damage);
                    this.game.engine.removeEntity(this);
                    return;
                }
            }
        }

        // Remove if off screen
        if (this.x < 0 || this.x > this.game.engine.canvas.width ||
            this.y < 0 || this.y > this.game.engine.canvas.height) {
            this.game.engine.removeEntity(this);
        }
    }

    render(ctx) {
        ctx.fillStyle = this.team === 'attack' ? '#ff0000' : '#0000ff';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

class TacticalShooterGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.players = [];
        this.round = 1;
        this.phase = 'buy'; // 'buy' or 'action'
        this.phaseTime = 30; // seconds
        this.attackScore = 0;
        this.defenseScore = 0;
        this.setup();
    }

    async setup() {
        // Load background
        try {
            await this.assets.loadImage('background', '../../enemy/game-background.png');
        } catch (error) {
            console.warn('Failed to load background, using fallback');
        }

        // Add background rendering
        this.engine.addEntity({
            render: (ctx) => {
                if (this.assets.getImage('background')) {
                    ctx.drawImage(this.assets.getImage('background'), 0, 0, this.engine.canvas.width, this.engine.canvas.height);
                }
            }
        });

        // Create test agents
        const player = new Agent(100, 300, 'duelist');
        player.team = 'attack';
        player.weapon = new Weapon('rifle');
        player.weapon.owner = player;
        player.weapon.game = this;
        player.game = this;
        this.engine.addEntity(player);
        this.players.push(player);

        // Add UI
        this.engine.addEntity({
            render: (ctx) => this.renderUI(ctx)
        });

        // Start game loop
        this.engine.init();
    }

    renderUI(ctx) {
        // Round info
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Round ${this.round}`, this.engine.canvas.width/2, 30);
        ctx.fillText(`${this.attackScore} - ${this.defenseScore}`, this.engine.canvas.width/2, 60);

        // Phase timer
        ctx.fillText(`${this.phase.toUpperCase()}: ${this.phaseTime}s`, this.engine.canvas.width/2, 90);

        // Player info (simplified for now)
        ctx.textAlign = 'left';
        ctx.fillText(`Credits: ${this.players[0].credits}`, 20, 30);
        ctx.fillText(`Ultimate: ${this.players[0].ultimatePoints}/${this.players[0].abilities.ultimate.points}`, 20, 60);
    }

    checkRoundEnd() {
        // Count alive players on each team
        const aliveAttackers = this.players.filter(p => p.team === 'attack' && p.isAlive).length;
        const aliveDefenders = this.players.filter(p => p.team === 'defense' && p.isAlive).length;

        if (aliveAttackers === 0) {
            this.defenseScore++;
            this.startNewRound();
        } else if (aliveDefenders === 0) {
            this.attackScore++;
            this.startNewRound();
        }
    }

    startNewRound() {
        this.round++;
        this.phase = 'buy';
        this.phaseTime = 30;
        
        // Reset players
        for (const player of this.players) {
            player.health = 100;
            player.isAlive = true;
            // Give round money
            player.credits += 3000;
        }
    }

    start() {
        this.engine.init();
    }
}

export default TacticalShooterGame;