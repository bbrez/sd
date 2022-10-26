import { WebSocket } from "ws";
import prisma from "../db";
import send from "../send";

async function register(socket: WebSocket, data: any) {
    try {
        let newUser = await prisma.user.create({
            data: {
                ...data.user,
            }
        });

        console.log(`[${__filename}]: Registered user: ${newUser}`);
        send(socket, "register", "success", { user: newUser });
    } catch (err) {
        console.log(`[${__filename}]: Error registering user: ${err}`);
        send(socket, "register", "error");
    } finally {
        socket.close();
    }
}

export default register;