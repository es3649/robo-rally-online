import { expect, jest, test } from '@jest/globals'
import { PlayerManager } from '../src/main/game_manager/player_manager'
import { Player, PlayerID, PlayerState } from '../src/main/models/player'
import { MovementFrame, MovementResult, MovementStatus, OrientedPosition, Turn } from '../src/main/game_manager/move_processors'
import { Robots } from '../src/main/data/robots'
import { AbsoluteMovement, isAbsoluteMovement, isRotation, Movement, MovementDirection, Orientation, RelativeMovement, Rotation, RotationDirection } from '../src/main/models/movement'
import { ProgrammingCard, RegisterArray } from '../src/main/models/game_data'
import { Evaluator } from 'src/main/game_manager/board'

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

function dummy_evaluator(position: OrientedPosition, move: MovementFrame): MovementResult {
    return {
        movement: move,
        status: MovementStatus.OK,
        pushed: false
    }
}

function curry_evaluator(illegal: OrientedPosition[], status: MovementStatus = MovementStatus.WALL): Evaluator {
    function evaluator(position: OrientedPosition, move: MovementFrame): MovementResult {
        for (const configuration of illegal) {
            if (!isAbsoluteMovement(move)) {
                continue
            }
            if (position.x == configuration.x &&
                position.y == configuration.y &&
                move.direction == configuration.orientation
            ) {
                if (status == MovementStatus.WALL) {

                    return {
                        movement: undefined,
                        status: status
                    }
                } else {
                    return {
                        movement: move,
                        status: status
                    }
                }
            }
        }

        return {
            movement: move,
            status: MovementStatus.OK
        }
    }

    return evaluator
}


test('PlayerManager.constructor', () => {
    // make sure all player positions are set correctly, and player states are initialized
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions)

    const initial_states = pm.getPlayerStates()

    expect(initial_states.size).toBe(4)
    expect(initial_states.has('hems1234')).toBeTruthy()
    expect(initial_states.has('miles1234')).toBeTruthy()
    expect(initial_states.has('ford1234')).toBeTruthy()
    expect(initial_states.has('wotc1234')).toBeTruthy()

    for (const [actor, state] of initial_states.entries()) {
        expect(state.active).toBeTruthy()
        expect(state.checkpoints).toBe(0)
        expect(state.energy).toBe(PlayerState.STARTING_ENERGY)
        expect(state.priority).toBeLessThanOrEqual(3)
        expect(state.priority).toBeGreaterThanOrEqual(0)

        // the names ought to match, but this is a smol bit
        const name = players.get(actor).name
        expect(state.name).toEqual(name)
    }
})

test('PlayerManager.getPosition', () => {
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions)

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
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions)

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
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions)

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
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions)

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
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions)

    const first = pm.getPlayerByPriority(0)
    const second = pm.getPlayerByPriority(1)
    const third = pm.getPlayerByPriority(2)
    const fourth = pm.getPlayerByPriority(3)

    console.log(first, second, third, fourth)

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
    
    pm.lockPriority()
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
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions)

    pm.setShutdown('ford1234')
    // this shouldn't remove the player's position
    expect(pm.getPosition('ford1234')).toBeDefined()

    const states = pm.getPlayerStates()
    expect(states.has('ford1234'))
    expect((states.get('ford1234') as PlayerState).active).toBeFalsy()
})

test('PlayerManager.setProgram',  () => {
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions)

    const program_1: RegisterArray = [[{id: 1, action: ProgrammingCard.forward3}],
        [{id: 2, action: ProgrammingCard.again}],
        [{id: 3, action: ProgrammingCard.power_up}],
        [{id: 4, action: ProgrammingCard.spam}],
        [{id: 5, action: ProgrammingCard.u_turn}]]
    const program_2: RegisterArray = [[{id: 1, action: ProgrammingCard.forward1}],
        [{id: 2, action: ProgrammingCard.forward1}],
        [{id: 3, action: ProgrammingCard.forward1}],
        [{id: 4, action: ProgrammingCard.left}],
        [{id: 5, action: ProgrammingCard.forward2}]]
    const program_3: RegisterArray = [[{id: 1, action: ProgrammingCard.back}],
        [{id: 2, action: ProgrammingCard.u_turn}],
        [{id: 3, action: ProgrammingCard.forward2}],
        [{id: 4, action: ProgrammingCard.right}],
        [{id: 5, action: ProgrammingCard.left}, {id: 6, action: ProgrammingCard.forward1}]]
    const program_4: RegisterArray = [[{id: 41, action: ProgrammingCard.spam}],
        [{id: 57, action: {text: "Move one, Turn Left, Move One", actions: [ProgrammingCard.Movements.Forward1, ProgrammingCard.Movements.Left, ProgrammingCard.Movements.Forward1]}}],
        [{id: 2, action: ProgrammingCard.forward1}],
        [{id: 3, action: ProgrammingCard.left}],
        [{id: 52, action: {text: "Pay 0-8 energy, then move 2 spaces for each energy paid", actions: {
            prompt: "Energy to pay",
            options: ['0', '1', '2', '3', '4', '5', '6', '7', '8'],
            choice(option:string): Movement[] {
                return [{direction: MovementDirection.Forward, distance: 2*Number(option)} as Movement]
            }
        }}}]]

    expect(pm.setProgram('wotc1234', program_1)).toBeFalsy()
    expect(pm.setProgram('hems1234', program_2)).toBeFalsy()
    expect(pm.setProgram('miles1234', program_3)).toBeFalsy()
    expect(pm.setProgram('ford1234', program_4)).toBeTruthy()
})

test('PlayerManager.resetProgram',  () => {
    // be sure that a map of register arrays is returned
    // be sure that any shutdown players are no longer shutdown

    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions)

    pm.setShutdown('hems1234')

    const registers = pm.resetPrograms()
    expect(registers.has('wotc1234'))
    expect(registers.has('hems1234'))
    expect(registers.has('ford1234'))
    expect(registers.has('miles1234'))

    const states = pm.getPlayerStates()
    expect(states.get('hems1234').active).toBeTruthy()
})

test('PlayerManager.resolveRegister',  () => {
    // test that resolver register is able to get the correct actions
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions)

    const program_1: RegisterArray = [[{id: 1, action: ProgrammingCard.forward3}],
        [{id: 2, action: ProgrammingCard.again}],
        [{id: 3, action: ProgrammingCard.power_up}],
        [{id: 4, action: ProgrammingCard.spam}],
        [{id: 5, action: ProgrammingCard.u_turn}]]

    const program_2: RegisterArray = [[{id: 1, action: ProgrammingCard.back}],
        [{id: 2, action: ProgrammingCard.right}],
        [{id: 3, action: ProgrammingCard.forward1}],
        [{id: 4, action: ProgrammingCard.left}],
        [{id: 5, action: ProgrammingCard.forward2}]]
    
    const program_3: RegisterArray = [
        [{id: 3, action: ProgrammingCard.left}, {id: 2, action: ProgrammingCard.forward1}],
        [{id: 2, action: ProgrammingCard.forward1}, {id: 3, action: ProgrammingCard.left}],
        [{id: 4, action: ProgrammingCard.right}, {id: 2, action: ProgrammingCard.forward1}],
        [{id: 2, action: ProgrammingCard.forward1}, {id: 4, action: ProgrammingCard.right}],
        [{id: 44, action: ProgrammingCard.spam}]
    ]


    // test empty cases
    expect(pm.resolveRegister(0, 'wotc1234').length).toBe(0)
    // set him a program
    pm.setProgram('wotc1234', program_1)

    expect(pm.resolveRegister(-1, 'wotc1234').length).toBe(0)
    expect(pm.resolveRegister(5, 'wotc1234').length).toBe(0)
    expect(pm.resolveRegister(0, 'miles1234').length).toBe(0)

    // check normal values
    const mv_0 = pm.resolveRegister(0, 'wotc1234')
    expect(mv_0.length).toBe(1)
    expect(isRotation(mv_0[0])).toBeFalsy()
    expect(mv_0[0].direction).toBe(MovementDirection.Forward)
    expect((mv_0[0] as RelativeMovement).distance).toBe(3)
    
    const mv_1 = pm.resolveRegister(1, 'wotc1234')
    expect(mv_1.length).toBe(1)
    console.log(mv_1)
    expect(isRotation(mv_1[0])).toBeFalsy()
    expect(mv_1[0].direction).toBe(MovementDirection.Forward)
    expect((mv_1[0] as RelativeMovement).distance).toBe(3)
    
    const mv_2 = pm.resolveRegister(2, 'wotc1234')
    expect(mv_2.length).toBe(0)

    const mv_3 = pm.resolveRegister(3, 'wotc1234')
    // not much we can check for spam. Even movement length can come up 0 if we
    // randomly select power up
    
    const mv_4 = pm.resolveRegister(4, 'wotc1234')
    expect(mv_4.length).toBe(1)
    expect(isRotation(mv_4[0])).toBeTruthy()
    expect((mv_4[0] as Rotation).units).toBe(2)

    pm.setProgram('miles1234', program_2)
    const mv_5 = pm.resolveRegister(0, 'miles1234')
    expect(mv_5.length).toBe(1)
    expect(isRotation(mv_5[0])).toBeFalsy()
    expect(mv_5[0].direction).toBe(MovementDirection.Back)
    expect((mv_5[0] as RelativeMovement).distance).toBe(1)

    const mv_6 = pm.resolveRegister(1, 'miles1234')
    expect(mv_6.length).toBe(1)
    expect(isRotation(mv_6[0])).toBeTruthy()
    expect(mv_6[0].direction).toBe(RotationDirection.CW)
    expect((mv_6[0] as Rotation).units).toBe(1)

    const mv_7 = pm.resolveRegister(2, 'miles1234')
    expect(mv_7.length).toBe(1)
    expect(isRotation(mv_7[0])).toBeFalsy()
    expect(mv_7[0].direction).toBe(MovementDirection.Forward)
    expect((mv_7[0] as RelativeMovement).distance).toBe(1)


    const mv_8 = pm.resolveRegister(3, 'miles1234')
    expect(mv_8.length).toBe(1)
    expect(isRotation(mv_8[0])).toBeTruthy()
    expect(mv_8[0].direction).toBe(RotationDirection.CCW)
    expect((mv_8[0] as Rotation).units).toBe(1)

    const mv_9 = pm.resolveRegister(4, 'miles1234')
    expect(mv_9.length).toBe(1)
    expect(isRotation(mv_9[0])).toBeFalsy()
    expect(mv_9[0].direction).toBe(MovementDirection.Forward)
    expect((mv_9[0] as RelativeMovement).distance).toBe(2)

    // lst check, for double cards
    pm.setProgram('hems1234', program_3)
    
    const mv_10 = pm.resolveRegister(0, 'hems1234', undefined, false)
    // 2 cards are not allowed, resolve as the first card
    expect(mv_10.length).toBe(1)
    expect(isRotation(mv_10[0])).toBeTruthy()
    expect(mv_10[0].direction).toBe(RotationDirection.CCW)
    expect((mv_10[0] as Rotation).units).toBe(1)
    
    // test correctness of the crab-walks
    const mv_11 = pm.resolveRegister(0, 'hems1234', undefined, true)
    expect(mv_11.length).toBe(1)
    expect(isRotation(mv_11[0])).toBeFalsy()
    expect(mv_11[0].direction).toBe(MovementDirection.Left)
    expect((mv_11[0] as RelativeMovement).distance).toBe(1)

    const mv_12 = pm.resolveRegister(1, 'hems1234', undefined, true)
    expect(mv_12.length).toBe(1)
    expect(isRotation(mv_12[0])).toBeFalsy()
    expect(mv_12[0].direction).toBe(MovementDirection.Left)
    expect((mv_12[0] as RelativeMovement).distance).toBe(1)

    const mv_13 = pm.resolveRegister(2, 'hems1234', undefined, true)
    expect(mv_13.length).toBe(1)
    expect(isRotation(mv_13[0])).toBeFalsy()
    expect(mv_13[0].direction).toBe(MovementDirection.Right)
    expect((mv_13[0] as RelativeMovement).distance).toBe(1)

    const mv_14 = pm.resolveRegister(3, 'hems1234', undefined, true)
    expect(mv_14.length).toBe(1)
    expect(isRotation(mv_14[0])).toBeFalsy()
    expect(mv_14[0].direction).toBe(MovementDirection.Right)
    expect((mv_14[0] as RelativeMovement).distance).toBe(1)

    // check that there are no registers allowed on a shutdown player
    pm.setShutdown('wotc1234')
    const mv_15 = pm.resolveRegister(2, 'wotc1234')
    expect(mv_15.length).toBe(0)
})

test('PlayerManager.addEnergy/spendEnergy',  () => {
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions)

    // check initial energy levels
    const initial_states = pm.getPlayerStates()

    for (const state of initial_states.values()) {
        expect(state.energy).toBe(3)
    }

    pm.addEnergy('wotc1234', 3)
    pm.addEnergy('hems1234', 8)
    pm.spendEnergy('ford1234', 2)
    pm.spendEnergy('miles1234', 4)

    const state_1 = pm.getPlayerStates()
    expect(state_1.get('wotc1234')).toBeDefined()
    expect(state_1.get('wotc1234').energy).toBe(6)
    expect(state_1.get('hems1234')).toBeDefined()
    expect(state_1.get('hems1234').energy).toBe(10)
    expect(state_1.get('ford1234')).toBeDefined()
    expect(state_1.get('ford1234').energy).toBe(1)
    expect(state_1.get('miles1234')).toBeDefined()
    expect(state_1.get('miles1234').energy).toBe(0)
})

test('PlayerManager.getCheckpoints/takeCheckpoint', () => {
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions)

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

test('PlayerManger.getBotPushes (no push)',  () => {

    // first of all, rotation is always allowed
    const players = getPlayerList()
    const positions = getStartingPositions()
    const pm = new PlayerManager(players, positions)

    const result = pm.getBotPushes('wotc1234', new Turn(RotationDirection.CCW), dummy_evaluator)
    expect(result.size).toBe(1)
    expect(result.has('wotc1234')).toBeTruthy()
    expect(result.get('wotc1234').length).toBe(1)
    expect(result.get('wotc1234')[0].movement).toBeDefined()
    expect(isRotation(result.get('wotc1234')[0].movement)).toBeTruthy()
    expect(result.get('wotc1234')[0].status).toBe(MovementStatus.OK)
})

test('PlayerManager.getBotPushes (chain)', () => {
    const players = getPlayerList()
    const positions = getStartingPositions()
    positions.set('miles1234', {x: 0, y:1, orientation: Orientation.N})

    const pm = new PlayerManager(players, positions)

    const result = pm.getBotPushes('hems1234', {direction: Orientation.N, distance: 1}, dummy_evaluator)

    expect(result.size).toBe(2)
    expect(result.has('hems1234')).toBeTruthy()
    expect(result.has('miles1234')).toBeTruthy()
    expect(result.get('hems1234').length).toBe(1)
    expect(result.get('hems1234')[0].movement).toBeDefined()
    expect(isAbsoluteMovement(result.get('hems1234')[0].movement)).toBeTruthy()
    expect(result.get('hems1234')[0].movement.direction).toBe(Orientation.N)
    expect(result.get('hems1234')[0].status).toBe(MovementStatus.OK)
    expect(result.get('hems1234')[0].pushed).toBeFalsy()
    expect(result.get('miles1234').length).toBe(1)
    expect(result.get('miles1234')[0].movement).toBeDefined()
    expect(isAbsoluteMovement(result.get('miles1234')[0].movement)).toBeTruthy()
    expect(result.get('miles1234')[0].movement.direction).toBe(Orientation.N)
    expect(result.get('miles1234')[0].status).toBe(MovementStatus.OK)
    expect(result.get('miles1234')[0].pushed).toBeTruthy()
})

test('PlayerManager.getBotPushes (wall shield)', () => {
    const evaluator = curry_evaluator([{x:0, y:0, orientation: Orientation.N}], MovementStatus.WALL)
    const players = getPlayerList()
    const positions = getStartingPositions()
    positions.set('miles1234', {x:0, y:1, orientation: Orientation.S})
    const pm = new PlayerManager(players, positions)

    const result = pm.getBotPushes('hems1234', {direction: Orientation.N, distance: 1}, evaluator)
    expect(result.size).toBe(1)
    expect(result.has('hems1234')).toBeTruthy()
    expect(result.get('hems1234').length).toBe(1)
    expect(result.get('hems1234')[0].movement).toBeUndefined()
    expect(result.get('hems1234')[0].status).toBeDefined()
    expect(result.get('hems1234')[0].status).toBe(MovementStatus.WALL)
    expect(result.get('hems1234')[0].pushed).toBeFalsy()
})

test('PlayerManager.getBotPushes (multiple pushing to wall)', () => {
    const evaluator = curry_evaluator([{x:0, y:2, orientation: Orientation.N}], MovementStatus.WALL)
    const players = getPlayerList()
    const positions = getStartingPositions()
    positions.set('miles1234', {x:0, y:1, orientation: Orientation.S})
    positions.set('wotc1234', {x:0, y:2, orientation: Orientation.S})
    const pm = new PlayerManager(players, positions)

    const result = pm.getBotPushes('hems1234', {direction: Orientation.N, distance: 1}, evaluator)
    expect(result.size).toBe(1)

    expect(result.has('wotc1234')).toBeTruthy()
    expect(result.get('wotc1234').length).toBe(1)
    expect(result.get('wotc1234')[0].movement).toBeUndefined()
    expect(result.get('wotc1234')[0].status).toBeDefined()
    expect(result.get('wotc1234')[0].status).toBe(MovementStatus.WALL)
    expect(result.get('wotc1234')[0].pushed).toBeTruthy()
})

test('PlayerManager.getBotPushes (chain push to pit', () => {
    const evaluator = curry_evaluator([{x:0, y:1, orientation: Orientation.N}], MovementStatus.PIT)
    const players = getPlayerList()
    const positions = getStartingPositions()
    positions.set('miles1234', {x:0, y:1, orientation: Orientation.S})
    const pm = new PlayerManager(players, positions)

    const result = pm.getBotPushes('hems1234', {direction: Orientation.N, distance: 1}, evaluator)
    expect(result.size).toBe(2)
    expect(result.has('hems1234')).toBeTruthy()
    expect(result.get('hems1234').length).toBe(1)
    expect(result.get('hems1234')[0].movement).toBeDefined()
    expect(isAbsoluteMovement(result.get('hems1234')[0].movement)).toBeTruthy()
    expect(result.get('hems1234')[0].movement.direction).toBe(Orientation.N)
    expect((result.get('hems1234')[0].movement as AbsoluteMovement).distance).toBe(1)
    expect(result.get('hems1234')[0].status).toBeDefined()
    expect(result.get('hems1234')[0].status).toBe(MovementStatus.OK)
    expect(result.get('hems1234')[0].pushed).toBeFalsy()

    expect(result.has('miles1234')).toBeTruthy()
    expect(result.get('miles1234').length).toBe(1)
    expect(result.get('miles1234')[0].movement).toBeDefined()
    expect(isAbsoluteMovement(result.get('miles1234')[0].movement)).toBeTruthy()
    expect(result.get('miles1234')[0].movement.direction).toBe(Orientation.N)
    expect((result.get('miles1234')[0].movement as AbsoluteMovement).distance).toBe(1)
    expect(result.get('miles1234')[0].status).toBeDefined()
    expect(result.get('miles1234')[0].status).toBe(MovementStatus.PIT)
    expect(result.get('miles1234')[0].pushed).toBeTruthy()
})
