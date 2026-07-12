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
