// chat-app/src/hono-jsx/broadcast.tsx

import { Hono } from 'hono';
import { upgradeWebSocket, websocket } from 'hono/bun';
import { WSContext, type WSMessageReceive } from 'hono/ws';
import type { ServerWebSocket } from 'bun';
import { serveStatic } from '@hono/node-server/serve-static';
import { ChatForm } from './chatform';
import { getServerName } from '../shared/utils';

const topic = 'the-group-chat';

console.log("🤗 Hello via Bun! 🐰");
const app = new Hono();
app.use('*', serveStatic({ root: './static' }));

app.get('/', (c) => {
    const messages = ['Hello htmx WebSocket Extension with Hono and JSX'];
    return c.render(<ChatForm messages={messages} />);
})

app.get(
    '/chat',
    upgradeWebSocket((c) => {
        return {
            onOpen: (_event, ws: WSContext) => {
                console.log("👋 A new Websocket Connection");
                ws.send('<div hx-swap-oob="beforeend:#messages">' +
                        `<span>serverName: ${getServerName(import.meta.url)}</span>` +
                        '<span>👋 Welcome baby</span>' + '</div>');
                const rawWs = ws.raw as ServerWebSocket;
                rawWs.subscribe(topic);
                rawWs.publish(topic,
                    '<div hx-swap-oob="beforeend:#messages">' +
                    `<span>🥳 A new friend is joining the Party</span>` +
                    "</div>");
            }, // a socket is opened
            onMessage(event: MessageEvent<WSMessageReceive>, ws: WSContext) {
                let d = JSON.parse(event.data.toString());
                console.log("✉️ A new Websocket Message is received: " + d.message);
                ws.send('<div hx-swap-oob="beforeend:#messages">' +
                    `<span>from you: ${d.message}</span>` + '</div>');
                const rawWs = ws.raw as ServerWebSocket;
                rawWs.publish(
                    topic,
                    '<div hx-swap-oob="beforeend:#messages">' +
                    `<span>from ${rawWs.remoteAddress}: ${d.message}</span>` +
                    "</div>"
                );
            }, // a message is received
            onClose: (_event, ws: WSContext) => {
                console.log("⏹️ A Websocket Connection is CLOSED");
                const msg = '<div hx-swap-oob="beforeend:#messages">' +
                    `<span>A Friend has left the chat</span>` +
                    "</div>";
                const rawWs = ws.raw as ServerWebSocket;
                rawWs.unsubscribe(topic);
                rawWs.publish(topic, msg);
            },
            onError: () => {
                console.error("Error");
            }
        }
    })
)

export default {
    port: 8000,
    fetch: app.fetch,
    websocket
}
