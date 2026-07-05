// section3.tsx
import type { FC } from 'hono/jsx'
import { Layout }  from "./layout"

export const Section3: FC = () => {
    return (
        <Layout>
            <div class="section-contents">
                <h1>Section3</h1>

                <h2>hx-get</h2>
                <button hx-get="/hello">クリック</button>

                <h2>hx-post</h2>
                <button hx-post="/hello">クリック</button>

                <h2>hx-put</h2>
                <button hx-put="/hello">クリック</button>

                <h2>hx-patch</h2>
                <button hx-patch="/hello">クリック</button>

                <h2>hx-delete</h2>
                <button hx-delete="/hello">クリック</button>
            </div>
        </Layout>
    )
}
