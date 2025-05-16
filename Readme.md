# Browser Game Portal

A collection of browser-based games built with vanilla JavaScript, HTML5 Canvas, and CSS.

## Features

- Pure JavaScript implementation - no external dependencies
- HTML5 Canvas-based game engine
- Multiple game categories:
  - Action Games
  - Puzzle Games
  - RPG Games
  - Strategy Games
- Responsive design
- Asset management system
- Input handling system

## Controls
- WASD/Arrow Keys: Movement
- Left Mouse: Shoot
- Right Mouse: Aim/Scope
- Q: Ability 1 (Signature)
- E: Ability 2 (Basic)
- C: Ability 3 (Tactical)
- X: Ultimate Ability
- B: Buy Menu
- Tab: Scoreboard
- M: Map
- 1-5: Weapon Selection

## Character Abilities
Each agent has 4 unique abilities:
- Signature Ability (Q) - Free each round
- Basic Ability (E) - Must be purchased
- Tactical Ability (C) - Must be purchased
- Ultimate Ability (X) - Requires ultimate points

## Technical Requirements
- Modern web browser (Chrome 80+, Firefox 75+, Edge 80+, Safari 13.1+)
- JavaScript enabled
- WebSocket support
- 512MB RAM minimum
- Stable internet connection for multiplayer

## Server Setup
1. Install Node.js 14+
2. Navigate to server directory
3. Run `npm install`
4. Configure server settings in `config.json`
5. Start server with `npm run server`

## Game Systems
### Round System
- Buy Phase (30 seconds)
- Action Phase (100 seconds)
- Plant/Defuse mechanics
- Economy management

### Weapon System
- Primary weapons
- Secondary weapons
- Armor system
- Economy management

### Ability System
- Cooldown management
- Resource management
- Area effects
- Status effects

### Multiplayer Features
- Real-time synchronization
- Team coordination
- Voice chat support
- Match history
- Leaderboards

## Performance Optimization
- Efficient network protocol
- Client prediction
- Server reconciliation
- Delta compression
- Entity interpolation