// src/top.tsx
import type { FC } from 'hono/jsx';
import { Layout } from "./layout";

export const Top: FC<{ messages: string[] }> = (props: {
    messages: string[]
}) => {
    return (
        <Layout>
            {
                props.messages.map((message) => {
                    return <p>{message}</p>;
                })
            }
            <div id="htmx-book-app">
                <h1>htmx Book App</h1>
                <div id="app-contents">
                    <ul>
                        <li><a href="/section3">Section 3</a></li>
                        <li><a href="/section4">Section 4</a></li>
                        <li>...</li>
                    </ul>
                </div>
            </div>
        </Layout>
    );
}
