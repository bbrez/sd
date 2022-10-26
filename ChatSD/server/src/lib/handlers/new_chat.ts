import { WebSocket } from "ws";
import prisma from "../db";
import send from "../send";

async function new_chat(socket: WebSocket, data: any) {
    try {
        let user = await prisma.user.findFirstOrThrow({
            where: {
                name: data.chat.users[0].name,
            },
        });

        let newuc = await prisma.userChat.create({
            data: {
                nickname: user.name,
                isAdmin: true,
                user: {
                    connect: { id: user.id },
                },
                chat: {
                    create: {
                        name: data.chat.name,
                        icon: data.chat.icon,
                    },
                },
            },
            include: {
                user: true,
                chat: true,
            }
        });

        console.log(`[${getFuncName()}]: Chat registered: ${newuc}`,);
        send(socket, "new_chat", "success", { ...newuc.chat });
    } catch (err) {
        console.log(`[${getFuncName()}]: Error creating chat: ${err}`);
        send(socket, "new_chat", "error");
    }
}

export default new_chat;