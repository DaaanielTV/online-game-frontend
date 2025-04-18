import { GameEngine, Entity, InputManager } from '../../shared/engine.js';

class WordGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.score = 0;
        this.timeLeft = 60; // 60 seconds per round
        this.currentWord = '';
        this.scrambledWord = '';
        this.userInput = '';
        this.wordList = [
            'PUZZLE', 'GAMING', 'PLAYER', 'LEVEL', 'SCORE',
            'BONUS', 'POWER', 'QUICK', 'JUMPS', 'PRIZE',
            'STAGE', 'FINAL', 'BRAIN', 'SMART', 'SOLVE',
            'THINK', 'LOGIC', 'SKILL', 'CHALLENGE', 'MASTER'
        ];
        this.isGameOver = false;
        this.gameStarted = false;
        this.setup();
    }

    setup() {
        // Add keyboard input handling
        document.addEventListener('keydown', (e) => this.handleKeyInput(e));

        // Add UI rendering
        this.engine.addEntity({
            render: (ctx) => this.render(ctx)
        });

        // Add game loop update
        this.engine.update = (deltaTime) => this.update(deltaTime);
    }

    handleKeyInput(e) {
        if (!this.gameStarted) {
            if (e.key === 'Enter') {
                this.startGame();
            }
            return;
        }

        if (this.isGameOver) {
            if (e.key === 'Enter') {
                this.resetGame();
            }
            return;
        }

        if (e.key === 'Backspace') {
            e.preventDefault();
            this.userInput = this.userInput.slice(0, -1);
        } else if (e.key === 'Enter') {
            this.checkAnswer();
        } else if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
            this.userInput += e.key.toUpperCase();
        }
    }

    startGame() {
        this.gameStarted = true;
        this.score = 0;
        this.timeLeft = 60;
        this.selectNewWord();
    }

    resetGame() {
        this.isGameOver = false;
        this.gameStarted = false;
        this.score = 0;
        this.timeLeft = 60;
        this.userInput = '';
    }

    selectNewWord() {
        // Pick a random word
        this.currentWord = this.wordList[Math.floor(Math.random() * this.wordList.length)];
        this.scrambledWord = this.scrambleWord(this.currentWord);
        this.userInput = '';
    }

    scrambleWord(word) {
        let scrambled = word.split('');
        for (let i = scrambled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [scrambled[i], scrambled[j]] = [scrambled[j], scrambled[i]];
        }
        // Make sure the scrambled word is different from the original
        if (scrambled.join('') === word) {
            return this.scrambleWord(word);
        }
        return scrambled.join('');
    }

    checkAnswer() {
        if (this.userInput.toUpperCase() === this.currentWord) {
            // Correct answer
            this.score += Math.ceil(this.timeLeft / 10); // More points for faster answers
            if (this.timeLeft > 0) {
                this.selectNewWord();
            }
        } else {
            // Wrong answer - small time penalty
            this.timeLeft = Math.max(0, this.timeLeft - 3);
        }
        this.userInput = '';
    }

    update(deltaTime) {
        if (!this.gameStarted || this.isGameOver) return;

        // Update timer
        this.timeLeft -= deltaTime / 60; // Convert to seconds
        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.isGameOver = true;
        }
    }

    render(ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        
        if (!this.gameStarted) {
            // Show start screen
            ctx.font = '48px Arial';
            ctx.fillText('Word Scramble', this.engine.canvas.width / 2, 200);
            ctx.font = '24px Arial';
            ctx.fillText('Press ENTER to Start', this.engine.canvas.width / 2, 300);
            return;
        }

        if (this.isGameOver) {
            // Show game over screen
            ctx.font = '48px Arial';
            ctx.fillText('Game Over!', this.engine.canvas.width / 2, 200);
            ctx.font = '32px Arial';
            ctx.fillText(`Final Score: ${this.score}`, this.engine.canvas.width / 2, 270);
            ctx.font = '24px Arial';
            ctx.fillText('Press ENTER to Play Again', this.engine.canvas.width / 2, 340);
            return;
        }

        // Draw game UI
        ctx.font = '24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Score: ${this.score}`, 20, 40);
        ctx.fillText(`Time: ${Math.ceil(this.timeLeft)}s`, 20, 80);

        // Draw scrambled word
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.scrambledWord, this.engine.canvas.width / 2, 200);

        // Draw input box
        const inputBoxWidth = 400;
        const inputBoxHeight = 50;
        const inputBoxX = (this.engine.canvas.width - inputBoxWidth) / 2;
        const inputBoxY = 250;

        ctx.fillStyle = '#333333';
        ctx.fillRect(inputBoxX, inputBoxY, inputBoxWidth, inputBoxHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '32px Arial';
        ctx.fillText(this.userInput, this.engine.canvas.width / 2, inputBoxY + 35);

        // Draw instructions
        ctx.font = '20px Arial';
        ctx.fillText('Type your answer and press ENTER', this.engine.canvas.width / 2, 350);
    }

    start() {
        this.engine.init();
    }
}

export default WordGame;