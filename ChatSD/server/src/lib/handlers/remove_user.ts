import { WebSocket } from "ws";
import prisma from "../db";
import send from "../send";

async function remove_user(socket: WebSocket, data: any) {
    try {
        let admin = await prisma.userChat.findFirstOrThrow({
            where: {
                id: data.admin,
                isAdmin: true,
            }
        });

        console.log(`[${__filename}]: Admin found: ${JSON.stringify(admin)}`);
        let remove_uc = await prisma.userChat.delete({
            where: {
                id: data.remove,
            },
            include: {
                chat: true
            }
        });

        console.log(`[${__filename}]: Deleted user from chat: ${JSON.stringify(remove_uc)}`);
        send(socket, "remove_user", "success", { removed: remove_uc });

        return remove_uc;
    } catch (err) {
        console.log("error");
    }
}

export default remove_user;