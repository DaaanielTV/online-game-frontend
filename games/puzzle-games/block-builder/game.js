// 10. Block Builder: Physics-based construction puzzle game

import { GameEngine, Entity, InputManager } from '../../shared/engine.js';

class ColorTile extends Entity {
    constructor(x, y, color, size = 60) {
        super(x, y, size, size);
        this.color = color;
        this.targetColor = null;
        this.isSelected = false;
        this.isMatched = false;
        this.animation = 0;
        this.targetColor = this.getRandomColor();


        // implemtnt block builder game
        this.isBlock = false;
        this.blockColor = this.getRandomColor();
    }

    // look at my codebase and code this minigame like the other minigames
    getRandomColor() {
        const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange'];
        return colors[Math.floor(Math.random() * colors.length)];



        export default ColorGame;
    }