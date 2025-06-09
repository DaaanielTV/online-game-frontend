import { GameEngine, Entity, InputManager, AssetManager } from './shared/engine.js';

/**
 * Merged Games Module
 * Contains all game implementations from the games directory
 */

// Base Entity Class - verwendet die shared Entity class
class Character extends Entity {
    constructor(x, y) {
        super(x, y, 40, 40);
        this.health = 100;
        this.maxHealth = 100;
        this.level = 1;
        this.experience = 0;
        this.speed = 3;
        this.inventory = [];
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
    }
}

class Monster extends Entity {
    constructor(x, y, type) {
        super(x, y, 50, 50);
        this.type = type;
        this.level = 1;
        this.experience = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.attack = 10;
        this.defense = 5;
    }
}

// Building and Structure Classes
class Building extends Entity {
    constructor(x, y, type, size = 1) {
        super(x, y, size * 40, size * 40);
        this.type = type;
        this.size = size;
        this.level = 1;
    }
}

// Game Base Class - Basisfunktionalität für alle Spiele
class GameBase {
    constructor(canvasId) {
        this.engine = new GameEngine(canvasId);
        this.input = new InputManager();
        this.assets = new AssetManager();
        this.setupGame();
    }

    async setupGame() {
        try {
            await this.loadAssets();
            this.engine.init();
        } catch (error) {
            console.error('Failed to setup game:', error);
        }
    }

    async loadAssets() {
        // Implementierung in Unterklassen
    }

    update(deltaTime) {
        // Implementierung in Unterklassen
    }

    render(ctx) {
        // Implementierung in Unterklassen
    }
}

// Specific Game Classes - Erben von GameBase
class CardCommander extends GameBase {
    constructor(canvasId) {
        super(canvasId);
        this.cards = [];
    }
}

class CityPlanner extends GameBase {
    constructor(canvasId) {
        super(canvasId);
        this.buildings = [];
        this.resources = {
            money: 1000,
            materials: 100,
            population: 0
        };
    }
}

class Farm extends GameBase {
    constructor(canvasId) {
        super(canvasId);
        this.crops = [];
        this.resources = {
            money: 2000,
            seeds: 100,
            water: 200
        };
    }
}

class HospitalManager extends GameBase {
    constructor(canvasId) {
        super(canvasId);
        this.patients = [];
        this.rooms = [];
        this.staff = [];
    }
}

class MagicAcademyGame extends GameBase {
    constructor(canvasId) {
        super(canvasId);
        this.spells = [];
        this.students = [];
    }
}

class MonsterTamerGame extends GameBase {
    constructor(canvasId) {
        super(canvasId);
        this.monsters = [];
        this.items = [];
    }
}

class PetShelter extends GameBase {
    constructor(canvasId) {
        super(canvasId);
        this.pets = [];
        this.facilities = [];
    }
}

class PixelHeroesGame extends GameBase {
    constructor(canvasId) {
        super(canvasId);
        this.heroes = [];
        this.quests = [];
    }
}

class RestaurantRush extends GameBase {
    constructor(canvasId) {
        super(canvasId);
        this.customers = [];
        this.stations = [];
    }
}

class SpaceColonyGame extends GameBase {
    constructor(canvasId) {
        super(canvasId);
        this.modules = [];
        this.resources = {
            oxygen: 100,
            energy: 100,
            minerals: 50
        };
    }
}

class TinyEmpireGame extends GameBase {
    constructor(canvasId) {
        super(canvasId);
        this.buildings = [];
        this.units = [];
    }
}

class TradeRoutesGame extends GameBase {
    constructor(canvasId) {
        super(canvasId);
        this.routes = [];
        this.cities = [];
    }
}

class ZooKeeper extends GameBase {
    constructor(canvasId) {
        super(canvasId);
        this.animals = [];
        this.enclosures = [];
    }
}

// Export all game classes
export {
    CardCommander,
    CityPlanner,
    Farm,
    HospitalManager,
    MagicAcademyGame,
    MonsterTamerGame,
    PetShelter,
    PixelHeroesGame,
    RestaurantRush,
    SpaceColonyGame,
    TinyEmpireGame,
    TradeRoutesGame,
    ZooKeeper
};
