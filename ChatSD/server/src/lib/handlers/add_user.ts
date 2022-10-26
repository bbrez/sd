import { WebSocket } from "ws";
import prisma from "../db";
import send from "../send";

async function add_user(socket: WebSocket, data: any) {
    try {
        let user = await prisma.user.findFirstOrThrow({
            where: {
                name: data.userName,
            },
        });

        console.log(`[${__filename}]: Found user: ${user}`);
        let chat = await prisma.chat.findFirstOrThrow({
            where: {
                id: data.chat.id,
            },
            include: {
                users: true,
            },
        });

        console.log(`[${__filename}]: Found chat: ${chat}`);
        if (chat.users.findIndex((u) => u.userId == user.id) != -1) {
            throw "user already in chat";
        }

        let newuc = await prisma.userChat.create({
            data: {
                nickname: user.name,
                color: "#000000",
                isAdmin: false,
                chat: {
                    connect: {
                        id: chat.id,
                    },
                },
                user: {
                    connect: {
                        id: user.id,
                    },
                },
            },
        });

        console.log(`[${__filename}]: User added to chat: ${newuc}`);
        send(socket, "add_user", "success", { user: newuc });
    } catch (err) {
        console.error(`[${__filename}]: Error adding user to chat: ${err}`);
        send(socket, "add_user", "error");
    }
}

export default add_user;