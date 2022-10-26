import { WebSocket } from "ws";
import prisma from "../db";

/*connections.filter((c) => {
        return message.to.users.findIndex((uc) => {
            return uc.userId == c.user.id;
        }) != -1;
    }).map((con) => {
        console.log("sending to: ", con.user.name);
        con.socket.send(JSON.stringify({
            type: "message",
            to: message.chatId,
            from: message.userChatId,
            content: message.content,
            when: message.timestamp,
        }));
    });*/

async function message(socket: WebSocket, data: any) {
    try {
        let message = await prisma.message.create({
            data: {
                content: data.content,
                timestamp: new Date(),
                from: {
                    connect: {
                        id: data.user,
                    },
                },
                to: {
                    connect: {
                        id: data.chat,
                    },
                },
            },
            include: {
                to: {
                    include: {
                        users: true,
                    }
                }
            }
        });

        console.log(`[${getFuncName()}]: New message: ${message}`);
        return message;
    } catch (err) {
        //TODO handle errors
    }
}

export default message;