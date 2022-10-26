import { WebSocket } from "ws";
import prisma from "../db";
import send from "../send";

async function connect(socket: WebSocket, data: any) {
    try {
        let user = await prisma.user.findFirstOrThrow({
            where: {
                name: data.user.name,
            }
        });

        console.log(`[${__filename}]: User connected: ${user}`);

        let ucs = await prisma.userChat.findMany({
            where: {
                userId: user.id,
            },

            include: {
                chat: {
                    include: {
                        users: true,
                        messages: {
                            include: {
                                from: true,
                            },
                        },
                    },
                },
            },
        });

        console.log(`[${__filename}]: UCs found: ${ucs}`);

        send(socket, "connect", "success", { chats: [...ucs] });

        return user;
    } catch (err) {
        console.log(`[${__filename}]: Error connecting: ${err}`);
        send(socket, "connect", "error");
        socket.close();
    } // não fecha a conexão;
}

export default connect;