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
// fix this error [{	"resource": "/e:/!Coding-Enviroment/online-game/games/puzzle-games/block-builder/game.js",
//	"owner": "typescript",
	//"code": "1005",
	//"severity": 8,
	//"message": "'}' expected.",
	//"source": "ts",
	//"startLineNumber": 29,
	//"startColumn": 6,
	//"endLineNumber": 29,
//	"endColumn": 6
//}]

// fix this error above please



//fix this error above, this one: // '}' expected.

// what for ideas do you have for block builder game?
// make a list of ideas for block builder game
// 1. Players can build structures using different colored blocks.

// implement 1 in javascript

if selected block is not matched with target color, then change the color of the selected block to the target color
then this.animation = 1;
BigUint64Array.from(this.color) = this.targetColor;

if this.animation == 1, then animate the block to the target color

else if this.animation == 0, then animate the block to the original color

// else if this.animation == 2, then animate the block to the target color
// else if this.animation == 3, then animate the block to the original color
// 2. Players can use physics to build stable structures.

// 3. Players can unlock new block types and colors as they progress through the game.



// 2. Players can create their own levels and share them with others.
// 3. Players can solve puzzles by arranging blocks in a specific order.
// 4. Players can compete against each other to build the tallest structure.
// 5. Players can use physics to their advantage to create stable structures.
// 6. Players can unlock new block types and colors as they progress through the game.
// 7. Players can use power-ups to help them build faster or more efficiently.
// 8. Players can customize their blocks with different patterns and designs.
// 9. Players can create their own custom blocks using a block editor.
// 10. Players can earn rewards for completing levels and challenges.
// 11. Players can use a variety of tools to manipulate blocks, such as rotate, scale, and move.
// 12. Players can create their own custom levels using a level editor.
// 13. Players can use a variety of materials to build with, such as wood, stone, and metal.
// 14. Players can create their own custom materials using a material editor.
// 15. Players can use a variety of textures to customize their blocks.
// 16. Players can create their own custom textures using a texture editor.

    }
    update() {

        export default ColorGame;
    }