// src/layout.tsx
import type { FC } from 'hono/jsx'

export const Layout: FC = (props) => {
    return (
        <html lang="ja">
            <head>
                <meta charset="UTF-8"></meta>
                <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
                <title>ToDo App</title>
                <script src="/htmx/htmx.min.js"></script>
                <script src="/htmx/ext/json-enc.js"></script>
                <script src="/sweetalert/sweetalert2.all.min.js"></script>
                <script src="/sweetalert/custom-dialog.js"></script>
                <meta name="htmx-config" content='{
                    "responseHandling": [
                        {"code": "[23]..", "swap": true },
                        {"code": "[45]..", "swap": false, "error": true },
                        {"code": "...", "swap": false }
                    ]
                }'></meta>
                <link rel="stylesheet" href="/styles/todo.css"></link>
                <link rel="icon" href="/favicon.ico"></link>
            </head>
            <body>
                <body>{props.children}</body>
            </body>
        </html>
    )
}
