// src/todo.tsx
import { Hono } from 'hono'
import { serveStatic } from '@hono/node-server/serve-static'
import { Top } from './top';
import { Task } from './task';
import { configure, getConsoleSink, getLogger } from '@logtape/logtape';
import { getFileSink } from "@logtape/file";

await configure({
    sinks: {
        console: getConsoleSink(),
        file: getFileSink("./out/todo-app.log", {
            flushInterval: 1000, // flush every 1 second
            nonBlocking: true,
        })
    },
    loggers: [
        { category: ["todo-app"], lowestLevel: "debug", sinks: ["file"] },
        { category: ["logtape", "meta"], lowestLevel: "warning", sinks: ["console"] },
    ],
});
const logger = getLogger(["my-app", "main"]);

const app = new Hono();
app.use('*', serveStatic({ root: './static' }))

// ページをリロードしても追加されたタスクが消えないように覚えておく
let tasks: string[] = [];

app.get('/', (c) => {
    return c.render(
        <Top tasks={tasks} />
    )
});

app.post("/add", async (c) => {
    const formData = await c.req.formData();
    const task = formData.get("task") as string;
    tasks.push(task);
    logger.debug(`Added ${task}`)
    return c.render(
        <Task task={task} />
    );
});

app.delete("/delete", async (c) => {
    const task: string = c.req.query('task') as string;
    logger.debug(`task to be deleted: ${task}`)
    if (task !== undefined && tasks.includes(task)) {
        tasks.splice(tasks.indexOf(task), 1);
        logger.debug(`Deleted task: ${task}`);
    }
    logger.debug(`Remaining tasks: ${tasks}`);
    c.status(204);
    return c.text('');
});

export default app;
