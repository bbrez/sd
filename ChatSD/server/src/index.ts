import { WebSocketServer, WebSocket } from 'ws';
import { User } from '@prisma/client';
import {
    add_user,
    chat_update,
    connect,
    login,
    message,
    new_chat,
    register,
    remove_user,
    user_update
} from './lib/handlers';
import send from './lib/send';
import prisma from './lib/db';


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

                case "connected_users": {
                    let ucs = await prisma.userChat.findMany({
                        where: {
                            chatId: msgData.chat.id,
                        },
                    });

                    let online = new Array<number>();
                    connections.filter((c) => {
                        return ucs.findIndex((uc) => {
                            return uc.userId == c.user.id;
                        }) != -1
                    }).map((con) => {
                        online.push(con.user.id);
                    });

                    send(socket, "connected_users", "success", { online: online });
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
                    connections.filter((c) => {
                        return msg!.to.users.findIndex((uc) => {
                            return uc.userId == c.user.id;
                        }) != -1;
                    }).map((con) => {
                        console.log("[Message broadcast]: sending to: ", con.user.name);
                        send(con.socket, "message", "broadcast", {
                            to: msg!.chatId,
                            from: msg!.userChatId,
                            content: msg!.content,
                            when: msg!.timestamp,
                        })
                    })
                    break;
                }

                case "chat_update": {
                    let updated_chat = await chat_update(socket, msgData);
                    if (updated_chat == null || updated_chat == undefined) throw "chat_update error";
                    connections.filter((c) => {
                        return updated_chat!.users.findIndex((uc) => {
                            return uc.userId == c.user.id;
                        }) != -1;
                    }).map((con) => {
                        console.log("[Chat Update Broadcast]: sending to: ", con.user.name);
                        send(con.socket, "chat_update", "broadcast", { chat: updated_chat });
                    })
                    break;
                }

                case "user_update": {
                    let updated_uc = await user_update(socket, msgData);
                    if (updated_uc == null) throw "user_update error";
                    connections.filter((c) => {
                        return updated_uc?.chat.users.findIndex((uc) => {
                            return uc.userId == c.user.id;
                        }) != -1;
                    }).map((con) => {
                        console.log("UC Update Broadcast]: sending to: ", con.user.name);
                        send(con.socket, "user_update", "broadcast", { user: updated_uc });
                    })
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