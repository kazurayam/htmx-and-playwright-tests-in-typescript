// src/task.tsx
import type { FC } from 'hono/jsx'

export const Task: FC<{ task: string }> = (props) => {
    return (
        <li>
            <p>{props.task}</p>
            <button class="delete-btn" hx-target="closest li" hx-delete="/delete"
                hx-trigger='click' hx-ext='json-enc'
                hx-vals={`{"task": "${props.task}"}`} hx-swap="delete"
                hx-confirm={`${props.task} を本当に削除しますか？`}
            >削除</button>
        </li>
    )
}
