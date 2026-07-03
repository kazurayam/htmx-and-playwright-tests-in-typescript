// src/layout.tsx
import type { FC } from 'hono/jsx'

export const Layout: FC = (props) => {
    return (
        <html lang="ja">
            <head>
                <meta charset="UTF-8"></meta>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
                <title>htmx + JSX on Hono + bun</title>
                <script src="/htmx/htmx.min.js" hx-preserve="true"></script>
                <link rel="stylesheet" href="/styles/tutorial.css"></link>
            </head>
            <body>
                <body>{props.children}</body>
            </body>
        </html>
    )
}
