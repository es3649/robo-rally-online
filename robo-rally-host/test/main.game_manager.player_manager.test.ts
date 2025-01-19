import { expect, jest, test } from '@jest/globals'
import { PlayerManager } from '../src/main/game_manager/player_manager'
import { senderMaker } from '../src/main/models/connection'
import { Player, PlayerID } from '../src/main/models/player'
import { MovementStatus, OrientedPosition, Turn } from '../src/main/game_manager/move_processors'
import { Robots } from '../src/main/data/robots'
import { Orientation, Rotation, RotationDirection } from '../src/main/models/movement'

function send(message: any,
    sendHandle?: any,
    options?: { keepOpen?: boolean|undefined } | undefined,
    callback?: ((error: Error|null) => void) | undefined
): boolean {
    return true
}

function getPlayerList(): Map<PlayerID, Player> {
    const ret = new Map<PlayerID, Player>()

    ret.set('hems1234', {name: 'Chris', id: 'hems1234', character: Robots.Thor})
    ret.set('miles1234', {name: 'Ken', id: 'miles1234', character: Robots.AxelV8})
    ret.set('ford1234', {name: 'Adolph', id: 'ford1234', character: Robots.PanzerX90})
    ret.set('wotc1234', {name: 'Richard', id: 'wotc1234', character: Robots.Twonky})

    return ret
}

function getStartingPositions(): Map<PlayerID, OrientedPosition> {
    const ret = new Map<PlayerID, OrientedPosition>()

    ret.set('hems1234', {x:0, y:0, orientation: Orientation.N})
    ret.set('miles1234', {x:1, y:0, orientation: Orientation.N})
    ret.set('ford1234', {x:2, y:0, orientation: Orientation.N})
    ret.set('wotc1234', {x:3, y:0, orientation: Orientation.N})

    return ret
}

test('PlayerManager.getPosition', () => {
    // mock a sender
    const has_send = {
        send: jest.fn(send)
    }
    const sender = senderMaker(has_send)
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions, sender)

    for (const [actor, pos] of positions) {
        const pm_pos = pm.getPosition(actor)

        expect(pm_pos).toBeDefined()
        expect(pm_pos.x).toBe(pos.x)
        expect(pm_pos.y).toBe(pos.y)
        expect(pm_pos.orientation).toBe(pos.orientation)
    }
    
    // for unknown IDs, we should get undefined
    expect(pm.getPosition('shelby40')).toBeUndefined()
})

test('PlayerManager.getPositions',  () => {
    // mock a sender
    const has_send = {
        send: jest.fn(send)
    }
    const sender = senderMaker(has_send)
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions, sender)

    const pm_positions = pm.getPositions()
    expect(pm_positions.size).toBe(positions.size)

    for (const [actor, pos] of positions) {
        const pm_pos = pm_positions.get(actor)

        expect(pm_pos).toBeDefined()
        expect(pm_pos.x).toBe(pos.x)
        expect(pm_pos.y).toBe(pos.y)
        expect(pm_pos.orientation).toBe(pos.orientation)
    }
})

test('PlayerManager.setPlayerPosition', () => {
    // mock a sender
    const has_send = {
        send: jest.fn(send)
    }
    const sender = senderMaker(has_send)
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions, sender)

    // change a position
    pm.setPlayerPosition('hems1234', {x: 8, y:2, orientation: Orientation.W})
    const new_pos = pm.getPosition('hems1234')
    expect(new_pos).toBeDefined()

    expect(new_pos.x).toBe(8)
    expect(new_pos.y).toBe(2)
    expect(new_pos.orientation).toBe(Orientation.W)

    for (const [actor, pos] of positions) {
        // all actors other than hems1234 should be unaffected
        if (actor == "hems1234") {
            continue
        }

        const pm_pos = pm.getPosition(actor)

        expect(pm_pos).toBeDefined()
        expect(pm_pos.x).toBe(pos.x)
        expect(pm_pos.y).toBe(pos.y)
        expect(pm_pos.orientation).toBe(pos.orientation)
    }

    // an unknown key should not affect the position map
    pm.setPlayerPosition('shelby40', {x:3, y: 7, orientation: Orientation.S})
    const all_positions = pm.getPositions()
    expect(all_positions.has('shelby40')).toBeFalsy()
})

test('PlayerManager.updatePositions',  () => {
    // mock a sender
    const has_send = {
        send: jest.fn(send)
    }
    const sender = senderMaker(has_send)
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions, sender)

    pm.updatePositions('miles1234', {
        movement: {direction: Orientation.N, distance: 1},
        status: MovementStatus.OK
    }, 0)

    const pos1 = pm.getPosition('miles1234')
    expect(pos1).toBeDefined()
    expect(pos1.x).toBe(1)
    expect(pos1.y).toBe(1)
    expect(pos1.orientation).toBe(Orientation.N)

    pm.updatePositions('miles1234', {
        movement: new Turn(RotationDirection.CCW),
        status: MovementStatus.OK
    }, 1)

    const pos2 = pm.getPosition('miles1234')
    expect(pos2).toBeDefined()
    expect(pos2.x).toBe(1)
    expect(pos2.y).toBe(1)
    expect(pos2.orientation).toBe(Orientation.W)

    pm.updatePositions('miles1234', {
        movement: undefined,
        status: MovementStatus.OK
    }, 1)

    const pos3 = pm.getPosition('miles1234')
    expect(pos3).toBeDefined()
    expect(pos3.x).toBe(1)
    expect(pos3.y).toBe(1)
    expect(pos3.orientation).toBe(Orientation.W)

    const pos_map = pm.updatePositions('miles1234', {
        movement: undefined,
        status: MovementStatus.PIT
    }, 2)

    expect(pos_map.has('miles1234')).toBeFalsy()
})

test('PlayerManager.updatePriority/getPlayerByPriority',  () => {
    // mock a sender
    const has_send = {
        send: jest.fn(send)
    }
    const sender = senderMaker(has_send)
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions, sender)

    const first = pm.getPlayerByPriority(0)
    const second = pm.getPlayerByPriority(1)
    const third = pm.getPlayerByPriority(2)
    const fourth = pm.getPlayerByPriority(3)

    expect(first).toBeDefined()
    expect(second).toBeDefined()
    expect(third).toBeDefined()
    expect(fourth).toBeDefined()

    expect(() => {pm.getPlayerByPriority(4)}).toThrow()
    expect(() => {pm.getPlayerByPriority(-1)}).toThrow()

    pm.updatePriority()
    
    expect(pm.getPlayerByPriority(0)).toBe(second)
    expect(pm.getPlayerByPriority(1)).toBe(third)
    expect(pm.getPlayerByPriority(2)).toBe(fourth)
    expect(pm.getPlayerByPriority(3)).toBe(first)
    
    pm.priorityLock()
    pm.updatePriority()
    
    expect(pm.getPlayerByPriority(0)).toBe(second)
    expect(pm.getPlayerByPriority(1)).toBe(third)
    expect(pm.getPlayerByPriority(2)).toBe(fourth)
    expect(pm.getPlayerByPriority(3)).toBe(first)
    
    pm.updatePriority()
    
    expect(pm.getPlayerByPriority(0)).toBe(third)
    expect(pm.getPlayerByPriority(1)).toBe(fourth)
    expect(pm.getPlayerByPriority(2)).toBe(first)
    expect(pm.getPlayerByPriority(3)).toBe(second)
})

test('PlayerManager.setShutdown',  () => {
    // mock a sender
    const has_send = {
        send: jest.fn(send)
    }
    const sender = senderMaker(has_send)
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions, sender)

    pm.setShutdown('ford1234')
    // this shouldn't remove the player's position
    expect(pm.getPosition('ford1234')).toBeDefined()

    // there's not really any other way to check that it was shutdown, since the shutdowns
    // are a private member
})

test('PlayerManager.setProgram',  () => {
    throw new Error('Not Implemented')
})

test('PlayerManager.resetProgram',  () => {
    throw new Error('Not Implemented')
})

test('PlayerManager.resolveRegister',  () => {
    throw new Error('Not Implemented')
})

test('PlayerManager.dealDamages',  () => {
    throw new Error('Not Implemented')
})

// test('PlayerManager.addEnergy',  () => {
//     throw new Error('Not Implemented')
// })

test('PlayerManager.getCheckpoints/takeCheckpoint', () => {
    // mock a sender
    const has_send = {
        send: jest.fn(send)
    }
    const sender = senderMaker(has_send)
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions, sender)

    const checkpoints_1 = pm.getCheckpoints()
    expect(checkpoints_1.size).toBe(4)

    for (const checkpoint of checkpoints_1.values()) {
        // all checkpoints should be init'd to 0
        expect(checkpoint).toBe(0)
    }

    expect(pm.takeCheckpoint('wotc1234', 2)).toBeFalsy()
    expect(pm.takeCheckpoint('wotc1234', 1)).toBeTruthy()
    expect(pm.takeCheckpoint('wotc1234', 2)).toBeTruthy()

    const checkpoints_2 = pm.getCheckpoints()
    expect(checkpoints_2.size).toBe(4)
    expect(checkpoints_2.has('wotc1234')).toBeTruthy()
    expect(checkpoints_2.get('wotc1234')).toBe(2)
    
    // nothing else should be updated
    expect(checkpoints_2.has('hems1234')).toBeTruthy()
    expect(checkpoints_2.get('hems1234')).toBe(0)
    expect(checkpoints_2.has('miles1234')).toBeTruthy()
    expect(checkpoints_2.get('miles1234')).toBe(0)
    expect(checkpoints_2.has('ford1234')).toBeTruthy()
    expect(checkpoints_2.get('ford1234')).toBe(0)

    // checkpoint updated for unknown players should not be allowed
    expect(pm.takeCheckpoint('shelby40', 1)).toBeFalsy()
    expect(pm.takeCheckpoint('shelby40', 0)).toBeFalsy()
    const checkpoints_3 = pm.getCheckpoints()
    expect(checkpoints_3.size).toBe(4)
})

test('PlayerManger.getBotPushes',  () => {
    throw new Error('Not Implemented')
})

