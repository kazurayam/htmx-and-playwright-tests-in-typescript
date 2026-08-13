// chat-app/src/hono-jsx/chatform.tsx

import type { FC } from 'hono/jsx';
import { Layout } from "./layout";

export const ChatForm: FC<{ messages: string[] }> = (props: {
    messages: string[]
}) => {
    const reset = { 'hx-on:htmx:ws-after-message': "document.querySelector('form').reset()" }
    return (
        <Layout>
            <div id="chat-app">
                <h1>Chat App</h1>
                <div hx-ext="ws" ws-connect="/chat" {...reset}>
                    <form id="form" ws-send>
                        <input type="text" id="message" name="message" placeholder="メッセージ" required></input>
                        <input type="submit" value="送信" id="btn"></input>
                    </form>
                </div>
                <div id="messages"></div>
            </div>
        </Layout>
    );
}
