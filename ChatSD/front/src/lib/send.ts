async function send(s: WebSocket, type: string, data: any | null) {
    if (data != null) {
        s.send(JSON.stringify({
            type: type,
            data: data,
        }));
    } else {
        s.send(JSON.stringify({
            type: type,
        }));
    }
}

export default send;