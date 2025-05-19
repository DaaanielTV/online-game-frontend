const WebSocket = require('ws');
const http = require('http');

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Game state
const gameState = {
    players: new Map(),
    rooms: new Map()
};

// Room class to manage game rooms
class Room {
    constructor(id) {
        this.id = id;
        this.players = new Set();
        this.state = 'waiting'; // waiting, playing, ended
        this.round = 1;
        this.attackScore = 0;
        this.defenseScore = 0;
        this.maxPlayers = 10;
    }

    addPlayer(playerId, team) {
        if (this.players.size >= this.maxPlayers) return false;
        this.players.add(playerId);
        return true;
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        if (this.players.size === 0) {
            gameState.rooms.delete(this.id);
        }
    }

    broadcast(message, exclude = null) {
        this.players.forEach(playerId => {
            if (playerId !== exclude) {
                const player = gameState.players.get(playerId);
                if (player && player.ws.readyState === WebSocket.OPEN) {
                    player.ws.send(JSON.stringify(message));
                }
            }
        });
    }
}

// Handle new WebSocket connections
wss.on('connection', (ws) => {
    const playerId = Date.now().toString();
    
    // Store player connection
    gameState.players.set(playerId, {
        ws,
        room: null,
        team: null,
        agent: null,
        position: { x: 0, y: 0 },
        health: 100,
        credits: 800
    });

    // Send player their ID
    ws.send(JSON.stringify({
        type: 'init',
        playerId
    }));

    // Handle messages from clients
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            switch(data.type) {
                case 'join_room':
                    handleJoinRoom(playerId, data.roomId);
                    break;
                case 'create_room':
                    handleCreateRoom(playerId);
                    break;
                case 'update_position':
                    handleUpdatePosition(playerId, data.position);
                    break;
                case 'shoot':
                    handleShoot(playerId, data.direction);
                    break;
                case 'ability':
                    handleAbility(playerId, data.abilityType);
                    break;
                case 'buy':
                    handleBuy(playerId, data.item);
                    break;
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    });

    // Handle disconnection
    ws.on('close', () => {
        const player = gameState.players.get(playerId);
        if (player && player.room) {
            const room = gameState.rooms.get(player.room);
            if (room) {
                room.removePlayer(playerId);
                room.broadcast({
                    type: 'player_left',
                    playerId
                });
            }
        }
        gameState.players.delete(playerId);
    });
});

// Handle room creation
function handleCreateRoom(playerId) {
    const roomId = Date.now().toString();
    const room = new Room(roomId);
    gameState.rooms.set(roomId, room);
    
    const player = gameState.players.get(playerId);
    player.room = roomId;
    room.addPlayer(playerId);

    player.ws.send(JSON.stringify({
        type: 'room_created',
        roomId
    }));
}

// Handle room joining
function handleJoinRoom(playerId, roomId) {
    const room = gameState.rooms.get(roomId);
    if (!room) return;

    const player = gameState.players.get(playerId);
    if (room.addPlayer(playerId)) {
        player.room = roomId;
        
        // Assign team based on current player count
        player.team = room.players.size % 2 === 0 ? 'defense' : 'attack';

        room.broadcast({
            type: 'player_joined',
            playerId,
            team: player.team
        });

        // Send current room state to new player
        player.ws.send(JSON.stringify({
            type: 'room_state',
            players: Array.from(room.players).map(id => ({
                id,
                team: gameState.players.get(id).team,
                position: gameState.players.get(id).position
            }))
        }));
    }
}

// Handle position updates
function handleUpdatePosition(playerId, position) {
    const player = gameState.players.get(playerId);
    if (!player || !player.room) return;

    player.position = position;
    const room = gameState.rooms.get(player.room);
    
    room.broadcast({
        type: 'position_update',
        playerId,
        position
    }, playerId);
}

// Handle shooting
function handleShoot(playerId, direction) {
    const player = gameState.players.get(playerId);
    if (!player || !player.room) return;

    const room = gameState.rooms.get(player.room);
    room.broadcast({
        type: 'player_shoot',
        playerId,
        position: player.position,
        direction
    });
}

// Handle ability usage
function handleAbility(playerId, abilityType) {
    const player = gameState.players.get(playerId);
    if (!player || !player.room) return;

    const room = gameState.rooms.get(player.room);
    room.broadcast({
        type: 'ability_used',
        playerId,
        abilityType,
        position: player.position
    });
}

// Handle buying items
function handleBuy(playerId, item) {
    const player = gameState.players.get(playerId);
    if (!player || !player.room) return;

    // Implement buy logic here
    // Check if player has enough credits, etc.
}

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});