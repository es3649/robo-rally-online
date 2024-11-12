import { expect, test } from '@jest/globals'
import { Board, BoardData, isValidBoardData, LaserPosition, MovementStatus, Space, SpaceCoverType, SpaceType, Wall, WallType } from '../src/main/game_manager/board'
import { AbsoluteMovement, BoardPosition, isAbsoluteMovement, isRotation, MovementArray, MovementDirection, Orientation, OrientedPosition, Rotation, RotationDirection } from '../src/main/models/movement'
import { DualKeyMap } from '../src/main/game_manager/graph'

const sample_board: BoardData = {
    display_name: "sample_board",
    x_dim: 3,
    y_dim: 3,
    walls: {
        horizontal_walls: [
            [{hi: WallType.LASER}, null, null, null],
            [null, {lo: {registers: [1,3,5]}}, null, null],
            [{hi: WallType.LASER}, null, {}, null]
        ] as Wall[][],
        vertical_walls: [
            [{}, {hi: {registers: [4]}}, null],
            [null, null, null],
            [null, null, null],
            [null, {lo: {registers: [2,4]}}, {lo: WallType.LASER2}]
        ] as Wall[][]
    },
    spaces: [
        [
            {type: SpaceType.BATTERY, cover: {number: 1}},
            {type: SpaceType.CONVEYOR_LF, orientation: Orientation.S},
            {type: SpaceType.CONVEYOR_F, orientation: Orientation.S}
        ],[
            {type: SpaceType.PIT},
            {type: SpaceType.CONVEYOR2_R, orientation: Orientation.W},
            {type: SpaceType.CONVEYOR2_F, orientation: Orientation.S}
        ],[
            {type: SpaceType.GEAR_L},
            {cover: {number: 2}},
            {type: SpaceType.GEAR_R}
        ]
    ] as Space[][]
}

const push_board: BoardData = {
    display_name: "push_board",
    x_dim: 4,
    y_dim: 3,
    walls: {
        horizontal_walls: [
            [{hi: {registers: [1, 4]}}, null, null, null],
            [null, {hi: {registers: [1, 4]}}, null, null],
            [{hi: {registers: [3, 4]}}, null, null, {lo: {registers: [5]}}],
            [null, {hi: {registers: [2,4]}}, null, null]
        ],
        vertical_walls: [
            [null, null, {hi: {registers: [2,4]}}],
            [null, {hi: {registers:[1, 3]}}, null],
            [null, null, null],
            [null, {}, null],
            [null, {lo:{registers:[3]}},{lo: {registers: [4,5]}}]
        ]
    },
    spaces: [
        [{},{},{}],
        [{},{},{}],
        [{},{},{}],
        [{},{},{}]
    ]
}

test('SpaceType.isConveyor', () => {
    // exhaustive test is good here
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR_F)).toBeTruthy()
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR_L)).toBeTruthy()
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR_R)).toBeTruthy()
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR_RF)).toBeTruthy()
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR_LF)).toBeTruthy()
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR_LR)).toBeTruthy()
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR_LRF)).toBeTruthy()

    // these are not conveyor-1s
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR2_F)).toBeFalsy()
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR2_L)).toBeFalsy()
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR2_R)).toBeFalsy()
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR2_RF)).toBeFalsy()
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR2_LF)).toBeFalsy()
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR2_LR)).toBeFalsy()
    expect(SpaceType.isConveyor(SpaceType.CONVEYOR2_LRF)).toBeFalsy()
    expect(SpaceType.isConveyor(SpaceType.GEAR_R)).toBeFalsy()
    expect(SpaceType.isConveyor(SpaceType.GEAR_L)).toBeFalsy()
    expect(SpaceType.isConveyor(SpaceType.PIT)).toBeFalsy()
    expect(SpaceType.isConveyor(SpaceType.BATTERY)).toBeFalsy()
    expect(SpaceType.isConveyor(SpaceType.SPAWN)).toBeFalsy()
})

test('SpaceType.isConveyor2', () => {

    // exhaustive test is good here
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR2_F)).toBeTruthy()
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR2_L)).toBeTruthy()
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR2_R)).toBeTruthy()
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR2_RF)).toBeTruthy()
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR2_LF)).toBeTruthy()
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR2_LR)).toBeTruthy()
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR2_LRF)).toBeTruthy()

    // these are not conveyor-2s
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR_F)).toBeFalsy()
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR_L)).toBeFalsy()
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR_R)).toBeFalsy()
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR_RF)).toBeFalsy()
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR_LF)).toBeFalsy()
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR_LR)).toBeFalsy()
    expect(SpaceType.isConveyor2(SpaceType.CONVEYOR_LRF)).toBeFalsy()
    expect(SpaceType.isConveyor2(SpaceType.GEAR_R)).toBeFalsy()
    expect(SpaceType.isConveyor2(SpaceType.GEAR_L)).toBeFalsy()
    expect(SpaceType.isConveyor2(SpaceType.PIT)).toBeFalsy()
    expect(SpaceType.isConveyor2(SpaceType.BATTERY)).toBeFalsy()
    expect(SpaceType.isConveyor2(SpaceType.SPAWN)).toBeFalsy()
})

test('SpaceType.isAnyConveyor', () => {
    // exhaustive again
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR_F)).toBeTruthy()
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR_L)).toBeTruthy()
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR_R)).toBeTruthy()
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR_RF)).toBeTruthy()
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR_LF)).toBeTruthy()
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR_LR)).toBeTruthy()
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR_LRF)).toBeTruthy()
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR2_F)).toBeTruthy()
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR2_L)).toBeTruthy()
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR2_R)).toBeTruthy()
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR2_RF)).toBeTruthy()
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR2_LF)).toBeTruthy()
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR2_LR)).toBeTruthy()
    expect(SpaceType.isAnyConveyor(SpaceType.CONVEYOR2_LRF)).toBeTruthy()

    expect(SpaceType.isAnyConveyor(SpaceType.GEAR_R)).toBeFalsy()
    expect(SpaceType.isAnyConveyor(SpaceType.GEAR_L)).toBeFalsy()
    expect(SpaceType.isAnyConveyor(SpaceType.PIT)).toBeFalsy()
    expect(SpaceType.isAnyConveyor(SpaceType.BATTERY)).toBeFalsy()
    expect(SpaceType.isAnyConveyor(SpaceType.SPAWN)).toBeFalsy()
})

test('WallType.isPUSH', () => {
    // basic falsy values
    expect(WallType.isPUSH('')).toBeFalsy()
    expect(WallType.isPUSH(undefined)).toBeFalsy()
    expect(WallType.isPUSH({})).toBeFalsy()

    // other wall types
    expect(WallType.isPUSH(WallType.LASER)).toBeFalsy()
    expect(WallType.isPUSH(WallType.LASER2)).toBeFalsy()
    expect(WallType.isPUSH(WallType.LASER3)).toBeFalsy()
    expect(WallType.isPUSH(WallType.STANDARD)).toBeFalsy()

    // this is a hot take, but we're rolling with it
    expect(WallType.isPUSH({registers: []})).toBeFalsy()

    // actual push object
    expect(WallType.isPUSH({
        registers: [1,3,5]
    })).toBeTruthy()
})

test('WallType.isLaser', () => {
    // exhaustive test
    expect(WallType.isLaser(WallType.LASER)).toBeTruthy()
    expect(WallType.isLaser(WallType.LASER2)).toBeTruthy()
    expect(WallType.isLaser(WallType.LASER3)).toBeTruthy()

    expect(WallType.isLaser(WallType.STANDARD)).toBeFalsy()
    expect(WallType.isLaser({registers: [1,3,5]})).toBeFalsy()
    expect(WallType.isLaser(undefined)).toBeFalsy()
})

test('SpaceCoverType.isCHECKPOINT/isCRUSHER', () => {
    const checkpoint = {
        number: 1
    }

    const crusher = {
        registers: [2,4]
    }

    // basic falsy values
    expect(SpaceCoverType.isCHECKPOINT('')).toBeFalsy()
    expect(SpaceCoverType.isCRUSHER('')).toBeFalsy()
    expect(SpaceCoverType.isCHECKPOINT(undefined)).toBeFalsy()
    expect(SpaceCoverType.isCRUSHER(undefined)).toBeFalsy()
    expect(SpaceCoverType.isCHECKPOINT({})).toBeFalsy()
    expect(SpaceCoverType.isCRUSHER({})).toBeFalsy()
    
    // other space cover types
    expect(SpaceCoverType.isCHECKPOINT(SpaceCoverType.SCRAMBLER)).toBeFalsy()
    expect(SpaceCoverType.isCRUSHER(SpaceCoverType.SCRAMBLER)).toBeFalsy()
    expect(SpaceCoverType.isCHECKPOINT(SpaceCoverType.RESPAWN)).toBeFalsy()
    expect(SpaceCoverType.isCRUSHER(SpaceCoverType.RESPAWN)).toBeFalsy()
    expect(SpaceCoverType.isCHECKPOINT(crusher)).toBeFalsy()
    expect(SpaceCoverType.isCRUSHER(checkpoint)).toBeFalsy()
    
    // might be a hot take
    expect(SpaceCoverType.isCRUSHER({ registers: [] }))

    // correct types
    expect(SpaceCoverType.isCHECKPOINT(checkpoint)).toBeTruthy()
    expect(SpaceCoverType.isCRUSHER(crusher)).toBeTruthy()
})

test('isValidBoardData (key presence)', () => {
    // check key presence
    const b1 = {
        x_dim: 12,
        y_dim: 12,
        walls: {
            horizontal_walls: [] as Wall[][],
            vertical_walls: [] as Wall[][]
        },
        spaces: [] as Space[][]
    }
    const b2 = {
        display_name: "test2",
        y_dim: 12,
        walls: {
            horizontal_walls: [] as Wall[][],
            vertical_walls: [] as Wall[][]
        },
        spaces: [] as Space[][]
    }
    const b3 = {
        display_name: "test3",
        x_dim: 12,
        walls: {
            horizontal_walls: [] as Wall[][],
            vertical_walls: [] as Wall[][]
        },
        spaces: [] as Space[][]
    }
    const b4 = {
        display_name: "test4",
        x_dim: 12,
        y_dim: 12,
        spaces: [] as Space[][]
    }
    const b5 = {
        display_name: "test5",
        x_dim: 12,
        y_dim: 12,
        walls: {
            horizontal_walls: [] as Wall[][],
            vertical_walls: [] as Wall[][]
        }
    }
    const b6 = {
        display_name: "test6",
        x_dim: 12,
        y_dim: 12,
        walls: {
            vertical_walls: [] as Wall[][]
        },
        spaces: [] as Space[][]
    }
    const b7 = {
        display_name: "test7",
        x_dim: 12,
        y_dim: 12,
        walls: {
            horizontal_walls: [] as Wall[][]
        },
        spaces: [] as Space[][]
    }

    expect(isValidBoardData(b1)).toBeFalsy()
    expect(isValidBoardData(b2)).toBeFalsy()
    expect(isValidBoardData(b3)).toBeFalsy()
    expect(isValidBoardData(b4)).toBeFalsy()
    expect(isValidBoardData(b5)).toBeFalsy()
    expect(isValidBoardData(b6)).toBeFalsy()
    expect(isValidBoardData(b7)).toBeFalsy()
})

test('isValidBoardData (wrong list lengths)', () => {
    const b1 = {
        display_name: "test1",
        x_dim: 2,
        y_dim: 2,
        walls: {
            horizontal_walls: [] as Wall[][],
            vertical_walls: [] as Wall[][]
        },
        spaces: [] as Space[][]
    }
    const b2 = {
        display_name: "test2",
        x_dim: 2,
        y_dim: 2,
        walls: {
            horizontal_walls: [
                [null, null, null]
            ] as Wall[][],
            vertical_walls: [
                [null, null],
                [null, null],
                [null, null]
            ] as Wall[][]
        },
        spaces: [
            [{}, {}],
            [{}, {}]
        ] as Space[][]
    }
    const b3 = {
        display_name: "test3",
        x_dim: 2,
        y_dim: 2,
        walls: {
            horizontal_walls: [
                [null, null, null],
                [null, null, null]
            ] as Wall[][],
            vertical_walls: [
                [null, null],
                [null, null]
            ] as Wall[][]
        },
        spaces: [
            [{}, {}],
            [{}, {}]
        ] as Space[][]
    }
    const b4 = {
        display_name: "test4",
        x_dim: 2,
        y_dim: 2,
        walls: {
            horizontal_walls: [
                [null, null, null],
                [null, null, null]
            ] as Wall[][],
            vertical_walls: [
                [null, null],
                [null, null],
                [null, null]
            ] as Wall[][]
        },
        spaces: [
            [{}, {}]
        ] as Space[][]
    }
    const b5 = {
        display_name: "test5",
        x_dim: 2,
        y_dim: 2,
        walls: {
            horizontal_walls: [
                [null, null],
                [null, null, null]
            ] as Wall[][],
            vertical_walls: [
                [null, null],
                [null, null],
                [null, null]
            ] as Wall[][]
        },
        spaces: [
            [{}, {}],
            [{}, {}]
        ] as Space[][]
    }
    const b6 = {
        display_name: "test6",
        x_dim: 2,
        y_dim: 2,
        walls: {
            horizontal_walls: [
                [null, null, null],
                [null, null, null]
            ] as Wall[][],
            vertical_walls: [
                [null, null],
                [null, null],
                [null]
            ] as Wall[][]
        },
        spaces: [
            [{}, {}],
            [{}, {}]
        ] as Space[][]
    }
    const b7 = {
        display_name: "test7",
        x_dim: 2,
        y_dim: 2,
        walls: {
            horizontal_walls: [
                [null, null, null],
                [null, null, null]
            ] as Wall[][],
            vertical_walls: [
                [null, null],
                [null, null],
                [null, null]
            ] as Wall[][]
        },
        spaces: [
            [{}, {}],
            [{}]
        ] as Space[][]
    }

    expect(isValidBoardData(b1)).toBeFalsy()
    expect(isValidBoardData(b2)).toBeFalsy()
    expect(isValidBoardData(b3)).toBeFalsy()
    expect(isValidBoardData(b4)).toBeFalsy()
    expect(isValidBoardData(b5)).toBeFalsy()
    expect(isValidBoardData(b6)).toBeFalsy()
    expect(isValidBoardData(b7)).toBeFalsy()
})

test('isValidBoardData (test data)', () => {
    expect(isValidBoardData(sample_board)).toBeTruthy()
})

// test('Board.constructor', () => {})
test('Board.getId', () => {
    const b1 = new Board(sample_board)
    const b2 = new Board(sample_board)
    // IDs should be incrementing
    expect(b2.getId() - b1.getId()).toBe(1)
})

// test('Board.rebuildComponentData', () => {})

test('Board.handleConveyor2', () => {
    const b1 = new Board(sample_board)
    const positions = new Map<string, BoardPosition>()
    positions.set('first', {x:1,y:2})
    positions.set('second', {x:0,y:2})

    const handled = b1.handleConveyor2(positions)
    expect(handled.size).toBe(2)
    expect(handled.has('first')).toBeTruthy()
    expect(handled.has('second')).toBeTruthy()
    expect(handled.get('first').length).toBe(4)
    expect(handled.get('second').length).toBe(0)
    const movements = handled.get('first') as MovementArray
    expect(isAbsoluteMovement(movements[0])).toBeTruthy()
    expect(movements[0].direction).toBe(Orientation.S)
    expect(isRotation(movements[1])).toBeTruthy()
    expect(movements[1].direction).toBe(RotationDirection.CW)
    expect(isAbsoluteMovement(movements[2])).toBeTruthy()
    expect(movements[2].direction).toBe(Orientation.W)
    expect(isRotation(movements[3])).toBeTruthy()
    expect(movements[3].direction).toBe(RotationDirection.CCW)
})

test('Board.handleConveyor', () => {
    const b1 = new Board(sample_board)
    const positions = new Map<string, BoardPosition>()
    positions.set('first', {x:1,y:2})
    positions.set('second', {x:0,y:2})

    const handled = b1.handleConveyor(positions)
    expect(handled.size).toBe(2)
    expect(handled.has('first')).toBeTruthy()
    expect(handled.has('second')).toBeTruthy()
    expect(handled.get('first').length).toBe(0)
    expect(handled.get('second').length).toBe(1)
    expect(handled.get('second')[0].direction).toBe(Orientation.S)
})

test('Board.handleGear', () => {
    const b1 = new Board(sample_board)
    const positions = new Map<string, BoardPosition>()
    positions.set('first', {x:2, y:0})
    positions.set('second', {x:2, y:2})
    positions.set('third', {x:1, y:1})
    const handled = b1.handleGear(positions)

    expect(handled.size).toBe(3)
    expect(handled.has('first')).toBeTruthy()
    expect(handled.has('second')).toBeTruthy()
    expect(handled.has('third')).toBeTruthy()
    expect(handled.get('first').length).toBe(1)
    expect(handled.get('second').length).toBe(1)
    expect(handled.get('third').length).toBe(0)
    expect(handled.get('first')[0].direction).toBe(RotationDirection.CCW)
    expect(handled.get('second')[0].direction).toBe(RotationDirection.CW)
})

test('Board.getLaserOrigins', () => {
    const b1 = new Board(sample_board)

    const origins = b1.getLaserOrigins()

    expect(origins.length).toBe(3)
    let positions = new DualKeyMap<number, LaserPosition>()
    origins.forEach((origin: LaserPosition) => {
        positions.set(origin.pos.x, origin.pos.y, origin)
    })

    expect(positions.has(0,0)).toBeTruthy()
    expect(positions.has(2,0)).toBeTruthy()
    expect(positions.has(2,2)).toBeTruthy()

    expect(positions.get(0,0).damage).toBe(1)
    expect(positions.get(2,0).damage).toBe(1)
    expect(positions.get(2,2).damage).toBe(2)
    
    expect(positions.get(0,0).pos.orientation).toBe(Orientation.N)
    expect(positions.get(2,0).pos.orientation).toBe(Orientation.N)
    expect(positions.get(2,2).pos.orientation).toBe(Orientation.W)
})

test('Board.handleLaserPaths (inclusive)', () => {
    const b1 = new Board(sample_board)
    const origins = b1.getLaserOrigins()

    const targets = new Map<string, BoardPosition>()
    targets.set('first', {x:0, y:0})
    targets.set('second', {x:2, y:0})
    targets.set('third', {x:2, y:2})
    targets.set('fourth', {x:1, y:2})

    const damages = b1.handleLaserPaths(origins, targets, true)
    expect(damages.size).toBe(4)
    expect(damages.has('first')).toBeTruthy()
    expect(damages.has('second')).toBeTruthy()
    expect(damages.has('third')).toBeTruthy()
    expect(damages.has('fourth')).toBeTruthy()

    expect(damages.get('first')).toBe(1)
    expect(damages.get('second')).toBe(1)
    expect(damages.get('third')).toBe(2)
    expect(damages.get('fourth')).toBe(0)
})

test('Board.handleLaserPaths (exclusive)', () => {
    const b1 = new Board(sample_board)
    const targets = new Map<string, OrientedPosition>()

    targets.set('first', {x:0, y:2, orientation: Orientation.S})
    targets.set('second', {x:2, y:0, orientation: Orientation.N})
    targets.set('third', {x:2, y:2, orientation: Orientation.W})
    targets.set('fourth', {x:1, y:2, orientation: Orientation.E})

    const origins: LaserPosition[] = []
    for (const value of targets.values()) {
        origins.push({
            pos: value,
            damage: 1
        })
    }

    expect(origins.length).toBe(4)

    const damages = b1.handleLaserPaths(origins, targets, false)

    expect(damages.size).toBe(4)
    expect(damages.has('first')).toBeTruthy()
    expect(damages.has('second')).toBeTruthy()
    expect(damages.has('third')).toBeTruthy()
    expect(damages.has('fourth')).toBeTruthy()

    expect(damages.get('first')).toBe(0)
    expect(damages.get('second')).toBe(0)
    expect(damages.get('third')).toBe(1)
    expect(damages.get('fourth')).toBe(1)
})

test('Board.handlePush (basic)', () => {
    const b1 = new Board(push_board)
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:0, y:0, orientation: Orientation.N}) // pushed one space up
    positions.set('second', {x:1, y:0, orientation: Orientation.N}) // not pushed: no pusher
    positions.set('third', {x:2, y:2, orientation: Orientation.S}) // not pushed: wrong register

    const movements = b1.handlePush(positions, 3)
    expect(movements.size).toBe(3)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.has('second')).toBeTruthy()
    expect(movements.has('third')).toBeTruthy()
    expect(movements.get('first').length).toBe(1)
    expect(isAbsoluteMovement(movements.get('first')[0])).toBeTruthy()
    expect((movements.get('first')[0] as AbsoluteMovement).direction).toBe(Orientation.N)
    expect((movements.get('first')[0] as AbsoluteMovement).distance).toBe(1)
    expect(movements.get('second').length).toBe(0)
    expect(movements.get('third').length).toBe(0)
})

test('Board.handlePush (basic chain)', () => {
    console.log('basic chain')
    const b1 = new Board(push_board)
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:0, y:0, orientation: Orientation.N})
    positions.set('second', {x:0, y:1, orientation: Orientation.E})

    const movements = b1.handlePush(positions, 0)
    expect(movements.size).toBe(2)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first').length).toBe(1)
    expect(isAbsoluteMovement(movements.get('first')[0])).toBeTruthy()
    expect((movements.get('first')[0] as AbsoluteMovement).direction).toBe(Orientation.N)
    expect((movements.get('first')[0] as AbsoluteMovement).distance).toBe(1)
    expect(movements.has('second')).toBeTruthy()
    expect(movements.get('second').length).toBe(1)
    expect(isAbsoluteMovement(movements.get('second')[0])).toBeTruthy()
    expect((movements.get('second')[0] as AbsoluteMovement).direction).toBe(Orientation.N)
    expect((movements.get('second')[0] as AbsoluteMovement).distance).toBe(1)
})

test('Board.handlePush (basic collide)', () => {
    console.log('basic collide')
    const b1 = new Board(push_board)
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:0, y:2, orientation: Orientation.S})
    positions.set('second', {x:1, y:1, orientation: Orientation.E})

    const movements = b1.handlePush(positions, 3)
    // both should get cancelled when they collide
    expect(movements.size).toBe(2)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first').length).toBe(0)
    expect(movements.has('second')).toBeTruthy()
    expect(movements.get('second').length).toBe(0)
})

test('Board.handlePush (chain-end collide)', () => {
    console.log('chain-end collide')
    const b1 = new Board(push_board)
    const positions_1 = new Map<string, OrientedPosition>()
    positions_1.set('first', {x:3, y:2, orientation: Orientation.S})
    positions_1.set('second', {x:2, y:2, orientation: Orientation.S})
    positions_1.set('third', {x:1, y:1, orientation: Orientation.E})

    const movements_1 = b1.handlePush(positions_1, 3)
    expect(movements_1.size).toBe(3)
    // all movements 0 for colliding parties and actors in the column
    expect(movements_1.has('first')).toBeTruthy()
    expect(movements_1.get('first').length).toBe(0)
    expect(movements_1.has('second')).toBeTruthy()
    expect(movements_1.get('second').length).toBe(0)
    expect(movements_1.has('third')).toBeTruthy()
    expect(movements_1.get('third').length).toBe(0)
    
    const positions_2 = new Map<string, OrientedPosition>()
    positions_2.set('first', {x:0, y:2, orientation: Orientation.S})
    positions_2.set('second', {x:1, y:2, orientation: Orientation.S})
    positions_2.set('third', {x:2, y:1, orientation: Orientation.E})
    positions_2.set('fourth', {x:2, y:0, orientation: Orientation.N})

    const movements_2 = b1.handlePush(positions_2, 3)
    expect(movements_2.size).toBe(4)
    // all movements 0 for colliding parties and actors in the column
    expect(movements_2.has('first')).toBeTruthy()
    expect(movements_2.get('first').length).toBe(0)
    expect(movements_2.has('second')).toBeTruthy()
    expect(movements_2.get('second').length).toBe(0)
    expect(movements_2.has('third')).toBeTruthy()
    expect(movements_2.get('third').length).toBe(0)
    expect(movements_2.has('fourth')).toBeTruthy()
    expect(movements_2.get('fourth').length).toBe(0)
})

test('Board.handlePush (push to active pusher)', () => {
    console.log('push to active pusher')
    const b1 = new Board(push_board)
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:3, y:1, orientation: Orientation.E})
    
    const movements_1 = b1.handlePush(positions, 3)
    expect(movements_1.size).toBe(1)
    expect(movements_1.has('first')).toBeTruthy()
    expect(movements_1.get('first').length).toBe(0)

    positions.set('second', {x:3, y:2, orientation: Orientation.S})

    const movements_2 = b1.handlePush(positions, 3)
    expect(movements_2.size).toBe(2)
    expect(movements_2.has('first')).toBeTruthy()
    expect(movements_2.get('first').length).toBe(0)
    expect(movements_2.has('second')).toBeTruthy()
    expect(movements_2.get('second').length).toBe(0)
})

test('Board.handlePush (mid-chain collide)', () => {
    console.log('mid-chain collide')
    const b1 = new Board(push_board)
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:1, y:1, orientation: Orientation.E})
    positions.set('second', {x:0, y:2, orientation: Orientation.S})
    positions.set('third', {x:1, y:2, orientation: Orientation.S})

    const movements = b1.handlePush(positions, 3)
    expect(movements.size).toBe(3)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first').length).toBe(0)
    expect(movements.has('second')).toBeTruthy()
    expect(movements.get('second').length).toBe(0)
    expect(movements.has('third')).toBeTruthy()
    expect(movements.get('third').length).toBe(0)
})

test('Board.handlePush (both ends push)', () => {
    console.log('both ends push')
    const b1 = new Board(push_board)
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:0, y:2, orientation: Orientation.S})
    positions.set('second', {x:1, y:2, orientation: Orientation.S})
    positions.set('third', {x:2, y:2, orientation: Orientation.S})

    const movements_1 = b1.handlePush(positions, 3)
    expect(movements_1.size).toBe(3)
    expect(movements_1.has('first')).toBeTruthy()
    expect(movements_1.get('first').length).toBe(0)
    expect(movements_1.has('second')).toBeTruthy()
    expect(movements_1.get('second').length).toBe(0)
    expect(movements_1.has('third')).toBeTruthy()
    expect(movements_1.get('third').length).toBe(0)

    positions.set('fourth', {x:3, y:2, orientation: Orientation.S})
    const movements_2 = b1.handlePush(positions, 3)
    expect(movements_2.size).toBe(4)
    expect(movements_2.has('first')).toBeTruthy()
    expect(movements_2.get('first').length).toBe(0)
    expect(movements_2.has('second')).toBeTruthy()
    expect(movements_2.get('second').length).toBe(0)
    expect(movements_2.has('third')).toBeTruthy()
    expect(movements_2.get('third').length).toBe(0)
    expect(movements_2.has('fourth')).toBeTruthy()
    expect(movements_2.get('fourth').length).toBe(0)
})

test('Board.handlePush (wall stops)', () => {
    console.log('wall stops')
    const b1 = new Board(push_board)
    const positions_1 = new Map<string, OrientedPosition>()
    positions_1.set('first', {x:3, y:1, orientation: Orientation.E})

    const movements_1 = b1.handlePush(positions_1, 2)
    expect(movements_1.size).toBe(1)
    expect(movements_1.has('first')).toBeTruthy()
    expect(movements_1.get('first').length).toBe(0)
    
    // try again in a column
    const positions_2 = new Map<string, OrientedPosition>()
    positions_2.set('first', {x:1, y:1, orientation: Orientation.E})
    positions_2.set('second', {x:2, y:1, orientation: Orientation.E})

    const movements_2 = b1.handlePush(positions_2, 2)
    expect(movements_2.size).toBe(2)
    expect(movements_2.has('first')).toBeTruthy()
    expect(movements_2.get('first').length).toBe(0)
    expect(movements_2.has('second')).toBeTruthy()
    expect(movements_2.get('second').length).toBe(0)
})

test('Board.handlePush (wall shield)', () => {
    console.log('wall shield')
    const b1 = new Board(push_board)
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:2, y:0, orientation: Orientation.N})
    positions.set('second', {x:2, y:1, orientation: Orientation.E})
    positions.set('third', {x:3, y:1, orientation: Orientation.E})

    const movements = b1.handlePush(positions, 2)
    expect(movements.size).toBe(3)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first').length).toBe(1)
    expect(isAbsoluteMovement(movements.get('first')[0])).toBeTruthy()
    expect((movements.get('first')[0] as AbsoluteMovement).direction).toBe(Orientation.N)
    expect((movements.get('first')[0] as AbsoluteMovement).distance).toBe(1)
    expect(movements.has('second')).toBeTruthy()
    expect(movements.get('second').length).toBe(1)
    expect(isAbsoluteMovement(movements.get('second')[0])).toBeTruthy()
    expect((movements.get('second')[0] as AbsoluteMovement).direction).toBe(Orientation.N)
    expect((movements.get('second')[0] as AbsoluteMovement).distance).toBe(1)
    expect(movements.has('third')).toBeTruthy()
    expect(movements.get('third').length).toBe(0)
})

test('Board.handlePush (2 acting pushers)', () => {
    const b1 = new Board(push_board)
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:1, y:1, orientation: Orientation.E})

    const movements = b1.handlePush(positions, 0)
    expect(movements.size).toBe(1)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first').length).toBe(0)
})

test('Board.handlePush (mid-chain pusher)', () => {
    console.log('mid-chain pusher')
    const b1 = new Board(push_board)
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:2, y:2, orientation: Orientation.S})
    positions.set('second', {x:3, y:2, orientation: Orientation.S})

    const movements = b1.handlePush(positions, 4)
    expect(movements.size).toBe(2)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first').length).toBe(0)
    expect(movements.has('second')).toBeTruthy()
    expect(movements.get('second').length).toBe(0)
})

test('Board.handlePush (moving past conflicted chain', () => {
    const b1 = new Board(push_board)
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:2, y:2, orientation: Orientation.S})
    positions.set('second', {x:3, y:2, orientation: Orientation.S})
    positions.set('third', {x: 1, y:1, orientation: Orientation.E})

    const movements = b1.handlePush(positions, 0)
    expect(movements.size).toBe(3)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first').length).toBe(0)
    expect(movements.has('second')).toBeTruthy()
    expect(movements.get('second').length).toBe(0)
    expect(movements.has('third')).toBeTruthy()
    expect(movements.get('third').length).toBe(0)
})

// test('Board.rotateBoard', () => {})

// test('getWalls', () => {})
