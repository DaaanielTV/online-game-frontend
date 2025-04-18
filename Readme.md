# Stranded Horizons

A multiplayer survival browser-based game with dynamic combat and resource management.

## How to Clone

```bash
git clone https://github.com/DaaanielTV/online-game.git
cd online-game
```

## Game Features

### Existing Features
- Full screen background with responsive canvas
- Wave-based combat system with increasing difficulty
- Power-up system with temporary boosts (health, speed, invincibility)
- Upgradeable character stats (speed, damage, health, attack speed)
- Random entity spawning with improved AI behavior
- Click-based combat system with arrow shooting mechanics
- Line of sight mechanics for enemy attacks
- Automatic game state saving using IndexedDB
- Wall-based obstacle system
- Player score and coin tracking
- Trader system for strategic enemy removal
- Dynamic difficulty scaling
- Enhanced visual effects and UI feedback

### New Features
- Elemental damage system (fire, ice, poison) for weapons
- Character classes with unique abilities (Warrior, Archer, Mage)
- Experience points and leveling system
- Day/night cycle affecting gameplay mechanics
- Weather effects (rain, storm, fog) impacting visibility
- Inventory system with item management
- Crafting system for weapons and tools
- Quest system with rewards
- Mini-map with fog of war
- Character skill trees
- Boss battles with unique mechanics
- Social features (emotes, chat)
- Achievement system
- Daily challenges and rewards
- Pet system with companion abilities
- Resource nodes (mining, harvesting)
- Building system for player bases
- Player guilds/clans
- Trading system between players
- Customizable character appearance
- Special events and seasonal content
- Leaderboards and rankings
- Player statistics tracking
- Sound effects and background music
- Tutorial system for new players
- Checkpoint/save system

## Setup Instructions

### Local Development
1. Open the game in a modern web browser (Chrome, Firefox, Edge recommended)
2. The game automatically sets up the IndexedDB database on first run
3. No additional setup required - the game saves progress automatically

### Nginx Server Configuration
1. Install Nginx on your server
2. Create a new configuration file in `/etc/nginx/conf.d/game.conf`:
```nginx
server {
    listen 80;
    server_name yourgamedomain.com;  # Replace with your domain
    root /var/www/html/game;  # Replace with your game files location

    # Enable compression
    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;
    gzip_min_length 1000;

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-XSS-Protection "1; mode=block";
    add_header X-Content-Type-Options "nosniff";
}
```

3. Deploy your game files to the server:
```bash
scp -r ./* user@yourserver:/var/www/html/game/
```

4. Test Nginx configuration and restart:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## How to Play
- Use WASD or arrow keys to move the player
- Click to shoot arrows at enemies
- Collect power-ups for temporary boosts:
  - Red: Health boost
  - Yellow: Speed boost
  - Blue: Temporary invincibility
- Survive waves of enemies that get progressively harder
- Defeat enemies to earn coins and score
- Use the shop to upgrade your character:
  - Speed: Move faster
  - Damage: Deal more damage
  - Health: Increase max health
  - Attack Speed: Shoot arrows faster
- Find and use traders to clear half of the current enemies
- Your progress is automatically saved

## Wave System
- Each wave spawns more enemies than the last
- Enemies get stronger with each wave:
  - More health
  - Increased damage
  - Faster movement
- Complete waves to earn bonus coins and score
- No limit to how many waves you can survive

## Technical Requirements
- Modern web browser with IndexedDB support
- JavaScript enabled
- For server deployment:
  - Nginx 1.18+ recommended
  - 512MB RAM minimum
  - 1GB storage space
  - Modern CPU (single core sufficient)

## Database Details
The game uses IndexedDB for client-side storage:
- Database name: 'gameDB'
- Store name: 'gameState'
- Automatically saves:
  - Player position
  - Health and stats
  - Score and coins
  - Upgrade levels
  - Current wave
- Loads previous game state on startup

## Performance Optimization
- Efficient collision detection
- Image preloading
- Compressed assets
- Cached static files when served through Nginx
- Optimized game loop with requestAnimationFrame
- Efficient entity management

## Browser Support
- Chrome 80+
- Firefox 75+
- Edge 80+
- Safari 13.1+
- Opera 67+