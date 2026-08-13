// chat-app/src/shared/utils.ts

export function getServerName(tsFilePath: string, delimiter: string = 'src/') {
    return tsFilePath.substring(tsFilePath.indexOf(delimiter) + delimiter.length)
}
