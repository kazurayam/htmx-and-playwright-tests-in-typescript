// src/main.ts
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Top } from './top';

const app = new Hono();
app.use('*', serveStatic({ root: './static'}))

app.get('/', (c) => {
    const messages = ['Hello htmx'];
    return c.render(
        <Top messages={ messages } />
    )
});

const server = serve({
    port: 3001,
    fetch: app.fetch
})

export default server;
