import { WebSocket } from "ws";
import prisma from "../db";
import send from "../send";

async function login(socket: WebSocket, data: any) {
    try {
        let user = await prisma.user.findFirstOrThrow({
            where: {
                AND: [
                    { name: data.user.name },
                    { password: data.user.password },
                ]
            }
        });

        console.log(`[${getFuncName()}]: Loaded user: ${user}`);
        send(socket, "login", "success", { ...user, password: null });
    } catch (err) {
        console.log(`[${getFuncName()}]: Error logging user: ${err}`);
        send(socket, "login", "error");
    } finally {
        socket.close();
    }
}

export default login;