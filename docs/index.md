- Table of contents
{:toc}

# Htmx and Playwright Tests in TypeScript

- project version: unknown

- published at date: 2026-07-13

- GitHub Repository: <https://github.com/kazurayam/htmx-and-playwright-tests-in-typescript>

書籍 [「JavaScriptレスの動的UI開発 htmx入門」太田智暉 著、C＆R研究所](https://www.c-r.com/book/detail/1595) （以下で "htmx本" と略する）のサンプルコードを読んで [htmx](https://htmx.org/) を活用したwebアプリケーションを開発する手法を学ぼうと思った。htmxそのものについての解説はhtmx本に譲る。webアプリケーションをTypeScriptで構築することと、Playwrightでend-to-endテストを実装することについて、わたしなりの工夫をした。どうやったか忘備録として以下に記述する。

## 1 達成目標と課題

わたしは次のようなことを達成したい。

1.  わたしはhtmxを理解するためにhtmx本のサンプルコードを写経して動かしたい。

2.  htmxを採用したHTMLをブラウザ上で開いて動きを確認するためにはバックエンドとしてのwebアプリケーションが必要だ。htmx本の著者はPython言語で書いたwebアプリケーションの [ソースコード一式](https://github.com/tomo1227/htmx_book_app) をGitHubで公開している。それはさておき、わたしはwebアプリをTypeScript言語で書きたい。

3.  webアプリを [bun](https://bun.com/docs) と [Hono](https://hono.dev/) の上に構築したい。Node.jsとExpressではなくて。

4.  htmx本はテストをどう書くかについて言及していないが、わたしは [Playwright](https://playwright.dev/docs/intro) を使ってwebアプリをテストしたい。

ひとつ課題がある。わたしはPlaywrightをbunの上で利用したい。ところがbunの上でPlaywrightを動かす事例紹介がネット上にほとんど見当たらない。Playwrightの公式ドキュメント [Getting started/Installation](https://playwright.dev/docs/intro) を見れば明らかだが、Playwrightがそもそも [Node.js](https://nodejs.org/) を前提に開発されたからだろう、テストを実行するのに `npx playwright` というコマンドを使えと書いている記事ばかりだ。ところがbunに `npx` は無い。初手から詰まってしまった。どうすればいいのか？わたしは自力で答えを見つけなければならない。

## 2 基盤を準備する

### 2.1 実行環境

- Apple MacBook Air, M1

- macOS 26.5.1

- bash 3.2.57(1)-release (x86\_64-apple-darwin25)

- node v24.9.0, npm 11.7.0, npx 11.7.0 がインストール済み

- Visual Studio Code 1.125.1

### 2.2 bunをインストールする

- 参考情報: [bun公式 Installation](https://bun.com/docs/installation)

- 参考情報: [Bun コマンド チートシート：bun install／run／x／test／build 一括早見表](https://t-cr.jp/article/c5h1j98oknorvak)

bunをインストールするには公式サイトの指示に従ってコマンドを投入する。

    $ curl -fsSL https://bun.com/install | bash

### 2.3 Gitレポジトリのルートとなるディレクトリを作る

任意の場所でディレクトリを作る。

    $ mkdir htmx-and-playwright-tests-in-typescript

このディレクトリをGitレポジトリのルート・ディレクトリとする。記述を簡素にするためこのディレクトリを **$ROOT** という記号で表すことにする。下記のようにしてシェル変数を定義したのと同じ。

    $ cd htmx-and-playwright-tests-in-typescript
    $ ROOT=`pwd`

将来的にこのレポジトリをいわゆる「モノレポ」にしたいと思う。だから$ROOTの下にサブディレクトリ `packages` を作り、その下にwebアプリケーションを格納することにする。

    $ cd $ROOT
    $ mkdir packages

### 2.4 webアプリケーション `my-app` の雛形を作る

- 参考情報: <https://bun.com/docs/quickstart>

`$ROOT/packages` ディレクトリにcdしてから `bun init` コマンドを実行する。引数としてパッケージ名 `my-app` を指定した。

    $ cd $ROOT
    $ cd packages
    $ bun init my-app
    ? Select a project template - Press return to submit.
    ❯   Blank
        React
        Library

ここで\`Blank\`を選択した。

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

これによって `$ROOT/packages` ディレクトリの下に新しいディレクトリ `my-app` が作られる。以下の記述を簡略にするためにこのディレクトリを **MYAPP** という記号で表すことにする。下記のようにシェル変数を定義した。

    $ cd $ROOT
    $ cd packages/my-app
    $ MYAPP=`pwd`
    $ echo $MYAPP
    /Users/kazurayam/github/htmx-and-playwright-tests-in-typescript/packages/my-app

$MYAPP の中に `package.json` をはじめとするいくつかのファイルが生成された。

    $ cd $MYAPP
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

これらのファイル群がwebアプリケーションの雛形となる。自動生成された `$MYAPP/index.ts` ファイルの中身は下記の通りです。

    console.log("Hello via Bun!");

これをコマンドラインで実行することができます。

    $ cd $MYAPP
    $ bun run index.ts
    Hello via Bun!

予想通りの結果が出た。次に `$MYAPP/index.ts` を下記のように書きかえよう。ポート番号 3000 をlistenするHTTPサーバを実装している。

    // my-app/index.ts
    const server = Bun.serve({
        port: 3000,
        routes: {
            "/": () => new Response('Bun!'),
        }
    });

    console.log(`Listening on ${server.url}`);

コマンドラインで `bun index` コマンドを実行しよう。

    $ cd $MYAPP
    $ bun index.ts
    Listening on http://localhost:3000/

webサーバが立ち上がりました。ではChromeブラウザを立ち上げて <http://localhost:3000/> を開いてみましょう。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/001_index.ts.png" alt="001 index.ts" />
</figure>

簡素だがまともなHTTP応答が画面に表示されました。webサーバーを停止するにはコマンドラインで CTRL+C と入力します。

## 3 webアプリケーションの雛形を実装する

### 3.1 Honoを導入する

- 参考情報: <https://hono.dev/docs/getting-started/bun>

`my-app` プロジェクトに [Hono](https://hono.dev/) を導入しwebアプリケーションの開発に着手します。$MYAPPディレクトリにcd して `bun add` コマンドでhonoパッケージを導入します。

    $ cd $MYAPP
    $ bun add hono

すると `my-app/package.json` ファイルの `dependencies` プロパティに hono が追加された。

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

$MYAPPディレクトリの下に `src` ディレクトリを追加し、 `src` ディレクトリの下に `main.ts` ファイルを追加します。

    $ cd $MYAPP
    $ mkdir src
    $ cd src
    $ touch main.ts

$MYAPPディレクトリの中身はこうなりました。

    $ cd $MYAPP
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

`my-app/package.json` に `script` プロパティを挿入し、`main` サブコマンドを定義しました。

    {
      "name": "my-app",
      "module": "index.ts",
      "type": "module",
      "private": true,
      "scripts": {
        "main": "bun --hot src/main.ts"
      },
      ...

さて、コマンドラインで `bun run main` コマンドを実行しましょう。

    $ cd $PROJECT
    $ bun run main
    Started development server: http://localhost:3000

これによってwebアプリケーションが立ち上がって `http://localhost:3000` がアクセス可能になった。ブラウザでアクセスしてみた。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/002_main.ts.png" alt="002 main.ts" />
</figure>

`main.ts` が応答した `Hello Bun!` という文字がたしかに画面に表示されています。

### 3.2 webアプリがlistenするIPポート番号を指定する

- 参考情報: <https://hono.dev/docs/getting-started/nodejs#change-port-number>

`new Hono()` でインスタンス化されるHTTPサーバはデフォルトで 3000のIPポートをlistenします。これを別なポート番号に切り替えたい。例えば 3001 にしたい。どうすればいいか？

`src/main.ts` を修正します。

    import { Hono } from 'hono'

    const app = new Hono()
        .get('/', (c) => c.text('Hello Bun!'));

    export default {
        port: 3001,
        fetch: app.fetch
    }

portをexportすれば良い

`bun run main` コマンドでwebアプリを起動しよう。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/003_main_3001.png" alt="003 main 3001" />
</figure>

ポート番号 3001 をlistenするwebアプリが立ち上がりました。

### 3.3 JSXを導入する

- 参考情報: <https://hono.dev/docs/guides/jsx>

ここから先はhtmx本のバックエンドの役を果たすwebアプリケーションを構築することを目標に、`main.ts` を拡張していきます。HTMLを応答するために [JSX](https://engineer-tips.com/2025/06/21/what-is-jsx/) を導入します。

”JSX”をキーとしてネットを検索するとたくさんヒットします。その多くは「Reactで使うJSX」とか「React初心者が理解すべきJSX」というタイトル。あたかもJSXがReactの構成部品であるかのように語られることが多い。しかしJSXはReactとの組み合わせでだけ使える技術ではない。HonoはJSXの処理系を同梱しています。bunとJSXの組み合わせでServer Side Rendering(SSR)を簡単に実現できる。htmxの利点の一つはサーバからクライアントへダウンロードされるJavaScriptコードの量が小さいから応答が速いということ。htmxの利点を活かすのにSSRは適していると思う。

HonoでJSXを利用するために `tsconfig.json` ファイルを変更し、`jsxImportSource` を宣言します。

    {
      "compilerOptions": {
        ...
        "jsx": "react-jsx",
        "jsxImportSource": "hono/jsx",
        ...

`main.ts` を `main.tsx` に変更します。すなわちTypeScriptファイルがJSX構文を使っていることを明示するためにファイル名の拡張子を `.tsx` にします。`package.json` ファイルの `scripts` を下記のように修正するのを忘れずに。

      ...
      "scripts": {
        "main": "bun --hot src/main.tsx"
      },
      ...

`src/main.tsx` のなかみを下記のように変更します。

    // src/main.ts
    import { Hono } from 'hono'
    import { Top } from './top';

    const app = new Hono();

    app.get('/', (c) => {
        const messages = ['Hello htmx'];
        return c.render(
            <Top messages={ messages } />
        )
    });

    export default {
        port: 3001,
        fetch: app.fetch
    };

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

なぜエラーが発生したか? \`src/layout.tsx\`に次のコードが書いてある。

        ...
        <script src="/htmx/htmx.min.js" hx-preserve="true"></script>
        <link rel="stylesheet" href="/styles/tutorial.css"></link>
        ...

そのいっぽうで `/htmx/htmx.min.js` と `/styles/tutorial.css` という二つのURLに対応するファイルをwebアプリが応答する準備がまだできていない。この問題を解決しよう。

$MYAPP ディレクトリの下に `static` ディレクトリを追加します。`static` ディレクトリの下に `htmx` ディレクトリと `styles` ディレクトリを追加します。

    $ cd $MYAPP
    $ mkdir static
    $ cd static
    $ mkdir htmx
    $ mkdir styles
    $ cd -

下記のサイトから `htmx.min.js` の最新バージョンをダウンロードして `$MYAPP/static/htmx/htmx.min.js` として保存しましょう。

- <https://www.jsdelivr.com/package/npm/htmx.org>

htmx本の著者によるサンプルコードのGitHubレポジトリから `tutorial.css` をダウンロードして `$MYAPP/static/styles/tutorial.css` として保存しましょう。

- <https://github.com/tomo1227/htmx_book_app/blob/main/static/styles/tutorial.css>

詰めの仕事が残っています。URLをファイルに対応づける必要がある。すなわち

- URL `http://localhost:3001/htmx/htmx.min.js` → webアプリのファイルパス `$MYAPP/static/htmx/htmx.min.js`

- URL `http://localhost:3001/styles/tutorial.css` → `$MYAPP/static/styles/tutorial.css`

そこで `src/main.jsx` を修正します。

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

そして `src/main.tsx` も修正します。いま追加した `src/section3.tsx` を組み込んで URL `http://localhost:3001/section3` として応答できるようにします。

    // src/main.ts
    import { Hono } from 'hono';
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

    export default {
        port: 3001,
        fetch: app.fetch
    }

ブラウザで `http://localhost:3001` を開き "Section3" へのリンクをクリックすると、さっきまでは "404 Not Found" だったのにかわって次のような画面が応答されました。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/007_section3_before_action.png" alt="007 section3 before action" />
</figure>

### 3.6 htmxでAjax通信する

`http://localhost:3001/section3` をブラウザで開くと「クリック」とラベル付けされたボタンがいくつか表示されている。その一つをクリックしましたが、表面的には何の変化も起きません。DevToolのコンソールを見ると 404 Not Found のエラーが記録されていました。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/008_section3_click_404.png" alt="008 section3 click 404" />
</figure>

何が起きたのか？要点だけを述べます。htmxに関する詳細な説明は [htmx本](https://www.c-r.com/book/detail/1595) を参照のこと。 `section3.tsx` のなかには下記のように ht-get属性が書いてある。

                    <h2>hx-get</h2>
                    <button hx-get="/hello">クリック</button>

ボタンをクリックすると JavaScript `htmx.min.js` に実装されたイベントハンドラが反応する。イベントハンドラは URL `http://localhost:3001/hello` に対してHTTP GET要求を送信する。webアプリケーションはそれに何かを応答すべきだ。ところがまだ `GET /hello` に応答する準備ができていないので、404 Not Foundを応答しました。

`src/main.tsx` を修正して `GET /hello` に応答できるようにします。

    // src/main.ts
    import { Hono } from 'hono';
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

    export default {
        port: 3001,
        fetch: app.fetch
    };

この修正をした後でブラウザで `http://localhost:3001/section3` を開き、「クリック」ボタンを押すと下記のような画面表示に遷移しました。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/009_section3_responded.png" alt="009 section3 responded" />
</figure>

htmxが動いた！

htmx本はhtmxのたくさんの機能を紹介するサンプルコードを紹介しています。htmx本を読みながら、上記で `src/section3.jsx` を作ったのと同じノリで `section4.tsx` を追加し `section5.tsx` を追加してという具合にwebアプリを拡張していくことができます。

## 4 テストの土台を作る

Webアプリができたので、次にPlaywrightによるE2Eテストを作る作業に取り掛かります。まず土台を作ります。

### 4.1 `tests` ディレクトリを追加する

webアプリのコードを `src` ディレクトリに格納してきました。それとは別にテストコードを格納するために `tests` ディレクトリを作ります。

    $ cd $MYAPP
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

`bun test` コマンド実行時に `tests` ディレクトリの中のコードを探索するように指定をします。`bunfig.toml` ファイルを追加する。

    # MYAPP/bunfig.toml
    [test]
    root = "tests"  # scan for tests only in the "tests" directory

### 4.3 Playwrightをプロジェクトに追加する

Playwrightのライブラリをプロジェクトに追加します。次のようにコマンドを投入する。

    $ cd $MYAPP
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

Playwrightライブラリの中にはChromiumブラウザの本体が含まれている。わたしがダウンロードするとき5分ぐらい時間がかかった。これは初回だけ。次回以降は `~/.bun/cache` にダウンロードされたファイルが参照されるのでほとんど時間はかからない。

### 4.4 PlaywrightのAPIを介してブラウザを操作するテストを書く

Chromiumブラウザを起動し、Webサイト `http://example.com` を開いて、HTMLの中身を検証し、それが済んだらブラウザを閉じる、というテストを書きました。

    // tests/play-on-browser.test.ts
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

`test` と `expect` が `bun:test` からimportされていることに注目してほしい。Playwrightによるテストの書き方を教えるwebサイトは山ほどある。たとえば

- ["Playwright &gt; Getting Started &gt; Writing tests" By Microsoft](https://playwright.dev/docs/writing-tests)

そのサンプルコードを見ると `test` と `expect` を `@playwright/test` からimportしている。

    import { test, expect } from '@playwright/test';

これに反してわたしは `bun:test` からimportした `test` と `expect` を使って書きたかった。なぜならブラウザを介したE2Eテストではなくて TypeScriptの関数やclassをユニット・テストするときわたしは `bun:test` の `test` と `expect` を選ぶ。慣れ親しんだ日用品ですから手放したくない。E2Eテストも `bun test` コマンドで実行したい。

### 4.5 bun testコマンドでテストを実行する

ではテストを実行しよう。bunに組み込まれたテストランナーを使います。

    $ cd $MYAPP
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

    $ cd $MYAPP
    $ bun add @logtape/logtape
    $ bun add @logtape/file

ログファイルの出力先として `out` ディレクトリを追加します。

    $ cd $MYAPP
    $ mkdir out

`tests/play-on-browser.test.ts` を下敷きとして別のテストコード `play-on-browser-using-logtape.test.ts` を書きました。

    // tests/play-on-browser-using-logtape.test.ts
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

元の `play-on-browser.test.ts` のなかで `console.log("…​")` と書いていた行を `logger.info(…​)` と書きかえています。

この段階で `bun test ./tests/play-on-browser-using-logtape.test.ts` を実行してもまだLogTapeがログを出力しません。LogTapeを働かせるには設定を加える必要があります。

`$MYAPP/logtape.ts` ファイルを追加します。

    // my-app/logtape.ts
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

さらに `$MYAPP/bunfig.toml` を修正します。

    # $MYAPP/bunfig.toml
    [test]
    root = "tests"  # scan for tests only in the "tests" directory
    preload = [ "./logtape.ts" ]

`bunfig.toml` の `[test]` セクションに `preload = [ "./logtape.ts" ]` と記述しました。これにより、`bun test` コマンドが実行された時、テストコードが実行される前に一度だけコマンド `bun ./logtape.ts` が実行されます。`logtape.ts` がLogTapeを初期設定し sink や logger を準備します。

`play-on-borowser-using-logtape.test.ts` は

    const logger = getLogger(["my-app", "play-on-browser.test"]);

とやって初期設定されたloggerをインスタンス化して利用します。

これでLogTapeの設定ができました。テストを実行しましょう。

    $ cd $MYAPP
    $ bun test ./tests/play-on-browser.test.ts
    $ bun test ./tests/play-on-browser.test.ts
    bun test v1.3.14 (0d9b296a)

    tests/play-on-browser.test.ts:
    ✓ Play on the Playwright Browser API > open browser, navigate to a URL, verify the content, close the browser [21298.08ms]

     1 pass
     0 fail
     3 expect() calls
    Ran 1 test across 1 file. [21.63s]

console.log()によるメッセージが無くなってコンソールの表示がスッキリした。いっぽうで `$MYAPP/out/my-app.log` ファイルが作られ、次のようなログが出力されました。

    2026-07-03 00:20:48.907 +00:00 [INF] my-app·play-on-browser.test: browser.browserType().executablePath()=/Users/kazurayam/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing

テストコードのみならずwebアプリ本体もロギングフレームワークを利用して、詳細なログ情報をファイルに出力することができる。`console.log(…​)` に頼りすぎるとコンソールがごちゃごちゃになって作業しづらくなる。その問題を根本的に回避することができます。

## 5 htmxなwebページをPlaywrightでテストする

さてPlaywrightによるテストを実装しましょう。

`bun run main` コマンドでwebアプリを起動し、ブラウザで `http://localhost:3001` を開きます。リンク "Section3" をクリックすると、htmxのサンプルコードが動作する画面 `http://localhost:3001/section3` が表示されます。この画面の中で「クリック」と表示されたボタンをマウスでclickすると「GETリクエスト!」に切り替わります。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/009_section3_responded.png" alt="009 section3 responded" />
</figure>

ボタンをclickすると、それに反応してボタンのラベルが切り替わるかどうかをテストしよう。そのようなテストをPlaywrightのAPIを利用して書きたい。

### 5.2 E2Eテストを実行する

`http://localhost:3001/section3` にアクセスして、ボタンをクリックしたらボタンのラベルが切り替わるかどうかを検証するテストコード `tests/section3.e2e.ts` を書きました。ただし `tests/section3.e2e.ts` を実行する直前に、あらかじめ `http://localhost:3001` の webアプリを起動しておく必要があります。また、 `bun test` が終了したらwebアプリを停止したい。こうした操作をコマンドラインで繰り返したらタイピングが大変です。 `package.json` の `scripts` に `testmain` サブコマンドを追加しました。

      ...
      "scripts": {
        "main": "bun --hot src/main.tsx",
        "testmain": "bun --hot src/main.tsx & bun test ./tests/*.e2e.ts; kill $(ps aux | grep '[0-9] bun --hot' | awk '{print $2}')",
        ...

`bun run testmain` コマンドは次のことをします。

1.  `bun --hot src/main.tsx` でwebアプリを起動する

2.  それと並行して `bun test` コマンドでテストを実行する。`tests` ディレクトリの中にあってファイル名の末尾が `.e2e.ts` であるテストが選択されて実行される

3.  テストがぜんぶ終了するのを待って、webアプリのプロセスを停止する

実行例を示す。

    $ bun run testmain
    $ bun --hot src/main.tsx & bun test ./tests/*.e2e.ts; kill $(ps aux | grep '[0-9] bun --hot' | awk '{print $2}')
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

ブラウザに `http://localhost:3001/section3` を表示した状態でボタンをクリックしサーバからの応答を画面に反映するまでの一連の動作をテストするコードを書きました。

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

#### 5.2.1 bun の `test` と `expect` を使う

    import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
    import * as PW from '@playwright/test';
    ...
    describe(`test ${url}`, async () => {
        let driver: BrowserDriverChromium;
        let page: PW.Page;
        ...

`bun:test` からimportされてた `describe` と `test` を使っていることに注意してほしい。[Playwright API](https://playwright.dev/docs/writing-tests#using-test-hooks) にも名前のよく似た `describe` と `test` があるのだが全く別のものです。

#### 5.2.2 Playwrightのexpectも使う

`import * as PW from '@playwright/test'` という宣言によりPlaywrightのAPIを `PW` という固有の名前空間で分けて表記し参照可能にしています。`PW.Page` はPlaywrightのPageクラスです。

            const span: PW.Locator = page.getByText('GETリクエスト!');
            await PW.expect(span).toBeVisible();

ここで `PW.expect` という名前で呼び出しているのはPlaywrightの `expect` である。 `from bun:test` によってimportされた `expect` ではありません。名前空間 PW を導入することにより bun:testのexpectとPlaywrightのexpectと、どちらも利用可能になりました。

#### 5.2.3 Playwrightのpageとlocatorとexpect

Playwrightの `page` オブジェクトと `locator` オブジェクトを使ってさまざまのactionを実行したり、DOM要素の状態を調べたりEventを捕捉したりすることができる。たくさん学習しなければならないが、ここでは述べない。詳細な解説をネット上でたくさん見つけることができる。たとえばPlaywrightの公式ドキュメント

- [Writing tests](https://playwright.dev/docs/writing-tests)

を参照のこと。

### 5.3 ヘルパ `BrowserDriverChromium.ts` と `browser-helpers.ts`

`section3.e2e.ts` は `BrowserDriverChromium` クラスをimportしている。

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

`BrowserDriverChromium` オブジェクトはChromiumブラウザを立ち上げたり、URLにnavigateしたり、ブラウザをクローズするといった操作を実装している。テストコードがPlaywrightの `Browser` クラスと `BrowserContext` クラスを意識することなく `Page` オブジェクトだけを意識すればいいように詳細を隠蔽する役を果たしています。今回、わたしがこの記事を書くにあたって一番苦労したのが `BrowserDriverChromium` クラスです。

`BrowserDriverChromium` は `tests/browser-helpers.ts` の関数をcallしている。

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

`browser-helpers` の関数は 各種のパラメータやオブションに具体的な値を指定しつつPlaywright API を直に呼び出す役を果たします。たとえばChromiumブラウザのウインドウをheadless（不可視）にするかどうかの指定や、ウインドウの縦横のサイズを指定することができる。詳細については Playwright APIの [Browser](https://playwright.dev/docs/api/class-browser) クラスと [BrowserType](https://playwright.dev/docs/api/class-browserType) クラスのAPI Referenceドキュメントを参照していただきたい。

## 6. ToDoアプリ

htmx本のCHAPTER07「サンプルアプリの作成」にToDoアプリが紹介されている。著者はPython言語で書いたwebアプリケーションの [Python言語による実装](https://github.com/tomo1227/htmx_book_app/blob/main/src/todo.py) をGitHubで公開している。それと同等のものをわたしはTypeScriptでbunとHonoを基盤として実装し、Playwrightによるテストも実装した。その成果物を以下で紹介する。

なおhtmx本の CHAPTER01 から CHAPTER06 までの内容に対応するコードを `packages/my-app` というサブディレクトリに格納した。それに加えて CHAPTER07 のToDoアプリのコードを `packages/todo-app` という別個のサブディレクトリに格納した。つまりひとつのGitレポジトリの中に複数のパッケージを収めた。いわゆる「monorepo」である。モノレポの作り方も説明する。

### 6.1 ToDoアプリをTypeScriptで実装する

`packages` ディレクトリにcdしたあと `bun init todo-app` とやって `packages/todo-app` ディレクトリを作り、初期設定されたファイル一式を作った。

    $ cd $ROOT/packages
    $ bun init -y todo-app
    $ cd todo-app
    $ tree . -L 2
    .
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

ここで作った `todo-app` ディレクトリのことを $TODO という記号で表すことにする。下記にようにシェル変数を定義した。

    $ cd $ROOT/packages/todo-app
    $ TODO=`pwd`
    $ echo $TODO
    /Users/kazurayam/github/htmx-and-playwright-tests-in-typescript/packages/todo-app

ToDoアプリのために外部ライブラリをインストールした。

    $ cd $TODO
    $ bun add hono
    $ bun add @hono/node-server
    $ bun add @logtape/logtape
    $ bun add @logtape/file

ToDoアプリのテストのために外部ライブラリをインストールした

    $ cd $TODO
    $ bun add -d bun-types
    $ bun add -d @types/bun
    $ bun add -d @playwright/test

`packages/todo-app/src/todo.tsx` を実装した。

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
    const logger = getLogger(["todo-app", "todo"]);

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

    export default {
        port: 3000,
        fetch: app.fetch
    };

`packages/src/top.tsx` を実装した。

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

`packages/src/layout.tsx` を実装した。

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

`packages/src/task.tsx` を実装した。

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

JSXを使うためには `packages/todo-app/tsconfig.json` に `jsxImportSource` プロパティを加える必要がある。たとえばこんなふうに。

    {
      "compilerOptions": {
        "strict": true,
        "jsx": "react-jsx",
        "jsxImportSource": "hono/jsx",
        "types": [
            "bun-types"
        ],
        "composite": true
      },
      "references": [
        { "path": "../my-app" }  // 依存するパッケージを指定
      ]
    }

`packages/todo-app/static` ディレクトリを追加しその下に下記のような静的ファイルを作った。

    $ tree static
    static
    ├── favicon.ico
    ├── htmx
    │   ├── ext
    │   │   └── json-enc.js
    │   └── htmx.min.js
    ├── styles
    │   └── todo.css
    └── sweetalert
        ├── custom-dialog.js
        └── sweetalert2.all.min.js

- `static/styles/todo.css` ファイルは <https://github.com/tomo1227/htmx_book_app/blob/main/static/styles/todo.css> から拝借した。

以下の３つのファイルについては htmx本のCHAPTER07の解説を読んでいただきたい。

- `static/htmx/ext/json-enc.js`

- `sweetalert2.all.min.js`

- `custom-dialog.js`

`$TODO/package.json` のscriptsプロパティに"todo"コマンドを追加した。

    {
      ...
      "scripts": {
        "todo": "bun --hot ./src/todo.tsx"
      },
      ...

コマンドラインで ToDoアプリを起動することができた。

    $ cd $PROJECT/playwright/todo-app
    $ bun run todo

ブラウザで <http://localhost:3000> を開くと ToDo App が応答された。

![011 todo app](https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/011_todo-app.png)

以上でToDoアプリを実装することができた。

### 6.2 モノレポにする

- 参考情報: [bun Docs / Workspaces with Bun](https://bun.com/docs/guides/install/workspaces)

Gitレポジトリのルート・ディレクトリにcdしてtreeコマンドを実行するとこんなふうになっている。

    $ cd $ROOT
    $ tree -L 3 .
    .
    ├── bun.lock
    ├── node_modules
    │   └── @types
    │       └── bun -> ../.bun/@types+bun@1.3.14/node_modules/@types/bun
    ├── package.json
    ├── packages
    │   ├── my-app
    │   │   ├── bun.lock
    │   │   ├── bunfig.toml
    │   │   ├── CLAUDE.md
    │   │   ├── index.ts
    │   │   ├── logtape.ts
    │   │   ├── node_modules
    │   │   ├── out
    │   │   ├── package.json
    │   │   ├── README.md
    │   │   ├── src
    │   │   ├── static
    │   │   ├── tests
    │   │   └── tsconfig.json
    │   └── todo-app
    │       ├── bun.lock
    │       ├── CLAUDE.md
    │       ├── index.ts
    │       ├── node_modules
    │       ├── out
    │       ├── package.json
    │       ├── README.md
    │       ├── src
    │       ├── static
    │       ├── tests
    │       └── tsconfig.json
    └── README.md

`packages` ディレクトリの下に `my-app` パッケージと `todo-app` パッケージがある。それぞれのWebアプリはどちらもHonoを基盤としてJSXとhtmxを利用したアプリであって独立している。`todo-app` のWebアプリのコードが `my-app` のWebアプリのコードに依存してはいない。ただし詳しくは後で述べるが `todo-app` のテストコードが `my-app` の `tests` の中にある `BrowserDriverChromium` class を参照するようにしたい。だから `todo-app` が `my-app` を参照できるようにbunの設定を作る必要がある。

#### 6.2.1 workspacesの定義

Gitレポジトリのルート・ディレクトリの直下にある `package.json` を次のように書きます。

    {
        "name": "@kazurayam/htmx-and-playwright-tests-in-typescript",
        "module": "index.ts",
        "type": "module",
        "private": true,
        "workspaces": [
            "packages/*"
        ],
        "devDependencies": {
            "@types/bun": "latest"
        },
        "peerDependences": {
            "typescript": "^5"
        }
    }

ここで `workspaces` プロパティが重要です。

    {
        ...
        "workspaces": [
            "packages/*"
        ],
        ...

`workspaces` プロパティがこのように記述されているので `packages` ディレクトリの下にある `my-app` ディレクトリと `todo-app` ディレクトリがどちらも [workspace](https://bun.com/docs/pm/workspaces) として認められることになります。

#### 6.2.2 パッケージの nameプロパティ を整える

- 参考情報: [npm Docs / package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json#name)

このプロジェクトには３つの `package.json` ファイルがありますが、その冒頭にある `name` プロパティの値をどうするかが大事です。

npm Docの name に関する説明はこう述べています。

> If you plan to publish your package, the most important things in your package.json are the name and version fields as they will be required. The name and version together form an identifier that is assumed to be completely unique. Changes to the package should come along with changes to the version. If you don’t plan to publish your package, the name and version fields are optional.

わたしはGitレポジトリ [htmx-and-playwright-tests-in-typescript](https://github.com/kazurayam/htmx-and-playwright-tests-in-typescript) の成果物をnpmにパブリッシュするつもりはない。だからnmpレポジトリ全体の中でuniqueな名前を与えなければならぬわけではない。しかしわたしは `todo-app` が `my-app` に依存する関係を記述したい。そのためには `todo-app` と `my-app` のパッケージ名を整った名前にしておくことが必須になる。だから二つのパッケージのnameをいっそのことnmp全体でもユニークな値にしておくのが得策だ。

`$PROJECT/package.json` の name をこう書きました。

    {
        "name": "@kazurayam/htmx-and-playwright-tests-in-typescript",
        ...

`packages/my-app/packages.json` の name をこう書きました。

    {
        "name": "@kazurayam/htmx-and-playwright-tests-in-typescript-my-app",
        ...

`packages/todo-app/packages.json` の name をこう書きました。

    {
        "name": "@kazurayam/htmx-and-playwright-tests-in-typescript-todo-app",
        ...

つまりルートのpackageのnameの形式を "@kazurayam/repositoryName" とし、モノレポを構成するパッケージのnameを "@kazurayam/repositoryName-パッケージ名" という形式にしました。 `kazurayam` とはわたし個人のGitHubアカウントのNameです。これはおそらくGlobalにユニークなので、npmにおいてscopeとして使えるはずです。packageのnameをこの形にするのはわたし個人のやり方です。参考まで。

$ROOTの直下の `package.json` で `"workspaces":["packages/*"]` を宣言し、`my-app` と `todo-app` の `package.json` のnameを適切に指定したら、$ROOTにcdして下記のコマンドを実行します。

    $ cd $ROOT
    $ bun install

- 参考情報: [bun install](https://bun.com/docs/pm/cli/install)

するとbunのパッケージマネージャーが `package.json` ファイルを読み込み解釈して `node_modules` ディレクトリの中身を適宜書きかえます。

ちなみにわたしが `bun install` コマンドを実行した後でVSCodeの画面で `node_modules` ディレクトリの中身を目視しようとしたが、変化が見られなくて「あれ？」と驚くことがあった。VSCodeをいったんクローズして再起動したら `node_modules` の中身が変わっているのが見えた。つまりVSCodeに画面をリフレッシュするチャンスを与えなければならない。VSCodeを上手に設定すれば回避できそうだが、それは別の話題。

### 6.3 ToDoアプリのためにPlaywrightのテストを書いた

`$TODO/tests/todo.e2e.ts` を実装した。

    // tests/todo.e2e.ts
    import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
    import * as PW from '@playwright/test';
    import { BrowserDriverChromium } from '@kazurayam/htmx-and-playwright-tests-in-typescript-my-app';

    const url = 'http://localhost:3000/';

    describe(`test ${url}`, async () => {
        // Here I assume that the server at http://localhost:3000 is already up and running.
        let driver: BrowserDriverChromium;
        let page: PW.Page;
        beforeAll(async () => {
            driver = await BrowserDriverChromium.create('todo', { headless: false });
        });
        beforeEach(async () => {
            page = await driver.navigateToUrl(url);
        }, 20_000);

        test("type '筋トレする' into the 'input' element, click the '追加' button, assert the task is listed", async () => {
            await delay(1000)
            // select the input field
            const input: PW.Locator = page.locator("css=input[name='task']");
            await input.waitFor({ state: 'visible', timeout: 5000 })
            await PW.expect(input).toBeEnabled();
            // type '筋トレする' into the input filed
            input.fill('筋トレする')
            await delay(1000)
            // Select the button
            const button: PW.Locator = page.locator("css=button[type='submit']");
            // make sure the button is clickable
            await button.waitFor({ state: 'visible', timeout: 5000 });
            await PW.expect(button).toBeEnabled();
            // Click the button!
            await button.click();
            await delay(1000)
            //
            const p: PW.Locator = page.getByText('筋トレする').first();
            await PW.expect(p).toBeVisible();
        }, 20_000);

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

この4行目にこう書いてあるのに注意願いたい。

    import { BrowserDriverChromium } from '@kazurayam/htmx-and-playwright-tests-in-typescript-my-app';

つまり `todo.e2e.ts` はパッケージ `@kazurayam/htmx-and-playwright-tests-in-typescript-my-app` が持っていてexportしているはずの `BrowserDriverChromium` をimportして使いたい、と書いてある。

### 6.4 todo-appがmy-appのBrowserDriverChromiumを参照できない!

ところがわたしが `todo.e2e.ts` を書いた時、VSCodeのエディタは下記のように下波線を表示して警告した。

![012 ts2307](https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/012_ts2307.png)

> Cannot find module '@kazurayam/htmx-and-playwright-tests-in-typescript-my-app' or its corresponding type declarations. ts(2307)

このエラーを回避するために `$TODO/packages.json` を訂正した。

    {
      "name": "@kazurayam/htmx-and-playwright-tests-in-typescript-todo-app",
      ...
      "devDependencies": {
        "@playwright/test": "^1.61.1",
        "@types/bun": "^1.3.14",
        "bun-types": "^1.3.14",
        "@kazurayam/htmx-and-playwright-tests-in-typescript-my-app": "workspace:*"
      },
      ...

すなわち `devDependencies` プロパティに `"@kazurayam/htmx-and-playwright-tests-in-typescript-my-app": "workspace:*"` を追記した。この変更をbunに伝える必要があるのでルートディレクトリに戻って再度

    $ cd $ROOT
    $ bun install

を実行した。もう一度VSCodeのエディタに戻ってみた。あれ？まだ下波線が表示されていた。ただし別の警告メッセージだった。

![013 ts2306](https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/013_ts2306.png)

> File '/Users/kazurayam/github/htmx-and-playwright-tests-in-typescript/packages/my-app/index.ts' is not a module. ts(2306)

どういう意味だろうか？AIに尋ねてみた。曰く

> The error TS2306: File 'x' is not a module occurs when you try to import a file that TypeScript does not recognize as a module, usually because the file lacks an export statement. To fix this, ensure that the file you are importing from includes at least one export, making it a valid module.

`$MYAPP/package.json` ファイルの冒頭にこう書いてある.

    {
      "name": "@kazurayam/htmx-and-playwright-tests-in-typescript-my-app",
      "module": "index.ts",
      ...

これによると `module` プロパティが `packages/my-app/index.ts` ファイルを指していることがわかる。`module` プロパティとは何か？もう一度AIに聞いてみた。

> The **module property** in package.json is used to specify the entry point for ECMAScript modules (ESM) in a Bun project, allowing the use of the import/export syntax. This property helps Bun recognize which files to load as ESM, enhancing compatibility with modern JavaScript module systems.

なるほど。`module` プロパティの値が `$MYAPP/index.ts` を指しているので、`index.ts` が `BrowserDriverChromium` をexportしていることを期待していたが、そうなっていない。だからTS2306エラーが発生した、ということのようだ。どうすればいいのか？

JavaScriptのimportとexportには歴史的経緯があって一筋縄でいかない。学び直しが必要と思ったので下記の解説記事を読んだ。

- 参考情報: [Zenn package.jsonの全フィールド解説：main・exports・type・enginesの正しい使い方 / exportsフィールド詳解](https://zenn.dev/yuichi_ai/articles/package-json-fields-complete-guide#exports%E3%83%95%E3%82%A3%E3%83%BC%E3%83%AB%E3%83%89%E8%A9%B3%E8%A7%A3)

いろいろ試したあげく、２箇所手を加えた。第一に `$MYAPP/src/main.tsx` の末尾に1行挿入した。

    // src/main.tsx
    ...
    export default {
        port: 3001,
        fetch: app.fetch
    };

    export { BrowserDriverChromium } from '../tests/BrowserDriverChromium.ts';

第二に `$MYAPP/package.json` の `module` プロパティを削除し `exports` プロパティを挿入した。

    {
      "name": "@kazurayam/htmx-and-playwright-tests-in-typescript-my-app",
      "type": "module",
      "exports": {
        "default": "./src/main.tsx"
      },

修正を反映させるため、ルートディレクトリに戻って 次のコマンドを実行した。

    $ cd $ROOT
    $ bun install

VSCodeのエディタで `todo.e2e.ts` を確認した。するとようやく下波線が消えた。これでいけるはず。

### 6.5 todo-appでテストを実行

`packages/todo-app/packages.json` を修正してテストを実行するコマンドを追加した。

    {
      "scripts": {
        "todo": "bun --hot ./src/todo.tsx"
        "testtodo": "bun --hot src/todo.tsx & bun test ./tests/*.e2e.ts; kill $(ps aux | grep '[0-9] bun --hot' | awk '{print $2}')"
        ...

コマンドラインで `todo-app` のテストを実行した。

    $ cd $TODO
    $ bun run testtodo
    $ bun --hot src/todo.tsx & bun test ./tests/*.e2e.ts; kill $(ps aux | grep '[0-9] bun --hot' | awk '{print $2}')
    bun test v1.3.14 (0d9b296a)

    tests/todo.e2e.ts:
    Started development server: http://localhost:3000
    ✓ test http://localhost:3000/ > type '筋トレする' into the 'input' element, click the '追加' button, assert the task is listed [3735.54ms]

     1 pass
     0 fail
    Ran 1 test across 1 file. [5.16s]

うまく行った。`todo.e2e.ts` がPlaywrightを介してChromiumブラウザを立ち上げて <http://localhost:3000> を開いた。ToDo Appのフォーム画面が開いた。入力フィールドに "筋トレする" というテキストが入力された。追加するボタンが押下されて、タスクが登録された。そしてブラウザが閉じてテストが終了した。これでよし。

## 7. まとめ

htmx構文を使ったwebアプリケーションをbunとHonoの上で構築しPlaywrightのライブラリを使ってE2Eテストすることができた。E2Eテストを実行するのにbunに組み込まれたテストランナーを使った。Playwrightに関するドキュメントの多くは `npx playwright XXXX` というコマンドを使えと書いているが、あえてその方法をとらなかった。なぜなら `npx` コマンドはNode.jsの部品であり、bunでは使えないからだ。そこでPlaywrightのAPIを介してブラウザを起動・終了するためのライブラリ（`BrowserDriverChromium` クラスなど）を独自実装した。これによって `npx playwright` ではなく `bun test` でE2Eテストを実行できた。
