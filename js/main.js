// Game data
const GAMES = {
    action: [
        {
            name: "Monster Arena",
            description: "Battle various creatures in a customizable arena setting",
            image: "enemy/monster.png"
        },
        {
            name: "Robot Wars",
            description: "Build and battle robots with various parts",
            image: "enemy/robot.png"
        },
        {
            name: "Ninja Runner",
            description: "Run, jump, and fight through obstacle courses",
            image: "enemy/ninja.png"
        }
    ],
    puzzle: [
        {
            name: "Color Match",
            description: "Match colors to solve puzzles",
            image: "enemy/colors.png"
        },
        {
            name: "Logic Gates",
            description: "Build circuits using logic gates",
            image: "enemy/logic.png"
        },
        {
            name: "Time Shifter",
            description: "Manipulate time to solve puzzles",
            image: "enemy/time.png"
        }
    ],
    rpg: [
        {
            name: "Dungeon Crawler",
            description: "Explore dungeons, fight monsters, find treasure",
            image: "enemy/dungeon.png"
        },
        {
            name: "Monster Tamer",
            description: "Catch and train monsters",
            image: "enemy/tamer.png"
        },
        {
            name: "Pixel Heroes",
            description: "Classic RPG adventure",
            image: "enemy/hero.png"
        }
    ],
    strategy: [
        {
            name: "City Planner",
            description: "Build and manage your own city",
            image: "enemy/city.png"
        },
        {
            name: "Space Colony",
            description: "Establish a colony in space",
            image: "enemy/space.png"
        },
        {
            name: "Trade Routes",
            description: "Manage trade between cities",
            image: "enemy/trade.png"
        }
    ]
};

// Initialize games when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize featured game rotation
    initFeaturedGames();

    // Initialize game categories
    initGameCategories();

    // Initialize main game
    const game = new Game('gameCanvas');
});

function initFeaturedGames() {
    const featuredGames = [
        ...GAMES.action,
        ...GAMES.puzzle,
        ...GAMES.rpg,
        ...GAMES.strategy
    ];
    let currentFeaturedIndex = 0;

    function updateFeaturedGame() {
        const game = featuredGames[currentFeaturedIndex];
        const featuredDisplay = document.getElementById('featured-display');
        
        featuredDisplay.innerHTML = `
            <div class="featured-game-card">
                <img src="${game.image}" alt="${game.name}" class="featured-game-img">
                <h3>${game.name}</h3>
                <p>${game.description}</p>
                <button class="play-btn">Play Now</button>
            </div>
        `;

        currentFeaturedIndex = (currentFeaturedIndex + 1) % featuredGames.length;
    }

    // Update featured game initially and every 10 seconds
    updateFeaturedGame();
    setInterval(updateFeaturedGame, 10000);
}

function initGameCategories() {
    // Initialize each game category
    for (const [category, games] of Object.entries(GAMES)) {
        const container = document.querySelector(`#${category}-games .game-grid`);
        
        games.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            gameCard.innerHTML = `
                <div class="game-img-container">
                    <img src="${game.image}" alt="${game.name}" class="game-img">
                </div>
                <h3>${game.name}</h3>
                <p>${game.description}</p>
                <button class="play-btn">Play</button>
            `;
            
            // Add click handler for play button
            const playBtn = gameCard.querySelector('.play-btn');
            playBtn.addEventListener('click', () => startGame(game));
            
            container.appendChild(gameCard);
        });
    }
}

function startGame(game) {
    // Hide main content
    document.querySelector('main').style.display = 'none';
    
    // Show game canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'gameCanvas';
    document.body.appendChild(canvas);
    
    // Initialize game
    new Game('gameCanvas');
    
    // Add return button
    const returnBtn = document.createElement('button');
    returnBtn.textContent = 'Return to Menu';
    returnBtn.className = 'return-btn';
    returnBtn.addEventListener('click', () => {
        canvas.remove();
        returnBtn.remove();
        document.querySelector('main').style.display = 'block';
    });
    document.body.appendChild(returnBtn);
}
