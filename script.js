document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const tabs = document.querySelectorAll('.tab');
    const gameCards = document.querySelectorAll('.game-card');
    const searchInput = document.getElementById('search');
    const searchBtn = document.getElementById('search-btn');
    const gameCategories = document.querySelectorAll('.game-category');
    const playButtons = document.querySelectorAll('.play-btn');
    
    // Tab filtering functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const category = tab.getAttribute('data-category');
            
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
        });
    });

    // Search functionality
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelector('[data-category="all"]').classList.add('active');
            
            gameCategories.forEach(section => {
                section.style.display = 'block';
            });
            
            gameCards.forEach(card => {
                card.style.display = 'flex';
            });
            return;
        }
        
        gameCategories.forEach(section => {
            section.style.display = 'block';
        });
        
        let hasResults = false;
        gameCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            const description = card.querySelector('p').textContent.toLowerCase();
            
            if (title.includes(searchTerm) || description.includes(searchTerm)) {
                card.style.display = 'flex';
                hasResults = true;
            } else {
                card.style.display = 'none';
            }
        });
    }
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Game loading functionality
    function loadGame(gamePath) {
        // Create game container
        const gameContainer = document.createElement('div');
        gameContainer.className = 'game-container';
        gameContainer.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: #000; z-index: 1000;';
        
        // Add back button
        const backBtn = document.createElement('button');
        backBtn.textContent = '← Back to Games';
        backBtn.style.cssText = 'position: absolute; top: 20px; left: 20px; z-index: 1001; padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer;';
        backBtn.addEventListener('click', () => {
            gameContainer.remove();
            document.body.style.overflow = 'auto';
        });
        
        // Create game iframe
        const gameFrame = document.createElement('iframe');
        gameFrame.src = gamePath;
        gameFrame.style.cssText = 'width: 100%; height: 100%; border: none;';
        
        gameContainer.appendChild(backBtn);
        gameContainer.appendChild(gameFrame);
        document.body.appendChild(gameContainer);
        document.body.style.overflow = 'hidden';
    }

    // Handle play button clicks
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('play-btn')) {
            e.preventDefault();
            const link = e.target.getAttribute('href');
            if (link) {
                loadGame(link);
            }
        }
    });
});