document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const tabs = document.querySelectorAll('.tab');
    const gameCards = document.querySelectorAll('.game-card');
    const searchInput = document.getElementById('search');
    const searchBtn = document.getElementById('search-btn');
    const gameCategories = document.querySelectorAll('.game-category');
    const playButtons = document.querySelectorAll('.play-btn');
    
    // Add animation class to all game cards
    gameCards.forEach(card => {
        card.classList.add('fade-in');
    });
    
    // Tab filtering functionality
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            tabs.forEach(t => t.classList.remove('active'));
            
            // Add active class to clicked tab
            tab.classList.add('active');
            
            const category = tab.getAttribute('data-category');
            
            // Show/hide game categories based on selection
            if (category === 'all') {
                gameCategories.forEach(section => {
                    section.style.display = 'block';
                });
                gameCards.forEach(card => {
                    card.style.display = 'flex';
                });
            } else {
                // Show only the selected category section
                gameCategories.forEach(section => {
                    if (section.id === `${category}-games`) {
                        section.style.display = 'block';
                    } else {
                        section.style.display = 'none';
                    }
                });
                
                // Show all cards in the visible section
                gameCards.forEach(card => {
                    if (card.getAttribute('data-category') === category) {
                        card.style.display = 'flex';
                    } else {
                        card.style.display = 'none';
                    }
                });
            }
        });
    });
    
    // Search functionality
    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            // If search is empty, reset to show all
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
        
        // Show all categories for search
        gameCategories.forEach(section => {
            section.style.display = 'block';
        });
        
        // Filter cards based on search term
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
        
        // Update tabs to show we're in a search state
        tabs.forEach(t => t.classList.remove('active'));
        
        // Check if categories have visible cards
        gameCategories.forEach(section => {
            let visibleCards = false;
            const categoryCards = section.querySelectorAll('.game-card');
            
            categoryCards.forEach(card => {
                if (card.style.display !== 'none') {
                    visibleCards = true;
                }
            });
            
            if (!visibleCards) {
                section.style.display = 'none';
            }
        });
    }
    
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Play button hover effects
    playButtons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'scale(1.1)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'scale(1)';
        });
        
        button.addEventListener('click', (e) => {
            e.preventDefault();
            const gameName = e.target.closest('.game-card')?.querySelector('h3')?.textContent || 
                             e.target.closest('.featured-game-card')?.querySelector('h3')?.textContent;
            
            if (gameName) {
                alert(`Starting ${gameName}! Game would launch here.`);
            }
        });
    });
    
    // Add scroll reveal animation
    const revealOnScroll = () => {
        const sections = document.querySelectorAll('section');
        
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            
            if (sectionTop < windowHeight - 100) {
                section.classList.add('fade-in');
            }
        });
    };
    
    // Initial check on load
    revealOnScroll();
    
    // Check on scroll
    window.addEventListener('scroll', revealOnScroll);
    
    // Random featured game rotation (would normally be server-side)
    const featuredGames = [
        {
            name: "Monster Arena",
            description: "Battle various creatures in a customizable arena setting. Upgrade your character, unlock new abilities, and become the champion!",
            image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-xNJDB6mWAbJdCybzt9V16t8b4yCXre.png"
        },
        {
            name: "Space Shooter",
            description: "Blast through galaxies, defeat alien ships, and complete thrilling missions. Upgrade your spaceship and discover new worlds!",
            image: "/placeholder.svg?height=200&width=300"
        },
        {
            name: "Time Shifter",
            description: "Solve puzzles by manipulating time and physics. Rewind, fast-forward, and pause time to overcome challenging obstacles and discover the secrets of the universe.",
            image: "/placeholder.svg?height=200&width=300"
        }
    ];
    
    // Change featured game every 10 seconds
    let currentFeaturedIndex = 0;
    
    function updateFeaturedGame() {
        const featuredImage = document.querySelector('.featured-image img');
        const featuredTitle = document.querySelector('.featured-details h3');
        const featuredDescription = document.querySelector('.featured-description');
        
        // Add fade out effect
        featuredImage.style.opacity = '0';
        featuredTitle.style.opacity = '0';
        featuredDescription.style.opacity = '0';
        
        setTimeout(() => {
            // Update content
            const game = featuredGames[currentFeaturedIndex];
            featuredImage.src = game.image;
            featuredTitle.textContent = game.name;
            featuredDescription.textContent = game.description;
            
            // Add fade in effect
            featuredImage.style.opacity = '1';
            featuredTitle.style.opacity = '1';
            featuredDescription.style.opacity = '1';
            
            // Update index for next time
            currentFeaturedIndex = (currentFeaturedIndex + 1) % featuredGames.length;
        }, 500);
    }
    
    // Set interval for featured game rotation
    setInterval(updateFeaturedGame, 10000);
});