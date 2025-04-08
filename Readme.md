# Stranded Horizons

## Game Features
- Full screen background with responsive canvas
- Random entity spawning every 5 seconds
- Click-based combat system
- Automatic game state saving using IndexedDB
- Player score tracking

## Setup Instructions

1. Open the game in a modern web browser (Chrome, Firefox, Edge recommended)
2. The game automatically sets up the IndexedDB database on first run
3. No additional setup required - the game saves progress automatically

## How to Play
- Use WASD or arrow keys to move the player
- Click on entities to deal damage (each click deals 20 damage)
- Entities spawn randomly every 5 seconds
- Defeat entities to earn points
- Your progress is automatically saved

## Development
Development started on 07.04.2025

## Database Details
The game uses IndexedDB for client-side storage:
- Database name: 'gameDB'
- Store name: 'gameState'
- Automatically saves player position, health, and score
- Loads previous game state on startup

## Technical Requirements
- Modern web browser with IndexedDB support
- JavaScript enabled
- Local file access or web server to serve the game files