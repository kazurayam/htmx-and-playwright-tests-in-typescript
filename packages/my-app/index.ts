// my-app/index.ts
const server = Bun.serve({
    port: 3000,
    routes: {
        "/": () => new Response('Bun!'),
    }
});

console.log(`Listening on ${server.url}`);

