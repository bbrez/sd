import { WebSocket } from "ws";

async function send(s: WebSocket, type: string, result: string, data: any | null = null) {
    if (data != null) {
        s.send(JSON.stringify({
            type: type,
            result: result,
            data: data,
        }));
    } else {
        s.send(JSON.stringify({
            type: type,
            result: result,
        }))
    }
}

export default send;