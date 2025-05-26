/**
 * Main Game Configuration and Initialization
 * Defines available games and their metadata
 */

const GAMES = {
    action: [
        {
            name: "Monster Arena",
            description: "Battle various creatures in a customizable arena setting",
            image: "enemy/player-avatar.png",
            path: "games/action-games/monster-arena"
        },
        {
            name: "Robot Wars",
            description: "Build and battle robots with various parts",
            image: "enemy/player-avatar.png",
            path: "games/action-games/robot-wars"
        },
        {
            name: "Space Shooter",
            description: "Fight through space in this exciting shooter",
            image: "enemy/space-background.png",
            path: "games/action-games/space-shooter"
        }
    ],
    puzzle: [
        {
            name: "Color Match",
            description: "Match colors to solve puzzles",
            image: "enemy/nature-background.png",
            path: "games/puzzle-games/color-match"
        },
        {
            name: "Time Shifter",
            description: "Manipulate time to solve puzzles",
            image: "enemy/mystic-forest-background.png",
            path: "games/puzzle-games/time-shifter"
        },
        {
            name: "Logic Gates",
            description: "Build circuits using logic gates",
            image: "enemy/wall.png",
            path: "games/puzzle-games/logic-gates"
        }
    ],
    rpg: [
        {
            name: "Dungeon Crawler",
            description: "Explore dungeons, fight monsters, find treasure",
            image: "enemy/door.png",
            path: "games/rpg-games/dungeon-crawler"
        },
        {
            name: "Monster Tamer",
            description: "Catch and train monsters",
            image: "enemy/tricaluctus(underwater-monster).png",
            path: "games/rpg-games/monster-tamer"
        },
        {
            name: "Magic Academy",
            description: "Learn spells and become a powerful wizard",
            image: "enemy/mystic-forest-background.png",
            path: "games/rpg-games/magic-academy"
        }
    ],
    strategy: [
        {
            name: "City Planner",
            description: "Build and manage your own city",
            image: "enemy/city-planner.png",
            path: "games/strategy-games/city-planner"
        },
        {
            name: "Trade Routes",
            description: "Establish and manage trade routes between cities",
            image: "enemy/the-trader.png",
            path: "games/strategy-games/trade-routes"
        },
        {
            name: "Space Colony",
            description: "Build and manage a colony in space",
            image: "enemy/space-background.png",
            path: "games/strategy-games/space-colony"
        }
    ],
    simulation: [
        {
            name: "Zoo Keeper",
            description: "Manage a zoo and take care of animals",
            image: "enemy/elephant.png",
            path: "games/simulation-games/zoo-keeper"
        },
        {
            name: "Farm Life",
            description: "Run a farm and grow your agricultural empire",
            image: "enemy/nature-background.png",
            path: "games/simulation-games/farm-life"
        },
        {
            name: "Restaurant Rush",
            description: "Run a busy restaurant and serve customers",
            image: "enemy/wall.png",
            path: "games/simulation-games/restaurant-rush"
        }
    ]
};

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const tabs = document.querySelectorAll('.tab');
    const gameCards = document.querySelectorAll('.game-card');
    const searchInput = document.getElementById('search');
    const searchBtn = document.getElementById('search-btn');
    const gameCategories = document.querySelectorAll('.game-category');
    const gameContainer = document.getElementById('game-container');
    const gamesList = document.getElementById('games-list');
    
    // Initialize game categories
    initGameCategories();
    
    // Add animation class to all game cards
    gameCards.forEach(card => {
        card.classList.add('fade-in');
    });
    
    // Tab filtering functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const category = tab.getAttribute('data-category');
            filterGames(category);
        });
    });
    
    function filterGames(category) {
        if (category === 'all') {
            gameCategories.forEach(section => {
                section.style.display = 'block';
            });
            gameCards.forEach(card => {
                card.style.display = 'flex';
            });
        } else {
            gameCategories.forEach(section => {
                if (section.id === `${category}-games`) {
                    section.style.display = 'block';
                } else {
                    section.style.display = 'none';
                }
            });
        }
    }
    
    // Search functionality
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelector('[data-category="all"]').classList.add('active');
            filterGames('all');
            return;
        }
        
        gameCategories.forEach(section => {
            section.style.display = 'block';
            const cards = section.querySelectorAll('.game-card');
            let hasVisibleCards = false;
            
            cards.forEach(card => {
                const title = card.querySelector('h3').textContent.toLowerCase();
                const description = card.querySelector('p').textContent.toLowerCase();
                
                if (title.includes(searchTerm) || description.includes(searchTerm)) {
                    card.style.display = 'flex';
                    hasVisibleCards = true;
                } else {
                    card.style.display = 'none';
                }
            });
            
            section.style.display = hasVisibleCards ? 'block' : 'none';
        });
        
        tabs.forEach(t => t.classList.remove('active'));
    }
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });
    
    function initGameCategories() {
        // Initialize each game category
        for (const [category, games] of Object.entries(GAMES)) {
            const container = document.querySelector(`#${category}-games .game-grid`);
            if (!container) continue;
            
            container.innerHTML = ''; // Clear existing content
            
            games.forEach(game => {
                const gameCard = document.createElement('div');
                gameCard.className = 'game-card fade-in';
                gameCard.setAttribute('data-category', category);
                gameCard.innerHTML = `
                    <div class="game-img-container">
                        <img src="${game.image}" alt="${game.name}" class="game-img">
                    </div>
                    <h3>${game.name}</h3>
                    <p>${game.description}</p>
                    <button class="play-btn" data-game="${game.path}">Play Now</button>
                `;
                
                const playBtn = gameCard.querySelector('.play-btn');
                playBtn.addEventListener('click', () => launchGame(game.path));
                
                container.appendChild(gameCard);
            });
        }
    }
    
    window.showGameList = function() {
        gameContainer.style.display = 'none';
        gamesList.style.display = 'block';
        if (window.game) {
            window.game.setState('paused');
        }
    };
    
    function launchGame(gamePath) {
        gamesList.style.display = 'none';
        gameContainer.style.display = 'block';
        
        // Initialize the main game for now
        // In the future, this could load different games based on the path
        if (!window.game) {
            window.game = new Game('gameCanvas');
        } else {
            window.game.resetGame();
            window.game.setState('playing');
        }
    }
});
