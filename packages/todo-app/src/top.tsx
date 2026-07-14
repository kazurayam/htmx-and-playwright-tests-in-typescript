// src/top.tsx
import type { FC } from 'hono/jsx';
import { Layout } from "./layout";
import { Task } from "./task";

export const Top: FC<{ tasks: string[] }> = (props: {
    tasks: string[]
}) => {
    return (
        <Layout>
            <div id="app">
                <h1>ToDo App</h1>
                <div id="app-contents">
                    <form hx-post="/add" hx-target="#task-list" hx-swap="beforeend" hx-on--after-request="this.reset()">
                        <input type="text" name="task" placeholder="新しいタスク" required />
                        <button type="submit">追加</button>
                    </form>
                    <ul id="task-list">
                        {
                            props.tasks.map((task) => {
                                return <Task task={task} />;
                            })
                        }
                    </ul>
                </div>
            </div>
        </Layout>
    );
}
