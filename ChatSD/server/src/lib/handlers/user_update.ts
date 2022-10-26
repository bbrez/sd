import { WebSocket } from "ws";
import prisma from "../db";

async function user_update(socket: WebSocket, data: any) {
    try {
        let uc = await prisma.userChat.update({
            where: {
                id: data.user.id,
            },
            data: {
                nickname: data.user.nickname,
                color: data.user.color,
            },
        });

        return uc;
    } catch (err) {
        //TODO handle errors
    }
}

export default user_update;