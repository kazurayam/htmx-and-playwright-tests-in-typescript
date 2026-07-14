// src/main.ts
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Top } from './top';
import { Section3 } from './section3';
import { BrowserDriverChromium } from '../tests/BrowserDriverChromium';

const app = new Hono();
app.use('*', serveStatic({ root: './static'}))

app.get('/', (c) => {
    const messages = ['Hello htmx'];
    return c.render(
        <Top messages={ messages } />
    )
});

app.get('/section3', (c) => {
    const messages = ['Hello htmx']
    return c.render(
        <Section3 messages={messages} />
    )
})

app.on(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], '/hello', (c) => {
    if (c.req.method == "GET") {
        return c.render(<span style='color:#ff0000;'>GETリクエスト!</span>)
    } else if (c.req.method == "POST") {
        return c.render(<span style='color:#00bf00;'>POSTリクエスト!</span>)
    } else if (c.req.method == "PUT") {
        return c.render(<span style='color:#0000ff;'>PUTリクエスト!</span>)
    } else if (c.req.method == "PATCH") {
        return c.render(<span style='color:#ff00ff;'>PATCHリクエスト!</span>)
    } else if (c.req.method == "DELETE") {
        return c.render(<span style='color:#ff0000;'>DELETEリクエスト!</span>)
    } else {
        throw new Error('unexpected c.req.method=' + c.req.method)
    }
})

const server = serve({
    port: 3001,
    fetch: app.fetch
})

export default server;

export { BrowserDriverChromium } from '../tests/BrowserDriverChromium.ts';
