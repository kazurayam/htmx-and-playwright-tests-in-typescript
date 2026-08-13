// chat-app/src/hono-jsx/layout.tsx

import type { FC } from 'hono/jsx'

export const Layout: FC = (props) => {
    return (
        <html lang="ja">
            <head>
                <meta charset="UTF-8"></meta>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
                <title>Chat App</title>
                <script src="/htmx/htmx.min.js" hx-preserve="true"></script>
                <script src="/htmx/ext/ws.min.js" hx-preserve="true"></script>
                <link rel="stylesheet" href="/styles/chat.css"></link>
                <link rel="icon" href="/favicon.ico"></link>
            </head>
            <body>
                {props.children}
            </body>
        </html>
    )
}
