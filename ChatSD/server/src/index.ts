import { WebSocketServer, WebSocket } from 'ws';
import { PrismaClient, User } from '@prisma/client';
import { add_user, chat_update, connect, login, message, new_chat, register, remove_user, user_update } from './lib/handlers';

const prisma = new PrismaClient();

const server = new WebSocketServer({
    port: 1234,
});


class UserSocket {
    user !: User;
    socket !: WebSocket;
}

let connections = new Array<UserSocket>();


//TODO logged user handling
async function main() {
    server.on('connection', async (socket) => {
        console.log("[new connection]");

        socket.on('message', async (msg) => {
            console.log('[received]:' + msg);

            let msgData = JSON.parse(msg.toString());

            switch (msgData.type) {
                case "register": {
                    register(socket, msgData);
                    break;
                }

                case "login": {
                    login(socket, msgData);
                    break;
                }

                case "connect": {
                    let usr = await connect(socket, msgData);
                    if (usr == null) throw "connection error";
                    connections.push({ user: usr, socket: socket });
                    break;
                }

                case "new_chat": {
                    new_chat(socket, msgData);
                    break;
                }

                case "add_user": {
                    add_user(socket, msgData);
                    break;
                }

                case "remove_user": {
                    remove_user(socket, msgData);
                    break;
                }

                case "message": {
                    let msg = await message(socket, msgData);
                    if (msg == null) throw "message error";
                    //TODO broadcast message
                    break;
                }

                case "chat_update": {
                    let new_chat = await chat_update(socket, msgData);
                    if (new_chat == null) throw "chat_update error";
                    //TODO broadcast changes
                    break;
                }

                case "user_update": {
                    let new_uc = await user_update(socket, msgData);
                    if (new_uc == null) throw "user_update error";
                    //TODO broadcast changes
                    break;
                }

                default:
                    console.error("no handler for: ", msgData.type);
                    throw new Error("not implemented");
            }
        });

        socket.on('close', () => {
            console.log("[connection closed]");
            connections = connections.filter(c => c.socket !== socket);
        })
    })
};

main().then(async () => {
    await prisma.$disconnect()
}).catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
});