// chat-app/src/htmx-ws/index.tsx
import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { Top } from './form';
import { Chat } from './chatform';

console.log("🤗 Hello via Bun! 🐰");
const app = new Hono();
app.use('*', serveStatic({ root: './static' }));

app.get('/', (c) => {
    return c.render(<ChatForm/>);
})

app.get('/chat', (c) => {

})

const wsHandler = {
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
};

export default {
    port: 8080,
    fetch: app.fetch,
    websocket: wsHandler
}
