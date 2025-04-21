# Stranded Horizons

A multiplayer tactical 2D top-down shooter with ability-based combat.

## Quick Start
```bash
git clone https://github.com/DaaanielTV/online-game.git
cd online-game
npm install
npm run start
```

## Core Features
- Tactical 2D top-down shooter gameplay
- Valorant-inspired ability system
- Real-time multiplayer with dedicated server
- Character classes with unique abilities
- Strategic team-based combat
- Custom map system
- Weapon economy system
- Round-based matches

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