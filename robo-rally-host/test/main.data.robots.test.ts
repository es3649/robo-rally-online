import { expect, test } from '@jest/globals'
import { BOTS } from '../src/main/data/robots'
import { MAX_PLAYERS } from '../src/main/game_manager/initializers'

test('bots', () => {
    // we just need enough bots, lol
    expect(BOTS).toBeDefined()
    expect(BOTS.length).toBeGreaterThanOrEqual(MAX_PLAYERS)
})