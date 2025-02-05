import { expect, jest, test } from '@jest/globals'
import { GameStateManager } from "../src/main/game_manager/game_state"
import { senderMaker } from "../src/main/models/connection"
import { ActionFrame, BotMovement, BotState, MovementExecutor } from '../src/main/game_manager/executor'
import { PlayerID } from '../src/main/models/player'
import { BotInitializer, GameInitializer } from '../src/main/game_manager/initializers'
import { OrientedPosition } from '../src/main/game_manager/move_processors'
import { Orientation } from '../src/main/models/movement'
import { ProgrammingCard, RegisterArray } from '../src/main/models/game_data'
import { Robots } from '../src/main/data/robots'
import { loadFromJson } from '../src/main/game_manager/board_loader'
import { Board } from '../src/main/game_manager/board'

// we will (later) use bluetooth calls to be sure that the desired behavior is correct
// we mock bluetooth to get these values
// jest.mock("../src/main/bluetooth.ts")

// needs to be mocked for the board loader
jest.mock('node:original-fs')

function send(message: any,
    sendHandle?: any,
    options?: { keepOpen?: boolean|undefined } | undefined,
    callback?: ((error: Error|null) => void) | undefined
): boolean {
    return true
}

/** TODO write a full class here which logs actor positions and states every time we unlatch actions */
function makeMockExecutor(positions: string[]) {
    const executor: MovementExecutor = {
        setAction: jest.fn((player_id: PlayerID, action: ActionFrame) => {}),
        unlatchActions: jest.fn(() => {}),
        setMode: jest.fn((player_id: PlayerID, mode: BotState) => {}),
        getPosition: jest.fn((player_id: PlayerID, callback: (position_id: string) => void) => {callback(positions.shift())}),
        positionSet: jest.fn((player_id: PlayerID) => {})
    }
    return executor
}

declare type ExecutorCallState = {
    set_action_calls: Map<PlayerID, ActionFrame>
}

class MockExecutor implements MovementExecutor {
    public calls: ExecutorCallState[]
    public current: ExecutorCallState

    constructor() {
        this.current = {
            set_action_calls: new Map<PlayerID, ActionFrame>()
        }
        this.calls = []
    }

    setAction(player_id: PlayerID, action: ActionFrame): void {
        this.current.set_action_calls.set(player_id, action)
    }

    unlatchActions(): void {
        this.calls.push(this.current)
        this.current = {
            set_action_calls: new Map<PlayerID, ActionFrame>()
        }
    }

    setMode(player_id: PlayerID, mode: BotState): void {}
    getPosition(player_id: PlayerID, callback: (position_id: string) => void): void {}
    positionSet(player_id: PlayerID): void {}
}

test('GameStateManager.setProgram (Movements, again, pushing, pits, initial shutdowns, and conveyor2s)', async () => {
    // mock the sender
    const has_send = {
        send: jest.fn(send)
    }
    const sender = senderMaker(has_send)
    const mock_executor = new MockExecutor()
    const player_initializer = new GameInitializer()
    const bot_initializer: BotInitializer = {
        async fetchPosition() {},
        setPosition(player_id: PlayerID, pos: OrientedPosition) { return true },
        getStartingPositions() {
            const ret = new Map<PlayerID, OrientedPosition>()
            
            ret.set('hems1234', {x:6, y:2, orientation: Orientation.N})
            ret.set('miles1234', {x:6, y:3, orientation: Orientation.N})
            ret.set('wotc1234', {x:5, y:5, orientation: Orientation.E})
            ret.set('ford1234', {x:0, y:0, orientation: Orientation.E})
        
            return ret
        }
    }

    player_initializer.addPlayer('Chris', 'hems1234')
    player_initializer.addPlayer('Richard', 'wotc1234')
    player_initializer.addPlayer('Ken', 'miles1234')
    player_initializer.addPlayer('Hal', 'ford1234')

    player_initializer.setCharacter('hems1234', Robots.Thor.id)
    player_initializer.setCharacter('wotc1234', Robots.Twonky.id)
    player_initializer.setCharacter('miles1234', Robots.AxelV8.id)
    player_initializer.setCharacter('ford1234', Robots.PanzerX90.id)

    const board_data = await loadFromJson("the_keep")
    board_data.spaces[11][11].cover = {number: 1}
    player_initializer.board = new Board(board_data)

    // construct the gm
    const gm = new GameStateManager(
        player_initializer,
        bot_initializer,
        mock_executor,
        sender
    )

    // set some programs on here
    const chris_program: RegisterArray = [
        [{id: 1, action: ProgrammingCard.forward2}],
        [{id: 3, action: ProgrammingCard.back}],
        [{id: 5, action: ProgrammingCard.u_turn}],
        [{id: 7, action: ProgrammingCard.forward2}],
        [{id: 9, action: ProgrammingCard.again}]
    ]
    const richard_program: RegisterArray = [
        [{id: 2, action: ProgrammingCard.forward1}],
        [{id: 4, action: ProgrammingCard.right}],
        [{id: 6, action: ProgrammingCard.forward2}],
        [{id: 8, action: ProgrammingCard.back}],
        [{id: 10, action: ProgrammingCard.power_up}]
    ]
    const ken_program: RegisterArray = [
        [],
        [],
        [],
        [],
        []
    ]
    const hal_program: RegisterArray = [
        [],
        [],
        [],
        [],
        []
    ]

    gm.setShutdown('ford1234')

    gm.setProgram('hems1234', chris_program)
    gm.setProgram('wotc1234', richard_program)
    gm.setProgram('miles1234', ken_program)
    gm.setProgram('ford1234', hal_program)

    console.log(mock_executor)

    // unlatch is called at execution start to set any shutdowns
    expect(mock_executor.calls[0].set_action_calls.has('ford1234')).toBeTruthy()
    expect(mock_executor.calls[0].set_action_calls.get('ford1234').movement).toBeUndefined()
    expect(mock_executor.calls[0].set_action_calls.get('ford1234').end_state).toBe(BotState.SHUTDOWN)

    // first call to unlatch

    // hems moves forward 2, pushing miles
    expect(mock_executor.calls[1].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[1].set_action_calls.get('hems1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[1].set_action_calls.get('hems1234').end_state).toBeUndefined()
    expect(mock_executor.calls[1].set_action_calls.has('miles1234')).toBeTruthy()
    expect(mock_executor.calls[1].set_action_calls.get('miles1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[1].set_action_calls.get('miles1234').end_state).toBeUndefined()


    // second call to unlatch
    expect(mock_executor.calls[2].set_action_calls.has('miles1234')).toBeTruthy()
    expect(mock_executor.calls[2].set_action_calls.get('miles1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[2].set_action_calls.get('miles1234').end_state).toBeUndefined()
    expect(mock_executor.calls[2].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[2].set_action_calls.get('hems1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[2].set_action_calls.get('hems1234').end_state).toBeUndefined()

    // third call to unlatch
    // end first move (with push)
    expect(mock_executor.calls[3].set_action_calls.has('miles1234')).toBeTruthy()
    expect(mock_executor.calls[3].set_action_calls.get('miles1234').movement).toBe(BotMovement.MOVE_RIGHT)
    expect(mock_executor.calls[3].set_action_calls.get('miles1234').end_state).toBe(BotState.SHUTDOWN)
    expect(mock_executor.calls[3].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[3].set_action_calls.get('wotc1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[3].set_action_calls.get('wotc1234').end_state).toBeUndefined()
    // end second move with push, miles dropped
    // forth call to unlatch

    // lasers on
    expect(mock_executor.calls[4].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[4].set_action_calls.get('hems1234').movement).toBeUndefined()
    expect(mock_executor.calls[4].set_action_calls.get('hems1234').end_state).toBe(BotState.FIRE_LASER)
    expect(mock_executor.calls[4].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[4].set_action_calls.get('wotc1234').movement).toBeUndefined()
    expect(mock_executor.calls[4].set_action_calls.get('wotc1234').end_state).toBe(BotState.FIRE_LASER)
    expect(mock_executor.calls[4].set_action_calls.has('miles1234')).toBeFalsy()
    expect(mock_executor.calls[4].set_action_calls.has('ford1234')).toBeFalsy()
    // lasers off
    expect(mock_executor.calls[5].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[5].set_action_calls.get('hems1234').movement).toBeUndefined()
    expect(mock_executor.calls[5].set_action_calls.get('hems1234').end_state).toBe(BotState.DEFAULT)
    expect(mock_executor.calls[5].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[5].set_action_calls.get('wotc1234').movement).toBeUndefined()
    expect(mock_executor.calls[5].set_action_calls.get('wotc1234').end_state).toBe(BotState.DEFAULT)
    expect(mock_executor.calls[5].set_action_calls.has('miles1234')).toBeFalsy()
    expect(mock_executor.calls[5].set_action_calls.has('ford1234')).toBeFalsy()
    
    // register 2
    // one step back
    expect(mock_executor.calls[6].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[6].set_action_calls.get('hems1234').movement).toBe(BotMovement.MOVE_BACK)
    expect(mock_executor.calls[6].set_action_calls.get('hems1234').end_state).toBeUndefined()

    // turn right
    expect(mock_executor.calls[7].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[7].set_action_calls.get('wotc1234').movement).toBe(BotMovement.TURN_RIGHT)
    expect(mock_executor.calls[7].set_action_calls.get('wotc1234').end_state).toBeUndefined()


    // hems pushed and rotated on blue conveyor
    expect(mock_executor.calls[8].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[8].set_action_calls.get('hems1234').movement).toBe(BotMovement.MOVE_RIGHT)
    expect(mock_executor.calls[8].set_action_calls.get('hems1234').end_state).toBeUndefined()

    expect(mock_executor.calls[9].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[9].set_action_calls.get('hems1234').movement).toBe(BotMovement.MOVE_RIGHT)
    expect(mock_executor.calls[9].set_action_calls.get('hems1234').end_state).toBeUndefined()

    expect(mock_executor.calls[10].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[10].set_action_calls.get('hems1234').movement).toBe(BotMovement.TURN_LEFT)
    expect(mock_executor.calls[10].set_action_calls.get('hems1234').end_state).toBeUndefined()

    // lasers on
    expect(mock_executor.calls[11].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[11].set_action_calls.get('hems1234').movement).toBeUndefined()
    expect(mock_executor.calls[11].set_action_calls.get('hems1234').end_state).toBe(BotState.FIRE_LASER)
    expect(mock_executor.calls[11].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[11].set_action_calls.get('wotc1234').movement).toBeUndefined()
    expect(mock_executor.calls[11].set_action_calls.get('wotc1234').end_state).toBe(BotState.FIRE_LASER)
    expect(mock_executor.calls[11].set_action_calls.has('miles1234')).toBeFalsy()
    expect(mock_executor.calls[11].set_action_calls.has('ford1234')).toBeFalsy()
    // lasers off
    expect(mock_executor.calls[12].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[12].set_action_calls.get('hems1234').movement).toBeUndefined()
    expect(mock_executor.calls[12].set_action_calls.get('hems1234').end_state).toBe(BotState.DEFAULT)
    expect(mock_executor.calls[12].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[12].set_action_calls.get('wotc1234').movement).toBeUndefined()
    expect(mock_executor.calls[12].set_action_calls.get('wotc1234').end_state).toBe(BotState.DEFAULT)
    expect(mock_executor.calls[12].set_action_calls.has('miles1234')).toBeFalsy()
    expect(mock_executor.calls[12].set_action_calls.has('ford1234')).toBeFalsy()

    // register 3
    // uturn for hems
    expect(mock_executor.calls[13].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[13].set_action_calls.get('hems1234').movement).toBe(BotMovement.TURN_RIGHT)
    expect(mock_executor.calls[13].set_action_calls.get('hems1234').end_state).toBeUndefined()

    expect(mock_executor.calls[14].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[14].set_action_calls.get('hems1234').movement).toBe(BotMovement.TURN_RIGHT)
    expect(mock_executor.calls[14].set_action_calls.get('hems1234').end_state).toBeUndefined()

    // move-2 by richard
    expect(mock_executor.calls[15].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[15].set_action_calls.get('wotc1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[15].set_action_calls.get('wotc1234').end_state).toBeUndefined()

    expect(mock_executor.calls[16].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[16].set_action_calls.get('wotc1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[16].set_action_calls.get('wotc1234').end_state).toBeUndefined()

    // both moved 2 on conveyor, richard rotated
    expect(mock_executor.calls[17].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[17].set_action_calls.get('hems1234').movement).toBe(BotMovement.MOVE_LEFT)
    expect(mock_executor.calls[17].set_action_calls.get('hems1234').end_state).toBeUndefined()
    expect(mock_executor.calls[17].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[17].set_action_calls.get('wotc1234').movement).toBe(BotMovement.MOVE_LEFT)
    expect(mock_executor.calls[17].set_action_calls.get('wotc1234').end_state).toBeUndefined()

    expect(mock_executor.calls[18].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[18].set_action_calls.get('hems1234').movement).toBe(BotMovement.MOVE_LEFT)
    expect(mock_executor.calls[18].set_action_calls.get('hems1234').end_state).toBeUndefined()
    expect(mock_executor.calls[18].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[18].set_action_calls.get('wotc1234').movement).toBe(BotMovement.MOVE_LEFT)
    expect(mock_executor.calls[18].set_action_calls.get('wotc1234').end_state).toBeUndefined()
    // fourteenth call to unlatch
    
    expect(mock_executor.calls[19].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[19].set_action_calls.get('wotc1234').movement).toBe(BotMovement.TURN_LEFT)
    expect(mock_executor.calls[19].set_action_calls.get('wotc1234').end_state).toBeUndefined()

    // lasers on
    expect(mock_executor.calls[20].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[20].set_action_calls.get('hems1234').movement).toBeUndefined()
    expect(mock_executor.calls[20].set_action_calls.get('hems1234').end_state).toBe(BotState.FIRE_LASER)
    expect(mock_executor.calls[20].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[20].set_action_calls.get('wotc1234').movement).toBeUndefined()
    expect(mock_executor.calls[20].set_action_calls.get('wotc1234').end_state).toBe(BotState.FIRE_LASER)
    expect(mock_executor.calls[20].set_action_calls.has('miles1234')).toBeFalsy()
    expect(mock_executor.calls[20].set_action_calls.has('ford1234')).toBeFalsy()
    // lasers off
    expect(mock_executor.calls[21].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[21].set_action_calls.get('hems1234').movement).toBeUndefined()
    expect(mock_executor.calls[21].set_action_calls.get('hems1234').end_state).toBe(BotState.DEFAULT)
    expect(mock_executor.calls[21].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[21].set_action_calls.get('wotc1234').movement).toBeUndefined()
    expect(mock_executor.calls[21].set_action_calls.get('wotc1234').end_state).toBe(BotState.DEFAULT)
    expect(mock_executor.calls[21].set_action_calls.has('miles1234')).toBeFalsy()
    expect(mock_executor.calls[21].set_action_calls.has('ford1234')).toBeFalsy()

    // register 4
    // hems moves 2
    expect(mock_executor.calls[22].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[22].set_action_calls.get('hems1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[22].set_action_calls.get('hems1234').end_state).toBeUndefined()

    expect(mock_executor.calls[23].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[23].set_action_calls.get('hems1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[23].set_action_calls.get('hems1234').end_state).toBeUndefined()

    // rich moves back
    expect(mock_executor.calls[24].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[24].set_action_calls.get('wotc1234').movement).toBe(BotMovement.MOVE_BACK)
    expect(mock_executor.calls[24].set_action_calls.get('wotc1234').end_state).toBeUndefined()

    // conveyor2 activations
    expect(mock_executor.calls[25].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[25].set_action_calls.get('wotc1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[25].set_action_calls.get('wotc1234').end_state).toBeUndefined()

    expect(mock_executor.calls[26].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[26].set_action_calls.get('wotc1234').movement).toBe(BotMovement.TURN_LEFT)
    expect(mock_executor.calls[26].set_action_calls.get('wotc1234').end_state).toBeUndefined()

    expect(mock_executor.calls[27].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[27].set_action_calls.get('wotc1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[27].set_action_calls.get('wotc1234').end_state).toBeUndefined()

    // conveyor1 activation
    expect(mock_executor.calls[28].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[28].set_action_calls.get('hems1234').movement).toBe(BotMovement.MOVE_LEFT)
    expect(mock_executor.calls[28].set_action_calls.get('hems1234').end_state).toBeUndefined()

    // lasers on
    expect(mock_executor.calls[29].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[29].set_action_calls.get('hems1234').movement).toBeUndefined()
    expect(mock_executor.calls[29].set_action_calls.get('hems1234').end_state).toBe(BotState.FIRE_LASER)
    expect(mock_executor.calls[29].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[29].set_action_calls.get('wotc1234').movement).toBeUndefined()
    expect(mock_executor.calls[29].set_action_calls.get('wotc1234').end_state).toBe(BotState.FIRE_LASER)
    expect(mock_executor.calls[29].set_action_calls.has('miles1234')).toBeFalsy()
    expect(mock_executor.calls[29].set_action_calls.has('ford1234')).toBeFalsy()
    // lasers off
    expect(mock_executor.calls[30].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[30].set_action_calls.get('hems1234').movement).toBeUndefined()
    expect(mock_executor.calls[30].set_action_calls.get('hems1234').end_state).toBe(BotState.DEFAULT)
    expect(mock_executor.calls[30].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[30].set_action_calls.get('wotc1234').movement).toBeUndefined()
    expect(mock_executor.calls[30].set_action_calls.get('wotc1234').end_state).toBe(BotState.DEFAULT)
    expect(mock_executor.calls[30].set_action_calls.has('miles1234')).toBeFalsy()
    expect(mock_executor.calls[30].set_action_calls.has('ford1234')).toBeFalsy()

    // register 5
    // hems moves forward 2 off the board using an again
    expect(mock_executor.calls[31].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[31].set_action_calls.get('hems1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[31].set_action_calls.get('hems1234').end_state).toBeUndefined()

    expect(mock_executor.calls[32].set_action_calls.has('hems1234')).toBeTruthy()
    expect(mock_executor.calls[32].set_action_calls.get('hems1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[32].set_action_calls.get('hems1234').end_state).toBe(BotState.SHUTDOWN)

    // rich powers up
    // TODO I need to figure out how this should be handled internally
    // currently, it is not invoked
    // expect(mock_executor.calls[33].set_action_calls.has('wotc1234')).toBeTruthy()
    // expect(mock_executor.calls[33].set_action_calls.get('wotc1234').movement).toBeUndefined()
    // expect(mock_executor.calls[33].set_action_calls.get('wotc1234').end_state).toBeUndefined()

    // conveyor2s activate
    expect(mock_executor.calls[33].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[33].set_action_calls.get('wotc1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[33].set_action_calls.get('wotc1234').end_state).toBeUndefined()

    expect(mock_executor.calls[34].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[34].set_action_calls.get('wotc1234').movement).toBe(BotMovement.MOVE_FORWARD)
    expect(mock_executor.calls[34].set_action_calls.get('wotc1234').end_state).toBeUndefined()

    // lasers on (hems is inactive now)
    expect(mock_executor.calls[35].set_action_calls.has('hems1234')).toBeFalsy()
    expect(mock_executor.calls[35].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[35].set_action_calls.get('wotc1234').movement).toBeUndefined()
    expect(mock_executor.calls[35].set_action_calls.get('wotc1234').end_state).toBe(BotState.FIRE_LASER)
    expect(mock_executor.calls[35].set_action_calls.has('miles1234')).toBeFalsy()
    expect(mock_executor.calls[35].set_action_calls.has('ford1234')).toBeFalsy()
    // lasers off
    expect(mock_executor.calls[36].set_action_calls.has('hems1234')).toBeFalsy()
    expect(mock_executor.calls[36].set_action_calls.has('wotc1234')).toBeTruthy()
    expect(mock_executor.calls[36].set_action_calls.get('wotc1234').movement).toBeUndefined()
    expect(mock_executor.calls[36].set_action_calls.get('wotc1234').end_state).toBe(BotState.DEFAULT)
    expect(mock_executor.calls[36].set_action_calls.has('miles1234')).toBeFalsy()
    expect(mock_executor.calls[36].set_action_calls.has('ford1234')).toBeFalsy()

    // there were no other calls
    expect(mock_executor.calls.length).toBe(37)
})

// test('GameState.setProgram (Movements, gears, conveyor1s..., Haywire, again)', () => {})
