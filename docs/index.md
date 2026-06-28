- Table of contents
{:toc}

# Htmx and Playwright Tests in TypeScript

- project version: unknown

書籍 [「JavaScriptレスの動的UI開発 htmx入門」太田智暉 著、C＆R研究所](https://www.c-r.com/book/detail/1595) （以下で "htmx本" と略する）のサンプルコードと [Qiita記事](https://qiita.com/twrcd1227/items/7bce18167fb02ec22729) をよりどころとして [htmx](https://htmx.org/) を活用してWebアプリケーションを開発する手法を学ぼうと思う。htmxそのものについてはhtmx本に譲る。webアプリケーションの動作環境をTypeScriptで構築すること、およびPlaywrightでテストを実装することについて、わたしなりの工夫をした。どんな工夫をしたか以下に記述する。自分のための忘備録として。

## 狙い

- わたしはhtmxを理解するためにhtmx本のサンプルコードを写経して動かしたい。

- htmxを採用したHTMLをブラウザ上で開いて動きを確認するためにはバックエンドとしてのwebアプリケーションが必要だ。htmx本の著者はPythonで書いたwebアプリケーションの [ソースコード一式](https://github.com/tomo1227/htmx_book_app) をGitHubで公開している。それはさておき、わたしはwebアプリをTypeScriptで書きたい。

- webアプリを [bun](https://bun.com/docs) と [Hono](https://hono.dev/) の上で構築したい。Node.jsとExpressではなくて。

- htmx本はテストをどう書くかについて言及していない。しかしわたしはhtmx本のサンプルコードを写したらテストを書いて、逐一動作を確認するというtest-firstな手順でやりたい。わたしは [Playwright](https://playwright.dev/docs/intro) でテストを書こう。

## わたしが取り組むべき課題

Playwrightの公式ドキュメント [Getting started/Installation](https://playwright.dev/docs/intro) を見れば明らかだが、Playwrightのドキュメントは [Node.js](https://nodejs.org/) 上で実行することを前提している。bunの上でPlaywrightを動かす例がネット上にほとんど見当たらない。だからわたしは自力で答えを見つけなければならない。

## わたしの環境

- Apple MacBook Air, M1

- macOS 26.5.1

- bash 3.2.57(1)-release (x86\_64-apple-darwin25)

- node v24.9.0, npm 11.7.0, npx 11.7.0 がインストール済み

- Visual Studio Code 1.125.1

## bunをインストールする

参考情報: <https://bun.com/docs/installation>

    $ curl -fsSL https://bun.com/install | bash

## レポジトリのルートとなるディレクトリを作る

    $ mkdir htmx-and-playwright-tests-in-typescript

このディレクトリをGitレポジトリのルート・ディレクトリとする。将来的にこのレポジトリをいわゆる「モノレポ」にしたい。そのためにサブディレクトリ `packages` を作り、その下にwebアプリケーションを格納することにする。

    $ cd htmx-and-playwright-tests-in-typescript
    $ mkdir packages

## webアプリケーション `my-app` の雛形を作る

参考情報: <https://bun.com/docs/quickstart>

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

これらのファイル群がwebアプリケーションの雛形となる。以下の記述を簡便にするために `my-app` ディレクトリを `PROJECT` という記号で表すことにする。シェル変数 `PROJECT` を下記のようにして作ると考えても良い。

    $ cd my-app
    $ PROJECT=`pwd`
    $ echo $PROJECT
    /Users/kazurayam/github/htmx-and-playwright-tests-in-typescript/packages/my-app

さて、webアプリケーションの開発に進もう。自動生成された `$PROJECT/index.ts` ファイルの中身は下記の通りです。

    console.log("Hello via Bun!");

これをコマンドラインで実行することができます。

    $ cd $PROJECT
    $ bun run index.ts
    Hello via Bun!

予想通りの結果になりました。

次に `$PROJECT/index.ts` を下記のように書きかえよう。ポート番号 3000 をlistenするHTTPサーバを実装している。

    const server = Bun.serve({
        port: 3000,
        routes: {
            "/": () => new Response('Bun!'),
        }
    });

    console.log(`Listening on ${server.url}`);

コマンドラインで `bun run` コマンドを投入するしてwebサーバーを起動しよう。

    $ cd $PROJECT
    $ bun run index.ts
    Listening on http://localhost:3000/

Chromeブラウザを立ち上げて <http://localhost:3000/> を開いてみましょう。

<figure>
<img src="https://kazurayam.github.io/htmx-and-playwright-tests-in-typescript/images/001_index.ts.png" alt="001 index.ts" />
</figure>

ちゃんとしたHTTP応答が表示されました。#1F600

コマンドラインで CTRL+C を実行してwebサーバーを停止することができます。
