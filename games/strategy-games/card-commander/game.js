import { GameEngine, Entity, InputManager } from '../../shared/engine.js';

class Card extends Entity {
    constructor(x, y, cardData) {
        super(x, y, 120, 160);
        this.data = cardData;
        this.isFlipped = false;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
    }

    render(ctx) {
        // Draw card background
        ctx.fillStyle = this.isFlipped ? '#2c3e50' : '#34495e';
        ctx.strokeStyle = '#95a5a6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.width, this.height, 10);
        ctx.fill();
        ctx.stroke();

        if (this.isFlipped) {
            // Draw card content
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(this.data.name, this.x + 10, this.y + 25);
            
            // Draw stats
            ctx.font = '14px Arial';
            ctx.fillText(`Power: ${this.data.power}`, this.x + 10, this.y + 50);
            ctx.fillText(`Cost: ${this.data.cost}`, this.x + 10, this.y + 70);
            
            // Draw card type and description
            ctx.font = 'italic 12px Arial';
            ctx.fillText(this.data.type, this.x + 10, this.y + 90);
            
            // Word wrap description
            const words = this.data.description.split(' ');
            let line = '';
            let y = this.y + 110;
            words.forEach(word => {
                const testLine = line + word + ' ';
                if (ctx.measureText(testLine).width > this.width - 20) {
                    ctx.fillText(line, this.x + 10, y);
                    line = word + ' ';
                    y += 15;
                } else {
                    line = testLine;
                }
            });
            ctx.fillText(line, this.x + 10, y);
        }
    }
}

class CardCommander {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.cards = [];
        this.deck = [];
        this.hand = [];
        this.playArea = [];
        this.graveyard = [];
        this.energy = 3;
        this.maxEnergy = 3;
        this.turn = 1;
        this.selectedCard = null;
        this.setupGame();
    }

    async setupGame() {
        this.engine.init();
        this.createInitialDeck();
        this.setupEventListeners();
        this.drawInitialHand();
        
        // Load background
        try {
            await this.assets.loadImage('background', '../../enemy/game-background.png');
        } catch (error) {
            console.warn('Failed to load background, using fallback');
        }

        // Add background rendering first
        this.engine.addEntity({
            render: (ctx) => {
                if (this.assets.getImage('background')) {
                    ctx.drawImage(this.assets.getImage('background'), 0, 0, this.engine.canvas.width, this.engine.canvas.height);
                }
            }
        });

        // Add game state rendering
        this.engine.addEntity({
            render: (ctx) => this.renderGameState(ctx)
        });

        // Start game loop
        this.gameLoop();
    }

    createInitialDeck() {
        const cardTemplates = [
            { name: 'Warrior', type: 'Unit', power: 3, cost: 2, 
              description: 'Basic fighting unit' },
            { name: 'Archer', type: 'Unit', power: 2, cost: 1, 
              description: 'Ranged attacker' },
            { name: 'Shield Bearer', type: 'Unit', power: 1, cost: 1, 
              description: 'Protects adjacent units' },
            { name: 'War Chief', type: 'Commander', power: 4, cost: 3, 
              description: 'Boosts allied units' power' },
            { name: 'Supply Line', type: 'Strategy', power: 0, cost: 2, 
              description: 'Draw 2 cards' },
            { name: 'Battle Plan', type: 'Strategy', power: 0, cost: 1, 
              description: 'Next card played costs 1 less' }
        ];

        // Create multiple copies of each card
        cardTemplates.forEach(template => {
            for (let i = 0; i < 3; i++) {
                this.deck.push({ ...template });
            }
        });

        // Shuffle deck
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    setupEventListeners() {
        const canvas = this.engine.canvas;

        canvas.addEventListener('mousedown', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Check if a card was clicked
            const clickedCard = this.findCardAt(x, y);
            if (clickedCard) {
                clickedCard.isDragging = true;
                clickedCard.dragOffset.x = x - clickedCard.x;
                clickedCard.dragOffset.y = y - clickedCard.y;
                this.selectedCard = clickedCard;
            }
        });

        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.selectedCard && this.selectedCard.isDragging) {
                this.selectedCard.x = x - this.selectedCard.dragOffset.x;
                this.selectedCard.y = y - this.selectedCard.dragOffset.y;
            }
        });

        canvas.addEventListener('mouseup', () => {
            if (this.selectedCard) {
                // Check if card was dropped in play area
                if (this.selectedCard.y < 300 && this.canPlayCard(this.selectedCard)) {
                    this.playCard(this.selectedCard);
                } else {
                    // Return card to hand
                    this.repositionHand();
                }
                this.selectedCard.isDragging = false;
                this.selectedCard = null;
            }
        });

        // Add end turn button
        const endTurnBtn = document.createElement('button');
        endTurnBtn.textContent = 'End Turn';
        endTurnBtn.onclick = () => this.endTurn();
        document.body.appendChild(endTurnBtn);
    }

    findCardAt(x, y) {
        return [...this.hand, ...this.playArea].find(card => 
            x >= card.x && x <= card.x + card.width &&
            y >= card.y && y <= card.y + card.height
        );
    }

    canPlayCard(card) {
        return this.energy >= card.data.cost;
    }

    playCard(card) {
        this.energy -= card.data.cost;
        this.hand = this.hand.filter(c => c !== card);
        this.playArea.push(card);
        
        // Handle card effects
        if (card.data.type === 'Strategy') {
            if (card.data.name === 'Supply Line') {
                this.drawCards(2);
            }
            // Add more strategy card effects here
        }

        this.repositionPlayArea();
        this.repositionHand();
    }

    drawCards(count) {
        for (let i = 0; i < count; i++) {
            if (this.deck.length === 0) {
                // Shuffle graveyard back into deck
                this.deck = [...this.graveyard];
                this.graveyard = [];
                this.shuffleDeck();
            }
            if (this.deck.length > 0) {
                const cardData = this.deck.pop();
                const card = new Card(0, 0, cardData);
                card.isFlipped = true;
                this.hand.push(card);
            }
        }
        this.repositionHand();
    }

    drawInitialHand() {
        this.drawCards(5);
    }

    endTurn() {
        this.turn++;
        this.energy = Math.min(this.maxEnergy + 1, 10);
        this.maxEnergy = Math.min(this.maxEnergy + 1, 10);
        this.drawCards(1);
    }

    repositionHand() {
        const startX = (this.engine.canvas.width - (this.hand.length * 130)) / 2;
        this.hand.forEach((card, index) => {
            card.x = startX + (index * 130);
            card.y = this.engine.canvas.height - 180;
        });
    }

    repositionPlayArea() {
        const startX = (this.engine.canvas.width - (this.playArea.length * 130)) / 2;
        this.playArea.forEach((card, index) => {
            card.x = startX + (index * 130);
            card.y = 100;
        });
    }

    shuffleDeck() {
        for (let i = this.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
        }
    }

    renderGameState(ctx) {
        // Draw game info
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.fillText(`Turn: ${this.turn}`, 20, 30);
        ctx.fillText(`Energy: ${this.energy}/${this.maxEnergy}`, 20, 60);
        ctx.fillText(`Deck: ${this.deck.length}`, this.engine.canvas.width - 100, 30);
        
        // Draw cards
        [...this.playArea, ...this.hand].forEach(card => card.render(ctx));
    }

    gameLoop() {
        this.engine.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

export default CardCommander;