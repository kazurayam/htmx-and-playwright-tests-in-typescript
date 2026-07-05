- Table of contents
{:toc}

# Htmx and Playwright Tests in TypeScript

- project version: unknown

- publish date: 2026-07-04

書籍 [「JavaScriptレスの動的UI開発 htmx入門」太田智暉 著、C＆R研究所](https://www.c-r.com/book/detail/1595) （以下で "htmx本" と略する）のサンプルコードを読んで [htmx](https://htmx.org/) を活用したwebアプリケーションを開発する手法を学ぼうと思う。htmxそのものについての解説はhtmx本に譲る。webアプリケーションをTypeScriptで構築することと、Playwrightでend-to-endテストを実装することについて、わたしなりの工夫をした。どうやったか以下に記述する。

## 1 達成目標と技術的課題

わたしは次のようなことを達成したい。

1.  わたしはhtmxを理解するためにhtmx本のサンプルコードを写経して動かしたい。

2.  htmxを採用したHTMLをブラウザ上で開いて動きを確認するためにはバックエンドとしてのwebアプリケーションが必要だ。htmx本の著者はPython言語で書いたwebアプリケーションの [ソースコード一式](https://github.com/tomo1227/htmx_book_app) をGitHubで公開している。それはさておき、わたしはwebアプリをTypeScript言語で書きたい。

3.  webアプリを [bun](https://bun.com/docs) と [Hono](https://hono.dev/) の上に構築したい。Node.jsとExpressではなくて。

4.  htmx本はテストをどう書くかについてまったく触れていない。わたしはまずテストを書いて、その次にhtmx本のサンプルコードを写して、ひとつひとつテストを実行して、htmx構文の動きを確認するという手順をとりたい。いわゆるテスト・ファーストなやり方だ。そのために [Playwright](https://playwright.dev/docs/intro) でwebアプリをテストしよう。

技術的な課題がある。わたしはPlaywrightをbunの上で利用したい。ところがbunの上でPlaywrightを動かす事例紹介がほとんど見当たらない。Playwrightの公式ドキュメント [Getting started/Installation](https://playwright.dev/docs/intro) を見れば明らかだが、Playwrightがそもそも [Node.js](https://nodejs.org/) を前提に開発されたからだろう。だからわたしは自力で答えを見つけなければならない。

## 2 基盤を準備する

### 2. 1 実行環境

- Apple MacBook Air, M1

- macOS 26.5.1

- bash 3.2.57(1)-release (x86\_64-apple-darwin25)

- node v24.9.0, npm 11.7.0, npx 11.7.0 がインストール済み

- Visual Studio Code 1.125.1

### 2.2 bunをインストールする

- 参考情報: [bun公式 Installation](https://bun.com/docs/installation)

- 参考情報: [Bun コマンド チートシート：bun install／run／x／test／build 一括早見表](https://t-cr.jp/article/c5h1j98oknorvak)

bunをインストールする。公式サイトの指示に従ってコマンドを投入する。

    $ curl -fsSL https://bun.com/install | bash

### 2.3 Gitレポジトリのルートとなるディレクトリを作る

任意の場所でディレクトリを作る。

    $ mkdir htmx-and-playwright-tests-in-typescript

このディレクトリをGitレポジトリのルート・ディレクトリとする。将来的にこのレポジトリをいわゆる「モノレポ」にしたいので、サブディレクトリ `packages` を作り、その下にwebアプリケーションを格納することにする。

    $ cd htmx-and-playwright-tests-in-typescript
    $ mkdir packages

### 2.4 webアプリケーション `my-app` の雛形を作る

- 参考情報: <https://bun.com/docs/quickstart>

\`packages\`ディレクトリにcdしてから\`bun init\`コマンドを実行する。

    $ cd packages
    $ bun init my-app
    ? Select a project template - Press return to submit.
    ❯   Blank
        React
        Library

ここで\`Blank\`を選択する。

    ✓ Select a project template: Blank

     + .gitignore
     + CLAUDE.md
     + index.ts
     + tsconfig.json (for editor autocomplete)
     + README.md

    To get started, run:

        bun run index.ts

    bun install v1.3.14 (0d9b296a)

    + @types/bun@1.3.14
    + typescript@5.9.3 (v6.0.3 available)

    5 packages installed [3.60s]

これによって\`packages\`ディレクトリの下に新しいディレクトリ `my-app` が作られる。`my-app` の中に `package.json` をはじめとするいくつかのファイルが生成される。

    $ tree my-app -L 2
    my-app
    ├── bun.lock
    ├── CLAUDE.md
    ├── index.ts
    ├── node_modules
    │   ├── @types
    │   ├── bun-types
    │   ├── typescript
    │   └── undici-types
    ├── package.json
    ├── README.md
    └── tsconfig.json

これらのファイル群がwebアプリケーションの雛形となる。以下の記述を簡便にするために `my-app` ディレクトリを `PROJECT` という記号で表すことにする。シェル変数 `PROJECT` を下記のようにして作る。

    $ cd my-app
    $ PROJECT=`pwd`
    $ echo $PROJECT
    /Users/kazurayam/github/htmx-and-playwright-tests-in-typescript/packages/my-app

自動生成された `$PROJECT/index.ts` ファイルの中身は下記の通りです。

    console.log("Hello via Bun!");

これをコマンドラインで実行することができます。

    $ cd $PROJECT
    $ bun run index.ts
    Hello via Bun!

予想通りの結果になりました。次に `$PROJECT/index.ts` を下記のように書きかえよう。ポート番号 3000 をlistenするHTTPサーバを実装している。

    const server = Bun.serve({
        port: 3000,
        routes: {
            "/": () => new Response('Bun!'),
        }
    });

    console.log(`Listening on ${server.url}`);

コマンドラインで `bun index` コマンドを実行しよう。

    $ cd $PROJECT
    $ bun index.ts
    Listening on http://localhost:3000/

webサーバが立ち上がりました。ではChromeブラウザを立ち上げて <http://localhost:3000/> を開いてみましょう。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/001_index.ts.png" alt="001 index.ts" />
</figure>

簡素だけどちゃんとしたHTTP応答が表示されました。webサーバーを停止するにはコマンドラインで CTRL+C と入力します。

## 3 webアプリケーションの雛形を実装する

### 3.1 Honoを導入する

- 参考情報: <https://hono.dev/docs/getting-started/bun>

`my-app` プロジェクトに [Hono]() を導入しwebアプリケーションの開発に着手します。`PROJCT` ディレクトリにcd して `bun add` コマンドでhonoパッケージを導入します。

    $ cd $PROJECT
    $ bun add hono

すると `package.json` ファイルの `dependencies` プロパティに hono が追加された。

    {
      "name": "my-app",
      "module": "index.ts",
      "type": "module",
      "private": true,
      "devDependencies": {
        "@types/bun": "latest"
      },
      "peerDependencies": {
        "typescript": "^5"
      },
      "dependencies": {
        "hono": "^4.12.27"
      }
    }

`$PROJECT` ディレクトリの下に `src` ディレクトリを追加し、 `src` ディレクトリの下に `main.ts` ファイルを追加します。

    $ cd $PROJECT
    $ mkdir src
    $ cd src
    $ touch main.ts

`$PROJECT` ディレクトリの中身はこうなりました。

    $ cd $PROJECT
    $ tree . -L 2
    .
    ├── bun.lock
    ├── CLAUDE.md
    ├── index.ts
    ├── node_modules
    │   ├── @types
    │   ├── bun-types
    │   ├── hono
    │   ├── typescript
    │   └── undici-types
    ├── package.json
    ├── README.md
    ├── src
    │   └── main.ts
    └── tsconfig.json

`src/main.ts` に下記のTypeScriptコードを書きました。

    import { Hono } from 'hono'

    const app = new Hono()
        .get('/', (c) => c.text('Hello Bun!'));

    export default app;

`package.json` に `script` プロパティを挿入し、`main` サブコマンドを定義しました。

    {
      "name": "my-app",
      "module": "index.ts",
      "type": "module",
      "private": true,
      "scripts": {
        "main": "bun run --hot src/main.ts"
      },
      ...

さて、コマンドラインで `bun run main` コマンドを実行しましょう。

    $ cd $PROJECT
    $ bun run main
    Started development server: http://localhost:3000

これによってwebアプリケーションが立ち上がって `http://localhost:3000` がアクセス可能になります。ブラウザでアクセスしてみました。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/002_main.ts.png" alt="002 main.ts" />
</figure>

`main.ts` が応答した `Hello Bun!` という文字がたしかに画面に表示されています。

### 3.2 Honoで構築したwebアプリがlistenするIPポート番号を明示的に指定する

- 参考情報: <https://hono.dev/docs/getting-started/nodejs#change-port-number>

`new Hono()` でインスタンス化されるHTTPサーバは3000番のIPポートをlistenします。これを別なポート番号に切り替えたい。例えば 3001 にしたい。どうすればいいか？

`src/main.ts` を修正します。

    import { Hono } from 'hono'
    import { serve } from '@hono/node-server'

    const app = new Hono()
        .get('/', (c) => c.text('Hello Bun!'));

    const server = serve({
        port: 3001,
        fetch: app.fetch
    })

    export default server;

このコードは [`@hono/node-server`](https://github.com/honojs/node-server) を必要とします。だから下記のコマンドでプロジェクトに追加します。

    $ cd $PROJECT
    $ bun add @hono/node-server
    bun add v1.3.14 (0d9b296a)

    installed @hono/node-server@2.0.6

    1 package installed [904.00ms]

`package.json` の `dependencies` が自動的に修正されました。

    {
      ...
      "dependencies": {
        "@hono/node-server": "^2.0.6",
        "hono": "^4.12.27"
      }
    }

ちなみに `@hono/node-server` はNode.jsのバージョン20以降を必要とします。わたしのMacにはNode.js v24がインストール済みなので大丈夫です。

`bun run main` コマンドでwebアプリを起動しましょう。ポート番号 3001 をlistenするwebアプリが立ち上がりました。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/003_main_3001.png" alt="003 main 3001" />
</figure>

### 3.3 JSXを導入してwebアプリのトップ画面を実装する。

- 参考情報: <https://hono.dev/docs/guides/jsx>

ここから先はhtmx本のバックエンドの役を果たすwebアプリケーションを構築することを目標に、`main.ts` を拡張していきます。HTMLを応答するために [JSX](https://engineer-tips.com/2025/06/21/what-is-jsx/) を導入します。”JSX”をキーとしてネットを検索するとたくさんヒットします。その多くは「Reactで使うJSX」とか「React初心者が理解すべきJSX」というタイトル。あたかもJSXがReactの構成部品であるかのように語られることが多い。しかしJSXはReactとの組み合わせでだけ使える技術ではありません。HonoはJSXの処理系を同梱しています。Server Side Rendering(SSR、HTTPサーバがJSXで記述されたスクリプトを入力としてHTMLを生成しHTTPクライアントへ応答する方式）を実現することができます。htmxを駆使するHTMLを生成するのにサーバーサイドのJSXは適していると思います。

HonoでJSXを利用するために `tsconfig.json` ファイルを変更し、`jsxImportSource` を宣言します。

    {
      "compilerOptions": {
        ...
        "jsx": "react-jsx",
        "jsxImportSource": "hono/jsx",
        ...

`src/main.ts` を `src/main.tsx` に変更します。TypeScriptファイルがJSX構文を使っていることを明示するためにファイル名の拡張子を `.tsx` にします。`package.json` ファイルの `scripts` を下記のように修正するのを忘れずに。

      ...
      "scripts": {
        "main": "bun run --hot src/main.tsx"
      },
      ...

`src/main.tsx` のなかみを下記のように変更します。

    // src/main.ts
    import { Hono } from 'hono'
    import { serve } from '@hono/node-server'
    import { Top } from './top';

    const app = new Hono();

    app.get('/', (c) => {
        const messages = ['Hello htmx'];
        return c.render(
            <Top messages={ messages } />
        )
    });

    const server = serve({
        port: 3001,
        fetch: app.fetch
    })

    export default server;

新しいTypeScriptコード `src/top.tsx` を作ります。

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

もう一つTypeScriptコード `src/layout.tsx` を作ります。

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

これでwebアプリケーションができました。`bun run main` コマンドでwebアプリを起動し、ブラウザで `http://localhost:3001` にアクセスすると、下記のような画面が応答されました。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/004_main_hono_jsx.png" alt="004_main_hono_jsx" />
</figure>

### 3.4 静的なファイルを組み込む

- 参考情報: <https://hono.dev/docs/getting-started/nodejs#serve-static-files>

`http://localhost:3001` を開いてブラウザのDevToolsのコンソールを見ると `404 Not Found` のエラーが発生しているのがわかります。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/005_main_404NotFound.png" alt="005 main 404NotFound" />
</figure>

なぜエラーが発生したかというと、\`src/layout.tsx\`に次のコードが書いてある。

                    ...
                    <script src="/htmx/htmx.min.js" hx-preserve="true"></script>
                    <link rel="stylesheet" href="/styles/tutorial.css"></link>
                    ...

そのいっぽうで `/htmx/htmx.min.js` と `/styles/tutorial.css` という二つのURLに対応するファイルをwebアプリが応答できていなかったから。この問題を解決しよう。

`$PROJECT` ディレクトリの下に `static` ディレクトリを追加します。`static` ディレクトリの下に `htmx` ディレクトリと `styles` ディレクトリを追加します。

    $ cd $PROJECT
    $ mkdir static
    $ cd static
    $ mkdir htmx
    $ mkdir styles
    $ cd -

下記のサイトから `htmx.min.js` の最新バージョンをダウンロードして `$PROJECT/static/htmx/htmx.min.js` として保存しましょう。

- <https://www.jsdelivr.com/package/npm/htmx.org>

htmx本の著者によるサンプルコードのGitHubレポジトリから `tutorial.css` をダウンロードして `$PROJECT/static/styles/tutorial.css` として保存しましょう。

- <https://github.com/tomo1227/htmx_book_app/blob/main/static/styles/tutorial.css>

詰めの仕事が残っています。URL `http://localhost:3001/htmx/htmx.min.js` をwebアプリのファイルパス `$PROJECT/static/htmx/htmx.min.js` に対応づける必要があります。`http://localhost:3001/styles/tutorial.css` を `$PROJECT/static/styles/tutorial.css` に対応させる必要があります。そこで `src/main.jsx` を修正します。

    // src/main.tsx
    ...
    import { serveStatic } from '@hono/node-server/serve-static'
    ...

    const app = new Hono()
    app.use('*', serveStatic({ root: './static' }))
    ...

webアプリケーションを止めて再起動します。`http://localhost:3001` を開くとCSSが適用されてページの見た目が変わったのがわかります。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/006_main_css_applied.png" alt="006 main css applied" />
</figure>

### 3.5 htmx構文を使ったwebページを作る

htmx本の「Chapter02 htmxの基礎 / SECTION-003 Ajax通信」のサンプルコードを写経しよう。`src/section3.tsx` を追加します。

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

そして `src/main.tsx` も修正します。いま追加した `src/section3.tsx` を組み込んで URL `http://localhost:3001/section3` に応答できるようにします。

    // src/main.ts
    import { Hono } from 'hono';
    import { serve } from '@hono/node-server';
    import { serveStatic } from '@hono/node-server/serve-static';
    import { Top } from './top';
    import { Section3 } from './section3';

    const app = new Hono();
    app.use('*', serveStatic({ root: './static'}))

    app.get('/', (c) => {
        const messages = ['Hello htmx'];
        return c.render(
            <Top messages={ messages } />
        )
    });

    app.get('/section3', (c) => {
        const messages = ['Hello htmx']
        return c.render(
            <Section3 messages={messages} />
        )
    })

    const server = serve({
        port: 3001,
        fetch: app.fetch
    })

    export default server;

ブラウザで `http://localhost:3001` を開き "Section3" へのリンクをクリックすると、さっきまでは "404 Not Found" だったのにかわって次のような画面が応答されました。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/007_section3_before_action.png" alt="007 section3 before action" />
</figure>

### 3.6 htmxでAjax通信する

`http://localhost:3001/section3` をブラウザで開くと「クリック」とラベル付けされたボタンがいくつか表示されます。その一つをクリックしましたが、表面的には何の変化も起きません。DevToolのコンソールを見ると 404 Not Found のエラーが記録されていました。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/008_section3_click_404.png" alt="008 section3 click 404" />
</figure>

何が起きたのか？要点だけを述べます。htmxに関する詳細な説明は [htmx本](https://www.c-r.com/book/detail/1595) を参照のこと。 `section3.tsx` のなかには下記のように ht-get属性が書いてある。

                    <h2>hx-get</h2>
                    <button hx-get="/hello">クリック</button>

ボタンをクリックすると JavaScript `htmx.min.js` に実装されたイベントハンドラが反応する。イベントハンドラは URL `http://localhost:3001/hello` に対してHTTP GET要求を送信する。ところがwebアプリケーションがまだ `GET /hello` に応答する準備ができていないので、404 Not Foundを応答しました。

`src/main.tsx` を修正して `GET /hello` に応答できるようにします。

    // src/main.ts
    import { Hono } from 'hono';
    import { serve } from '@hono/node-server';
    import { serveStatic } from '@hono/node-server/serve-static';
    import { Top } from './top';
    import { Section3 } from './section3';

    const app = new Hono();
    app.use('*', serveStatic({ root: './static'}))

    app.get('/', (c) => {
        const messages = ['Hello htmx'];
        return c.render(
            <Top messages={ messages } />
        )
    });

    app.get('/section3', (c) => {
        const messages = ['Hello htmx']
        return c.render(
            <Section3 messages={messages} />
        )
    })

    app.on(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], '/hello', (c) => {
        if (c.req.method == "GET") {
            return c.render(<span style='color:#ff0000;'>GETリクエスト!</span>)
        } else if (c.req.method == "POST") {
            return c.render(<span style='color:#00bf00;'>POSTリクエスト!</span>)
        } else if (c.req.method == "PUT") {
            return c.render(<span style='color:#0000ff;'>PUTリクエスト!</span>)
        } else if (c.req.method == "PATCH") {
            return c.render(<span style='color:#ff00ff;'>PATCHリクエスト!</span>)
        } else if (c.req.method == "DELETE") {
            return c.render(<span style='color:#ff0000;'>DELETEリクエスト!</span>)
        } else {
            throw new Error('unexpected c.req.method=' + c.req.method)
        }
    })

    const server = serve({
        port: 3001,
        fetch: app.fetch
    })

    export default server;

この修正をした後でブラウザで `http://localhost:3001/section3` を開き、「クリック」ボタンを押すと下記のような画面表示に遷移しました。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/009_section3_responded.png" alt="009 section3 responded" />
</figure>

これでようやくhtmxが動いている様子を見ることができました。

htmx本はhtmxのたくさんの機能を紹介するサンプルコードを紹介しています。htmx本を読みながら、上記で `src/section3.jsx` を作ったのと同じノリで \`section4.tsx\`を追加し\`section5.tsx\`を追加してと、次々に拡張していくことができます。

## 4 テストの土台を作る

### 4.1 テストコードを格納する場所として `tests` ディレクトリを追加する

webアプリのコードを `src` ディレクトリに格納してきました。それとは別にテストコードを格納するために `tests` ディレクトリを作ります。

    $ cd $PROJECT
    $ mkdir tests
    $ tree . -L 2
    .
    ├── node_modules
    ├── package.json
    ├── README.md
    ├── src
    │   ├── layout.tsx
    │   ├── main.tsx
    │   ├── section3.tsx
    │   └── top.tsx
    ├── static
    │   ├── htmx
    │   └── styles
    ├── tests
    └── tsconfig.json

### 4.2 テストコードがどこに格納されているかをbunに教える

- 参考情報: [Test configuration - Bun, Test Discovery](https://bun.com/docs/test/configuration#root)

`bun test` コマンド実行時に `tests` ディレクトリの中のテストコードを探し出すよう設定する。`bunfig.toml` ファイルを追加する。

    # PROJECT/bunfig.toml
    [test]
    root = "tests"  # scan for tests only in the "tests" directory

### 4.3 Playwrightライブラリをプロジェクトに追加する

Playwrightのライブラリをプロジェクトに追加します。次のようにコマンドを投入する。

    $ cd $PROJECT
    $ bun add -d @playwright/test
    bun add v1.3.14 (0d9b296a)

    installed @playwright/test@1.61.1 with binaries:
     - playwright

    [6.79s] done

    $ bun add -d playwright-chromium
    bun add v1.3.14 (0d9b296a)

    installed playwright-chromium@1.61.1 with binaries:
     - playwright

    [9.73s] done

### 4.4 PlaywrightのAPIを使ってブラウザを操作するテストを書く

Chromiumブラウザを起動し、Webサイト `http://example.com` を開いて、HTMLの中身を検証し、それが済んだらブラウザを閉じる、というテストを書きました。PlaywrightのAPIを使ってブラウザを操作するテストコード `tests/play-on-browser.test.ts` を作りました。

    // $PROJECT/tests/play-on-browser.test.ts
    import { describe, test, expect } from 'bun:test';
    import type { Browser, BrowserContext, Page } from '@playwright/test';
    import { chromium } from '@playwright/test';

    describe("Play on the Playwright Browser API", async () => {
        // Here I assume that the server at http://localhost:3001 is already up and running.
        let browser: Browser;
        let context: BrowserContext;
        let page: Page;
        test("open browser, navigate to a URL, verify the content, close the browser", async () => {
            // Launch Chromium browser in non-headless mode, navigate to a URL
            browser = await chromium.launch({
                headless: false
            });
            expect(browser).toBeDefined();
            expect(browser.browserType().name()).toBe('chromium');
            console.log(`browser.browserType().executablePath()=${browser.browserType().executablePath()}`);
            context = await browser.newContext({
                viewport: { width: 800, height: 300 }
            });
            page = await context.newPage();
            await page.goto('http://example.com');
            await page.waitForLoadState('load', { timeout: 10_000 });
            // Check if the page title is correct
            const text = await page.locator('h1').innerText();
            expect(text).toBe('Example Domain');
            // Wait for a few seconds to observe the browser before closing it
            await delay(3000);
            // close the browser
            await context.close();
            await browser.close();
        }, 15000)
    })

    async function delay(timeoutMs: number) {
        await new Promise(resolve => setTimeout(resolve, timeoutMs));
    }

冒頭1行目に注目してください。

    import { describe, test, expect } from 'bun:test';

`test` と `expect` が `bun:test` からimportされていることに注目してほしい。

Playwrightによるテストの書き方を教えるwebサイトは山ほどある。たとえば

- ["Playwright &gt; Getting Started &gt; Writing tests" By Microsoft](https://playwright.dev/docs/writing-tests)

そのサンプルコードはこう書いている。

    import { test, expect } from '@playwright/test';

わたしは `bun:test` からimportした `test` と `expect` を使って書きたかった。なぜなら TypeScriptの関数やclassをユニット・テストするときには間違いなく `bun:test` の `expect` をわたしは選択します。その用途に `@playwright/test` の `expect` は適さないからです。

### 4.5 bun testコマンドでテストを実行する

テストを実行しましょう。bunに組み込まれたテストランナーを使います。

    $ cd $PROJECT
    $ bun test ./tests/play-on-browser.test.ts
    bun test v1.3.14 (0d9b296a)

    tests/play-on-browser.test.ts:
    browser.browserType().executablePath()=/Users/kazurayam/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing
    ✓ Play on the Playwright Browser API > open browser, navigate to a URL, verify the content, close the browser [2744.18ms]

     1 pass
     0 fail
     3 expect() calls
    Ran 1 test across 1 file. [3.21s]

テストコードがPlaywrightのAPIを経由してChromiumブラウザを立ち上げ `http://example.com` を開き、数秒待ってブラウザを閉じる様子が見えました。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/010_play-on-browser.png" alt="010 play on browser" />
</figure>

### 4.6 ロギングフレームワーク LogTape を導入する

- 参考情報: [Qiita「LogTape：JavaScript/TypeScript向けのシンプルで柔軟なロギングライブラリの紹介と使い方」](https://qiita.com/hongminhee/items/fff0ce9c8ae50e70496b)

console.log("xxx")でメッセージをコンソールに出力するのは簡単で好ましいが、やり過ぎるとコンソールの表示がごちゃごちゃになり見づらくなる。ログを出力先をファイルに変更したい。そこで [LogTape](https://logtape.org) というロギングフレームワークを導入します。

`bun add` でLogTapeを追加します。

    $ cd $PROJECT
    $ bun add @logtape/logtape
    $ bun add @logtape/file

ログファイルの出力先として `out` ディレクトリを追加します。

    $ cd $PROJECT
    $ mkdir out

`tests/play-on-browser.test.ts` を下敷きとして別のテストコード `play-on-browser-using-logtape.test.ts` を書きました。

    // $PROJECT/tests/play-on-browser-using-logtape.test.ts
    import { describe, test, expect } from 'bun:test';
    import type { Browser, BrowserContext, Page } from '@playwright/test';
    import { chromium } from '@playwright/test';
    import { getLogger } from '@logtape/logtape';

    const logger = getLogger(["my-app", "play-on-browser.test"]);

    describe("Play on Playwright's Browser API", async () => {
        // Here I assume that the server at http://localhost:3001 is already up and running.
        let browser: Browser;
        let context: BrowserContext;
        let page: Page;
        test("open browser, navigate to a URL, verify the content, close the browser", async () => {
            // Launch Chromium browser in non-headless mode, navigate to a URL
            browser = await chromium.launch({ headless: false });
            expect(browser).toBeDefined();
            expect(browser.browserType().name()).toBe('chromium');
            logger.info(`browser.browserType().executablePath()=${browser.browserType().executablePath()}`);
            context = await browser.newContext({
                viewport: { width: 800, height: 300 }
            });
            page = await context.newPage();
            await page.goto('http://example.com');
            await page.waitForLoadState('load', { timeout: 10_000 });
            // Check if the page title is correct
            const text = await page.locator('h1').innerText();
            expect(text).toBe('Example Domain');
            // Wait for a few seconds to observe the browser before closing it
            await delay(1000);
            // close the browser
            await context.close();
            await browser.close();
        }, 20000)
    })

    async function delay(timeoutMs: number) {
        await new Promise(resolve => setTimeout(resolve, timeoutMs));
    }

元の `play-on-browser.test.ts` のなかで `console.log("…​")` と書いていた行を `logger.info(…​)` と書き換えています。

この段階で `bun test ./tests/play-on-browser-using-logtape.test.ts` を実行してもまだLogTapeがログを出力しません。LogTapeを働かせるには設定を加える必要があります。 `$PROJECT/logtape.ts` ファイルを追加します。

    // $PROJECT/logtape.ts
    import { configure, getConsoleSink } from "@logtape/logtape";
    import { getFileSink } from "@logtape/file";

    await configure({
        sinks: {
            console: getConsoleSink(),  // 出力先としてコンソールを宣言
            file: getFileSink("./out/my-app.log", {
                flushInterval: 1000,
                nonBlocking: true,
            })  // 出力先としてファイルを宣言。1秒間隔でバッファをflushする。
        },
        loggers: [
            { category: ["my-app"], lowestLevel: "debug", sinks: ["file"] },
            { category: ["logtape", "meta"], lowestLevel: "warning", sinks: ["console"] },
        ],
    });

さらに `$PROJECT/bunfig.toml` を修正します。

    # $PROJECT/bunfig.toml
    [test]
    root = "tests"  # scan for tests only in the "tests" directory
    preload = [ "./logtape.ts" ]

`bunfig.toml` の `[test]` セクションに `preload = [ "./logtape.ts" ]` と記述しました。これにより、`bun test` コマンドが実行された時にテストコードが実行される前に一度だけコマンド `bun ./logtape.ts` が実行されます。`logtape.ts` がLogTapeを初期設定し sink や logger を準備します。

`play-on-borowser-using-logtape.test.ts` は

    const logger = getLogger(["my-app", "play-on-browser.test"]);

とやって初期設定されたloggerをインスタンス化して利用します。

これでLogTapeの設定ができました。テストを実行しましょう。

    $ cd $PROJECT
    $ bun test ./tests/play-on-browser.test.ts
    $ bun test ./tests/play-on-browser.test.ts
    bun test v1.3.14 (0d9b296a)

    tests/play-on-browser.test.ts:
    ✓ Play on the Playwright Browser API > open browser, navigate to a URL, verify the content, close the browser [21298.08ms]

     1 pass
     0 fail
     3 expect() calls
    Ran 1 test across 1 file. [21.63s]

console.log()によるメッセージが無くなってコンソールの表示がスッキリした。いっぽうで `$PROJECT/out/my-app.log` ファイルが作られ、次のようなログが出力されました。

    2026-07-03 00:20:48.907 +00:00 [INF] my-app·play-on-browser.test: browser.browserType().executablePath()=/Users/kazuakiurayama/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing

テストコードのみならずwebアプリ本体もロギングフレームワークを利用して、詳細なログ情報をファイルに出力することができる。`console.log(…​)` に頼ってログ出力するとコンソールがごちゃごちゃになって作業しづらくなる。その問題を根本的に回避することができます。

## 5 htmx構文で実装されたwebページの動作をPlaywrightでテストする

`bun run main` コマンドでwebアプリを起動し、ブラウザで `http://localhost:3001` を開きます。リンク "Section3" をクリックすると、htmxのサンプルコードが動作する画面 `http://localhost:3001/section3` が表示されます。この画面の中で「クリック」と表示されたボタンをマウスでclickすると「GETリクエスト!」に切り替わります。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/009_section3_responded.png" alt="009 section3 responded" />
</figure>

さていよいよテストを実装しましょう。clickに反応してボタンのラベルが切り替わるかどうかをテストしよう。そのようなテストをPlaywrightのAPIを利用して書きたい。テストを `bun test` コマンドで実行したい。どうすればいいのか？これが次のテーマです。

### 5.2 E2Eテストを実行する

`http://localhost:3001/section3` にアクセスして、ボタンをクリックしたらボタンのラベルが切り替わるかどうかを検証するテストコード 'tests/section3.e2e.ts' を書きました。`tests/section3.e2e.ts` を実行するには、`http://localhost:3001` の webアプリを起動しておく必要があります。`bun test` を実行して終了したら、webアプリを停止したい。タイピングが大変です。コマンド操作を簡便にするために `package.json` の `scripts` に `testmain` サブコマンドを追加しました。

      ...
      "scripts": {
        "main": "bun run --hot src/main.tsx",
        "testmain": "bun run --hot src/main.tsx & bun test ./tests/*.e2e.ts; kill $(ps aux | grep '[0-9] bun run --hot' | awk '{print $2}')",
        ...

`bun run testmain` コマンドは次のことをします。

1.  `bun run src/main.tsx` でwebアプリを起動する

2.  それと並行して `bun test` コマンドでテストを実行する。`tests` ディレクトリの中にあってファイル名の末尾が `.e2e.ts` であるテストが選択されて実行されます。

3.  全部のテストが終了するのを待って、webアプリのプロセスを停止します

<!-- -->

    $ bun run testmain
    $ bun run --hot src/main.tsx & bun test ./tests/*.e2e.ts; kill $(ps aux | grep '[0-9] bun run --hot' | awk '{print $2}')
    bun test v1.3.14 (0d9b296a)

    tests/section3.e2e.ts:
    ✓ test http://localhost:3001/section3 > click <button hx-get=/hello>, then the button should show GETリクエスト! [814.27ms]
    ✓ test http://localhost:3001/section3 > click <button hx-post=/hello>, then the button should show POSTリクエスト! [354.32ms]
    ✓ test http://localhost:3001/section3 > click <button hx-put=/hello>, then the button should show PUTリクエスト! [300.15ms]
    ✓ test http://localhost:3001/section3 > click <button hx-patch=/hello>, then the button should show PATCHリクエスト! [304.47ms]
    ✓ test http://localhost:3001/section3 > click <button hx-delete=/hello>, then the button should show DELETEリクエスト! [279.75ms]

     5 pass
     0 fail
    Ran 5 tests across 1 file. [3.78s]

### 5.2 E2Eテスト `tests/section3.e2e.ts`

`http://localhost:3001/section3` に対するGET要求に応答されたHTMLをテストするコードを書きました。

    // tests/section3.e2e.ts
    import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
    import * as PW from '@playwright/test';
    import { BrowserDriverChromium } from './BrowserDriverChromium';
    import { getLogger } from '@logtape/logtape';

    const logger = getLogger(["my-app", "section3.test"]);
    const url = 'http://localhost:3001/section3';

    describe(`test ${url}`, async () => {
        // Here I assume that the server at http://localhost:3001 is already up and running.
        let driver: BrowserDriverChromium;
        let page: PW.Page;
        beforeAll(async () => {
            driver = await BrowserDriverChromium.create('section3', { headless: false });
        });
        beforeEach(async () => {
            page = await driver.navigateToUrl(url);
        }, 20_000);

        test("click <button hx-get=/hello>, then the button should show GETリクエスト!", async () => {
            // Select the button
            const button: PW.Locator = page.locator('css=button[hx-get]');
            // make sure the button is clickable
            await button.waitFor({ state: 'visible', timeout: 5000 });
            await PW.expect(button).toBeEnabled();
            // Click the button!
            await button.click();
            const span: PW.Locator = page.getByText('GETリクエスト!');
            await PW.expect(span).toBeVisible();
        });

        test("click <button hx-post=/hello>, then the button should show POSTリクエスト!", async () => {
            // Select the button
            const button: PW.Locator = page.locator('css=button[hx-post]');
            await button.waitFor({ state: 'visible', timeout: 5000 });
            await PW.expect(button).toBeEnabled();
            // Click the button!
            await button.click();
            const span: PW.Locator = page.getByText('POSTリクエスト!');
            await PW.expect(span).toBeVisible();
        });

        test("click <button hx-put=/hello>, then the button should show PUTリクエスト!", async () => {
            // Select the button
            const button: PW.Locator = page.locator('css=button[hx-put]');
            await button.waitFor({ state: 'visible', timeout: 5000 });
            await PW.expect(button).toBeEnabled();
            // Click the button!
            await button.click();
            const span: PW.Locator = page.getByText('PUTリクエスト!');
            await PW.expect(span).toBeVisible();
        });

        test("click <button hx-patch=/hello>, then the button should show PATCHリクエスト!", async () => {
            // Select the button
            const button: PW.Locator = page.locator('css=button[hx-patch]');
            await button.waitFor({ state: 'visible', timeout: 5000 });
            await PW.expect(button).toBeEnabled();
            // Click the button!
            await button.click();
            const span: PW.Locator = page.getByText('PATCHリクエスト!');
            await PW.expect(span).toBeVisible();
        });

        test("click <button hx-delete=/hello>, then the button should show DELETEリクエスト!", async () => {
            // Select the button
            const button: PW.Locator = page.locator('css=button[hx-delete]');
            await button.waitFor({ state: 'visible', timeout: 5000 });
            await PW.expect(button).toBeEnabled();
            // Click the button!
            await button.click();
            const span: PW.Locator = page.getByText('DELETEリクエスト!');
            await PW.expect(span).toBeVisible();
        });

        afterEach(async () => {
            await page.close();
        });
        afterAll(async () => {
            driver.close();
        });
    })

    async function delay(timeoutMs: number) {
        await new Promise(resolve => setTimeout(resolve, timeoutMs));
    }

このコードについていくつか注釈を加えます

#### bun の `test` を使う

    import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
    import * as PW from '@playwright/test';
    ...
    describe(`test ${url}`, async () => {
        let driver: BrowserDriverChromium;
        let page: PW.Page;
        ...

`bun:test` からimportされてた `describe` と `test` を使っていることに注意してほしい。[Playwright API](https://playwright.dev/docs/writing-tests#using-test-hooks) にも名前のよく似た `describe` と `test` があるのだが全く別のものです。

#### 名前空間 `PW`

`import * as PW from '@playwright/test';` としてPlaywrightのAPIを `PW` という名前空間で表し、参照可能にしています。`PW.Page` はPlaywrightのPageクラスである。

            const span: PW.Locator = page.getByText('GETリクエスト!');
            await PW.expect(span).toBeVisible();

ここで `PW.expect` という名前で呼び出しているのはPlaywrightの `expect` である。`` from bun:test`によってimportされた `expect `` ではありません。

#### Playwrightのpageとlocatorとexpect

Playwrightの `page` オブジェクトと `locator` オブジェクトを使ってさまざまのactionを実行したり、DOM要素の状態を調べたりEventを捕捉したりすることができる。詳細な解説をネット上でたくさん見つけることができる。たとえばPlaywrightの公式ドキュメント

- [Writing tests](https://playwright.dev/docs/writing-tests)

を参照のこと。

### 5.3 ヘルパ `BrowserDriverChromium.ts` と `browser-helpers.ts`

`section3.e2e.ts` は \`BrowserDriverChromium\`クラスをimportしている。

    // tests/BrowserDriverChromium.ts

    import type { Browser, BrowserContext, Page } from '@playwright/test';
    import * as BH from './browser-helpers';
    import { getLogger } from '@logtape/logtape';

    const logger = getLogger(["my-app", "BrowserDriverChromium"]);

    export class BrowserDriverChromium {
        private id: string;
        private browser: Browser;
        private context: BrowserContext;

        // you should call create() instead of the private constructor
        private constructor(id: string, browser: Browser, context: BrowserContext) {
            this.id = encodeURIComponent(id);
            this.browser = browser;
            this.context = context;
        }

        // static method for async initialization
        static async create(id: string, options: object = {}, args: string[] = []): Promise<BrowserDriverChromium> {
            const browser = await BH.launchChromium(options, args);
            const context = await BH.newContext(browser);
            context.tracing.start({ screenshots: true, snapshots: true })
            return new BrowserDriverChromium(id, browser, context);
        }

        getBrowser(): Browser {
            return this.browser;
        }

        getContext(): BrowserContext {
            return this.context;
        }

        async navigateToUrl(url: string): Promise<Page> {
            try {
                const page = await BH.newPage(this.context);
                await page.goto(url, { timeout: 15_000 });
                await page.waitForLoadState('load', { timeout: 5_000 });
                return page;
            } catch (error) {
                logger.error(`${error}`);
                // when an error occured, restart the browser and retry
                this.browser.close();
                this.browser = await BH.launchChromium();
                this.context = await BH.newContext(this.browser);
                await this.context.tracing.start({ screenshots: true, snapshots: true })
                //
                const page = await BH.newPage(this.context);
                await page.goto(url, { timeout: 15_000 });
                await page.waitForLoadState('load', { timeout: 5_000 });
                logger.info(`[beforeEach] recreated the browser`)
                return page;
            }
        }

        async close() {
            if (this.context) {
                await this.context.tracing.stop({ path: `./out/traces/${Date.now()}-${this.id}` });
                await this.context.close()
            }
            if (this.browser) {
                await this.browser.close()
            }
        }
    }

`` BrowserDriverChromium`オブジェクトはChromiumブラウザを立ち上げたり、URLにnavigateしたり、ブラウザをクローズするといった操作を実装している。テストコードがPlaywrightの `Browser `` クラスと `BrowserContext` クラスを意識することなく `Page` オブジェクトだけを意識すればいいように細部を隠す役を果たしています。

`` BrowserDriverChromium`は `tests/browser-helpers.ts `` が実装するstaticな関数をcallしている。

    // tests/browser-helpers.ts
    import type { Browser, BrowserContext, Page } from '@playwright/test';
    import { chromium } from '@playwright/test';

    export const openChromium = async (options: object = {}, args: string[] = []):
        Promise<{ browser: Browser, context: BrowserContext }> => {
        const browser = await launchChromium(options, args);
        const context = await newContext(browser);
        return { browser, context };
    }

    /**
     * https://www.technetexperts.com/slow-playwright-new-page-fix/
     */
    export const launchChromium = async (options: object = {}, args: string[] = []): Promise<Browser> => {
        let transientOptions = {
            headless: true,
            timeout: 10_000,
        };
        if (options) {
            transientOptions = { ...transientOptions, ...options }
        }
        let transientArgs = [
            // Recommended optimization arguments for enterprise network environments
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // Crucial for bypassing network checks/proxy auto-detection delays
            '--no-proxy-server',
            '--proxy-bypass-list=*',
            // Prevents slow DNS fallbacks or resolving internal domain lookups
            '--disable-features=NetworkService',
            '--disable-dev-shm-usage',
        ];
        if (args) {
            transientArgs = [...transientArgs, ...args];
        }
        const browser = await chromium.launch({ "args": transientArgs, ...transientOptions });
        return browser;
    };

    export const newContext = async (browser: Browser): Promise<BrowserContext> => {
        if (browser) {
            const context = await browser.newContext({
                javaScriptEnabled: true,
                viewport: { width: 700, height: 800 }
            });
            // some custom settings
            context.removeAllListeners();
            context.setDefaultNavigationTimeout(20_000);
            return context;
        } else {
            throw new Error('browser is required')
        }
    };

    export const newPage = async (context: BrowserContext): Promise<Page> => {
        if (context) {
            return await context.newPage();
        } else {
            throw new Error('context is required')
        }
    }

\`browser-helpers\`の関数は 各種のパラメータやオブションに具体的な値を指定しつつPlaywright API を直に呼び出す役を果たします。たとえばChromiumブラウザのウインドウをheadless（不可視）にするかどうかの指定や、ウインドウの縦横のサイズを指定することができる。詳細については Playwright APIの [Browser](https://playwright.dev/docs/api/class-browser) クラスと [BrowserType](https://playwright.dev/docs/api/class-browserType) クラスのAPI Referenceドキュメントを参照していただきたい。

## 6. まとめ

htmx構文を使ったwebアプリケーションをbunとHonoの上で構築しPlaywrightのライブラリを使ってE2Eテストすることができた。E2Eテストを実行するに `bun` に組み込まれたテストランナーを使った。htmxを使ったwebアプリをPlaywrightでテストするという事例の紹介はネット上に見当たらない（と思う）。誰かの役に立てばいいなと思っています。
