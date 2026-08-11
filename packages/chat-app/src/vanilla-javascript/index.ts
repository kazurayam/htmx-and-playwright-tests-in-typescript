// chat-app/src/vanilla-javascript/index.ts
import { getServerName } from '../shared/utils';

console.log("🤗 Hello via Bun! 🐰");
const server = Bun.serve({
    port: 8000,
    routes: {
        "/": new Response(Bun.file(new URL(import.meta.url + "/../index.html"))),
        "/chat": (req, server) => {
            if (server.upgrade(req)) {
                return; // do not return a Response
            }
            return new Response("Filed upgrading to WebSocket", { status: 400 });
        },
        "/styles/chat.css": (req, server) => {
            const filePath = './static' + new URL(req.url).pathname;
            return new Response(Bun.file(filePath));
        }
    },
    fetch(req, server) {
        return new Response("404!");
    },
    websocket: {
        open(ws) {
            console.log("👋 A new Websocket Connection is OPENED");
            ws.send(`serverName: ${getServerName(import.meta.url)}`);
            ws.send("👋 Welcome baby");
        },
        message(ws, message) {
            console.log("✉️ A new Websocket Message is received: " + message);
            ws.send("✉️ from you: " + message);
        },
        close(ws, code, message) {
            console.log("⏹️ A Websocket Connection is CLOSED");
        },
        drain(ws) {
            console.log("DRAIN EVENT");
        }, // the socket is ready to receive more data
    }
});
console.log(`🚀 Server (HTTP and WebSocket) is launched ${server.url.origin}`);
