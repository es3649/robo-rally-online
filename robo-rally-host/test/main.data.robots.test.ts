import { expect, test } from '@jest/globals'
import { bots } from '../src/main/data/robots'
import { MAX_PLAYERS } from '../src/main/game_manager/manager'

test('bots', () => {
    // we just need enough bots, lol
    expect(bots).toBeDefined()
    expect(bots.length).toBeGreaterThanOrEqual(MAX_PLAYERS)
})