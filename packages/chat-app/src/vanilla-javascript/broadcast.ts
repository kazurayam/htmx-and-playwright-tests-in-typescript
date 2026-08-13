// chat-app/src/vanilla-javascript/broadcast.ts
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
        message(ws, message) {
            console.log("✉️ A new Websocket Message is received: " + message);
            ws.send("✉️ from you:  " + message);
            ws.publish(
                topic,
                `📢 from ${ws.remoteAddress}: ${message}`,
            );
        }, // a message is received
        open(ws) {
            console.log("👋 A new Websocket Connection");
            ws.subscribe(topic);
            ws.send(`serverName: ${getServerName(import.meta.url)}`);
            ws.send("👋 Welcome baby");
            ws.publish(topic, "🥳 A new friend is joining the Party");
        }, // a socket is opened
        close(ws, code, message) {
            console.log("⏹️ A Websocket Connection is CLOSED");
            const msg = `A Friend has left the chat`;
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
    const msg = "Hello from the Server, this is a periodic message!";
    server.publish(topic, msg);
    //console.log(`Message sent to "${topic}": ${msg}`);
}, 10000); // 10000 ms = 10 seconds
