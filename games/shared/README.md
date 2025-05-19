# Shared Game Components

This directory contains shared components and utilities used across all games in the project.

## Directory Structure

- `engine.js` - Core game engine providing canvas management and game loop functionality
- `js/` - Shared JavaScript utilities and helper functions
  - `shared-game.js` - Common game mechanics and utilities
- `assets/` - Shared assets (images, sounds, etc.) used across multiple games

## Usage Guidelines

1. All shared code must follow the project's code-rules.md guidelines
2. Each function and class must include JSDoc comments
3. Keep shared components modular and loosely coupled
4. Document any breaking changes in the devlog

## Best Practices

- Use the shared engine for consistent game loop management
- Import shared utilities using relative paths
- Document any game-specific modifications to shared components
- Test changes against multiple games before updating shared code
