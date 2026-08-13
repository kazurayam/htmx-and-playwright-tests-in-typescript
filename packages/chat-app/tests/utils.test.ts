import { describe, test, expect } from 'bun:test'
import { getServerName } from '../src/shared/utils'

describe("utils", () => {
    test("getServerName", () => {
        const shortName = getServerName(import.meta.url, 'tests/')
        expect(shortName).toEqual('shared/utils.test.ts')
    })
})

