import { expect, test } from '@jest/globals'
import { PlayerState } from '../src/main/models/player'

test('PlayerState.constructor', () => {
    const name = 'Dennis'
    const priority = 4
    const ps = new PlayerState(name, priority)

    expect(ps.energy).toBe(3)
    expect(ps.checkpoints).toBe(0)
    expect(ps.priority).toBe(priority)
    expect(ps.name).toBe(name)
    expect(ps.active).toBeTruthy()
})

test('PlayerState.gainEnergy/spendEnergy', () => {
    const ps = new PlayerState('Bob', 0)

    // check default
    expect(ps.energy).toBe(3)

    ps.gainEnergy(1)
    expect(ps.energy).toBe(4)
    
    ps.spendEnergy(3)
    expect(ps.energy).toBe(1)
    
    ps.spendEnergy(1)
    expect(ps.energy).toBe(0)
    
    ps.gainEnergy(1)
    expect(ps.energy).toBe(1)
    
    // can't spend more than we have
    ps.spendEnergy(3)
    expect(ps.energy).toBe(0)

    ps.gainEnergy(PlayerState.MAX_ENERGY)
    expect(ps.energy).toBe(PlayerState.MAX_ENERGY)

    ps.gainEnergy(1)
    expect(ps.energy).toBe(PlayerState.MAX_ENERGY)
})
