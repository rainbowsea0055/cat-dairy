const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 10000 });

const rooms = new Map();

wss.on('connection', (ws) => {
    let currentRoom = null;

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.type === 'JOIN') {
                const roomId = data.roomId;
                currentRoom = roomId;
                
                if (!rooms.has(roomId)) {
                    rooms.set(roomId, []);
                }
                rooms.get(roomId).push(ws);
                
                ws.send(JSON.stringify({ type: 'JOINED', roomId }));
            }
            else if (currentRoom) {
                const roomClients = rooms.get(currentRoom) || [];
                roomClients.forEach(client => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify(data));
                    }
                });
            }
        } catch (e) {
            console.error('消息处理错误:', e);
        }
    });

    ws.on('close', () => {
        if (currentRoom) {
            const roomClients = rooms.get(currentRoom);
            if (roomClients) {
                const index = roomClients.indexOf(ws);
                if (index > -1) roomClients.splice(index, 1);
                if (roomClients.length === 0) rooms.delete(currentRoom);
            }
        }
    });
});

console.log('WebSocket 服务器已启动');
