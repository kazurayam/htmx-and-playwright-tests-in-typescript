// chat-app/src/htmx-ws/index.ts
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
            ws.send('<div hx-swap-oob="beforeend:#messages">' +
                `<span>serverName: ${getServerName(import.meta.url)}</span>` +
                '<span>👋 Welcome baby</span>' + '</div>');
        },
        message(ws, data) {
            console.log(data)
            let d = JSON.parse(data.toString())
            let response = '<div hx-swap-oob="beforeend:#messages">' +
                `<span>from you: ${d.message}</span>` +
                '</div>';
            ws.send(response);
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
