import { WebSocket } from "ws";
import prisma from "../db";

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

        console.log(`[${__filename}]: New message: ${message}`);
        return message;
    } catch (err) {
        //TODO handle errors
    }
}

export default message;