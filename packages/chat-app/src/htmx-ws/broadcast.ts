// chat-app/src/htmx-ws/broadcast.ts
import { getServerName } from '../shared/utils';

console.log("🤗 Hello via Bun! 🐰");
const topic = 'the-group-chat';
const server = Bun.serve({
    port: 8000, // defaults to $BUN_PORT, $PORT, $NODE_PORT otherwise 3000
    routes: {
        "/": new Response(Bun.file(new URL(import.meta.url + "/../index.html"))),
        "/surprise": new Response("🎁"),
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
            console.log("👋 A new Websocket Connection");
            ws.send('<div hx-swap-oob="beforeend:#messages">' +
                `<span>serverName: ${getServerName(import.meta.url)}</span>` +
                '<span>👋 Welcome baby</span>' + '</div>');
            ws.subscribe(topic);
            ws.publish(topic,
                '<div hx-swap-oob="beforeend:#messages">' +
                `<span>🥳 A new friend is joining the Party</span>` +
                "</div>");;
        }, // a socket is opened
        message(ws, data) {
            let d = JSON.parse(data.toString());
            console.log("✉️ A new Websocket Message is received: " + d.message);
            ws.send('<div hx-swap-oob="beforeend:#messages">' +
                `<span>from you: ${d.message}</span>` + '</div>');
            ws.publish(
                topic,
                '<div hx-swap-oob="beforeend:#messages">' +
                `<span>from ${ws.remoteAddress}: ${d.message}</span>` +
                "</div>"
            );
        }, // a message is received
        close(ws, code, message) {
            console.log("⏹️ A Websocket Connection is CLOSED");
            const msg = '<div hx-swap-oob="beforeend:#messages">' +
                `<span>A Friend has left the chat</span>` +
                "</div>";
            ws.unsubscribe(topic);
            ws.publish(topic, msg);
        }, // a socket is closed
        drain(ws) {
            console.log("DRAIN EVENT");
        }, // the socket is ready to receive more data
    },
});
console.log(`🚀 Server (HTTP and WebSocket) is launched ${server.url.origin}`);

setInterval(() => {
    const msg = '<div hx-swap-oob="beforeend:#messages">' +
        `<span>Hello from the Server, this is a periodic message!</span>` +
        "</div>";
    server.publish(topic, msg);
    console.log(`Message sent to "${topic}": ${msg}`);
}, 30_000); // 30000 ms = 30 seconds
