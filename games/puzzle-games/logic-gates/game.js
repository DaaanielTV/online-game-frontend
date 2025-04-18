import { GameEngine, Entity, InputManager } from '../../shared/engine.js';

class LogicGate extends Entity {
    constructor(x, y, type) {
        super(x, y, 60, 40);
        this.type = type; // AND, OR, NOT, XOR
        this.inputs = [];
        this.output = false;
        this.isSelected = false;
        this.inputPoints = [];
        this.outputPoint = { x: this.x + this.width, y: this.y + this.height / 2 };
    }

    updateInputPoints() {
        if (this.type === 'NOT') {
            this.inputPoints = [{
                x: this.x,
                y: this.y + this.height / 2
            }];
        } else {
            this.inputPoints = [
                { x: this.x, y: this.y + this.height * 0.25 },
                { x: this.x, y: this.y + this.height * 0.75 }
            ];
        }
        this.outputPoint = { x: this.x + this.width, y: this.y + this.height / 2 };
    }

    evaluateOutput() {
        switch (this.type) {
            case 'AND':
                this.output = this.inputs.every(input => input);
                break;
            case 'OR':
                this.output = this.inputs.some(input => input);
                break;
            case 'NOT':
                this.output = !this.inputs[0];
                break;
            case 'XOR':
                this.output = this.inputs.reduce((a, b) => a !== b);
                break;
        }
    }

    render(ctx) {
        this.updateInputPoints();
        ctx.strokeStyle = this.isSelected ? '#ffffff' : '#000000';
        ctx.fillStyle = this.output ? '#4CAF50' : '#FF5252';
        ctx.lineWidth = 2;

        // Draw gate body
        ctx.beginPath();
        if (this.type === 'NOT') {
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.x + this.width * 0.8, this.y + this.height / 2);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            
            // Draw NOT circle
            ctx.beginPath();
            ctx.arc(this.x + this.width * 0.8 + 5, this.y + this.height / 2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            ctx.roundRect(this.x, this.y, this.width, this.height, 10);
            ctx.fill();
            ctx.stroke();
        }

        // Draw gate type text
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.type, this.x + this.width / 2, this.y + this.height / 2);

        // Draw input/output points
        ctx.fillStyle = '#FFD700';
        this.inputPoints.forEach(point => {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        ctx.beginPath();
        ctx.arc(this.outputPoint.x, this.outputPoint.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    }
}

class Wire extends Entity {
    constructor(startGate, endGate, startIndex, endIndex) {
        super(0, 0, 0, 0);
        this.startGate = startGate;
        this.endGate = endGate;
        this.startIndex = startIndex;
        this.endIndex = endIndex;
    }

    render(ctx) {
        const start = this.startGate.outputPoint;
        const end = this.endGate.inputPoints[this.endIndex];

        ctx.strokeStyle = this.startGate.output ? '#4CAF50' : '#FF5252';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        
        // Create a curved wire using bezier curve
        const controlPoint1 = {
            x: start.x + (end.x - start.x) / 2,
            y: start.y
        };
        const controlPoint2 = {
            x: start.x + (end.x - start.x) / 2,
            y: end.y
        };
        
        ctx.bezierCurveTo(
            controlPoint1.x, controlPoint1.y,
            controlPoint2.x, controlPoint2.y,
            end.x, end.y
        );
        ctx.stroke();
    }
}

class LogicGatesGame {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.gates = [];
        this.wires = [];
        this.selectedGate = null;
        this.wireStartGate = null;
        this.level = 1;
        this.setup();
    }

    setup() {
        // Create initial level
        this.createLevel(this.level);
        
        // Add click handler for gate selection and wire creation
        window.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        
        // Add keyboard handler for gate creation
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    createLevel(level) {
        this.gates = [];
        this.wires = [];
        this.engine.entities = [];

        switch (level) {
            case 1:
                // Simple NOT gate tutorial
                this.addGate('NOT', 100, 100);
                break;
            case 2:
                // AND gate challenge
                this.addGate('AND', 200, 100);
                break;
            // Add more levels as needed
        }

        // Add input switches
        this.addSwitch(50, 100);
        
        // Add goal display
        this.addGoalDisplay();
    }

    addGate(type, x, y) {
        const gate = new LogicGate(x, y, type);
        this.gates.push(gate);
        this.engine.addEntity(gate);
        return gate;
    }

    addSwitch(x, y) {
        const switchGate = new LogicGate(x, y, 'SWITCH');
        switchGate.toggle = function() {
            this.output = !this.output;
        };
        this.gates.push(switchGate);
        this.engine.addEntity(switchGate);
    }

    addWire(startGate, endGate, startIndex, endIndex) {
        const wire = new Wire(startGate, endGate, startIndex, endIndex);
        this.wires.push(wire);
        this.engine.addEntity(wire);
        
        // Update gate inputs
        endGate.inputs[endIndex] = startGate.output;
        endGate.evaluateOutput();
    }

    handleMouseDown(e) {
        const rect = this.engine.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Check for gate selection
        for (const gate of this.gates) {
            if (x >= gate.x && x <= gate.x + gate.width &&
                y >= gate.y && y <= gate.y + gate.height) {
                if (this.wireStartGate) {
                    this.addWire(this.wireStartGate, gate, 0, 0);
                    this.wireStartGate = null;
                } else {
                    this.wireStartGate = gate;
                }
                return;
            }
        }
    }

    handleMouseMove(e) {
        const rect = this.engine.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (this.selectedGate) {
            this.selectedGate.x = x - this.selectedGate.width / 2;
            this.selectedGate.y = y - this.selectedGate.height / 2;
        }
    }

    handleKeyDown(e) {
        // Add new gates with keyboard shortcuts
        switch (e.key.toUpperCase()) {
            case 'A':
                this.addGate('AND', 100, 100);
                break;
            case 'O':
                this.addGate('OR', 100, 100);
                break;
            case 'N':
                this.addGate('NOT', 100, 100);
                break;
            case 'X':
                this.addGate('XOR', 100, 100);
                break;
        }
    }

    addGoalDisplay() {
        this.engine.addEntity({
            render: (ctx) => {
                ctx.fillStyle = '#ffffff';
                ctx.font = '24px Arial';
                ctx.fillText(`Level ${this.level}`, 20, 40);
                ctx.font = '16px Arial';
                ctx.fillText('Press A/O/N/X to add gates', 20, 70);
                ctx.fillText('Click gates to connect with wires', 20, 90);
            }
        });
    }

    start() {
        this.engine.init();
    }
}

export default LogicGatesGame;