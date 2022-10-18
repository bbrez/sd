import { WebSocketServer } from 'ws';

const server = new WebSocketServer({
    port: 1234,
});

let sockets = [];
server.on('connection', (socket) => {
    console.log("new connection");

    sockets.push(socket);

    socket.on('message', (msg) => {
        console.log('[received]:' + msg);

        let msg_json = JSON.parse(msg.toString());
        if (msg_json.type == "message") {
            sockets.forEach(s => s.send(JSON.stringify(msg_json)));
        }

    });

    socket.on('close', () => {
        sockets = sockets.filter(s => s !== socket);
    })
})