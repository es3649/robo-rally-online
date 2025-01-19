import { expect, test } from '@jest/globals'
import { Board, BoardData, getWalls, isValidBoardData, LaserPosition, Space, SpaceCoverType, SpaceType, Wall, WallType } from '../src/main/game_manager/board'
import { isAbsoluteMovement, isRotation, Orientation, RotationDirection } from '../src/main/models/movement'
import { DualKeyMap } from '../src/main/game_manager/graph'
import { BoardPosition, MovementArrayWithResults, MovementStatus, OrientedPosition } from '../src/main/game_manager/move_processors'

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

const sample_board2: BoardData = {
    display_name: "sample_board2",
    x_dim: 3,
    y_dim: 4,
    walls: {
        horizontal_walls: [
            [null, null, null, null, null],
            [null, null, null, null, null],
            [null, null, null, null, null]
        ] as Wall[][],
        vertical_walls: [
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null],
            [null, null, null, null]
        ] as Wall[][]
    },
    spaces: [
        [
            {type: SpaceType.CONVEYOR_L, orientation: Orientation.E},
            {type: SpaceType.CONVEYOR_F, orientation: Orientation.S},
            {type: SpaceType.CONVEYOR2_F, orientation: Orientation.E},
            {type: SpaceType.CONVEYOR2_F, orientation: Orientation.E}
        ],[
            {type: SpaceType.CONVEYOR_LF, orientation: Orientation.E},
            {type: SpaceType.CONVEYOR_F, orientation: Orientation.S},
            {type: SpaceType.CONVEYOR2_F, orientation: Orientation.E},
            {type: SpaceType.CONVEYOR2_F, orientation: Orientation.E}
        ],[
            {type: SpaceType.PIT},
            {type: SpaceType.CONVEYOR_F, orientation: Orientation.S},
            {type: SpaceType.CONVEYOR2_R, orientation: Orientation.S, cover: {number: 1}},
            {type: SpaceType.PIT}
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
        [{type: {id: "aa:bb:cc:dd"}, orientation: Orientation.N},{cover:{number: 3}},{}],
        [{cover: {number: 1}},{},{}],
        [{},{type: {id: "bb:cc:dd:ee"}, orientation: Orientation.W},{}],
        [{cover:{number:2}},{},{cover: {id: "aa:bb:cc:dd"}, cover_orientation: Orientation.S}]
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
    expect(SpaceType.isConveyor({id: "aa:bb:cc:dd"} as SpaceType.SPAWN)).toBeFalsy()
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
    expect(SpaceType.isConveyor2({id: "aa:bb:cc:dd"} as SpaceType.SPAWN)).toBeFalsy()
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
    expect(SpaceType.isAnyConveyor({id: "aa:bb:cc:dd"} as SpaceType.SPAWN)).toBeFalsy()
})

test('SpaceType.isSPAWN', () => {
    const my_spawn = {id: "aa:bb:cc:dd"}

    expect(SpaceType.isSpawn(undefined)).toBeFalsy()
    expect(SpaceType.isSpawn(my_spawn)).toBeTruthy()

    expect(SpaceType.isSpawn(SpaceType.CONVEYOR_F)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.CONVEYOR_L)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.CONVEYOR_R)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.CONVEYOR_RF)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.CONVEYOR_LF)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.CONVEYOR_LR)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.CONVEYOR_LRF)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.CONVEYOR2_F)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.CONVEYOR2_L)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.CONVEYOR2_R)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.CONVEYOR2_RF)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.CONVEYOR2_LF)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.CONVEYOR2_LR)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.CONVEYOR2_LRF)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.GEAR_R)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.GEAR_L)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.PIT)).toBeFalsy()
    expect(SpaceType.isSpawn(SpaceType.BATTERY)).toBeFalsy()
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

test('WallType.getLaserDamage', () => {
    // exhaustive-ish test
    expect(WallType.getLaserDamage(WallType.LASER)).toBe(1)
    expect(WallType.getLaserDamage(WallType.LASER2)).toBe(2)
    expect(WallType.getLaserDamage(WallType.LASER3)).toBe(3)

    expect(WallType.getLaserDamage(WallType.STANDARD)).toBe(0)
    expect(WallType.getLaserDamage({registers: [1,3,5]})).toBe(0)
    expect(WallType.getLaserDamage(undefined)).toBe(0)
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
    expect(isValidBoardData(sample_board2)).toBeTruthy()
    expect(isValidBoardData(push_board)).toBeTruthy()
})

test('Board.getId', () => {
    const b1 = new Board(sample_board)
    const b2 = new Board(sample_board)
    // IDs should be incrementing
    expect(b2.getId() - b1.getId()).toBe(1)
})

test('Board.getLastCheckpoint', () => {
    const b1 = new Board(sample_board)
    const b1_checkpoint = b1.getLastCheckpoint()
    expect(b1_checkpoint).toBe(2)

    const b2 = new Board(sample_board2)
    const b2_checkpoint = b2.getLastCheckpoint()
    expect(b2_checkpoint).toBe(1)

    const b3 = new Board(push_board)
    const b3_checkpoint = b3.getLastCheckpoint()
    expect(b3_checkpoint).toBe(3)
})

test('Board.handleConveyor2', () => {
    const b1 = new Board(sample_board)
    const positions_1 = new Map<string, OrientedPosition>()
    positions_1.set('first', {x:1,y:2, orientation: Orientation.S})
    positions_1.set('second', {x:0,y:2, orientation: Orientation.E})

    const handled = b1.handleConveyor2(positions_1)
    expect(handled.size).toBe(1)
    expect(handled.has('first')).toBeTruthy()
    expect(handled.has('second')).toBeFalsy()
    const movements = handled.get('first') as MovementArrayWithResults
    expect(movements.length).toBe(2)
    expect(movements.frames[0]).toBeDefined()
    expect(isAbsoluteMovement(movements.frames[0])).toBeTruthy()
    expect(movements.frames[0].direction).toBe(Orientation.S)
    expect(isRotation(movements.frames[1])).toBeTruthy()
    expect(movements.frames[1].direction).toBe(RotationDirection.CW)

    expect(movements.movement_boundaries).toBeDefined()
    expect(movements.movement_boundaries.length).toBeDefined()
    expect(movements.movement_boundaries.length).toBe(1)
    expect(movements.movement_boundaries[0].start).toBeDefined()
    expect(movements.movement_boundaries[0].start).toBe(0)
    expect(movements.movement_boundaries[0].end).toBeDefined()
    expect(movements.movement_boundaries[0].end).toBe(2)

    const positions_2 = new Map<string, OrientedPosition>()
    positions_2.set('first', {x:1, y:1, orientation: Orientation.W})
    positions_2.set('second', {x:0,y:2, orientation: Orientation.E})

    const handled_2 = b1.handleConveyor2(positions_2)
    expect(handled_2.size).toBe(1)
    expect(handled_2.has('first')).toBeTruthy()
    expect(handled_2.has('second')).toBeFalsy()
    const movements_2 = handled_2.get('first') as MovementArrayWithResults
    expect(movements_2.length).toBe(2)
    expect(movements_2.frames[0]).toBeDefined()
    expect(isAbsoluteMovement(movements_2.frames[0])).toBeTruthy()
    expect(movements_2.frames[0].direction).toBe(Orientation.W)
    expect(isRotation(movements_2.frames[1])).toBeTruthy()
    expect(movements_2.frames[1].direction).toBe(RotationDirection.CCW)

    for (let i = 0; i < 2; i++) {
        console.log(i)
        expect(movements.pushed[i]).toBeFalsy()
        expect(movements.results[i]).toBe(MovementStatus.OK)

        expect(movements_2.pushed[i]).toBeFalsy()
        expect(movements_2.results[i]).toBe(MovementStatus.OK)
    }
})

test('Board.handleConveyor2 (correct lengths)', () => {
    console.log('conveyor lengths')
    const b = new Board(sample_board2)
    const positions_1 = new Map<string, OrientedPosition>()
    positions_1.set('first', {x:1, y:2, orientation: Orientation.N})
    positions_1.set('second', {x:2, y:2, orientation: Orientation.W})
    
    const handled = b.handleConveyor2(positions_1)
    expect(handled.size).toBe(2)
    expect(handled.has('first')).toBeTruthy()
    expect(handled.has('second')).toBeTruthy()
    
    // this one only moved once, so it shouldn't have a second frame, but the other
    // does, so it should wait while the other moves
    // on the second, it will fail to push the other actor, and thus be stopped
    const movements1 = handled.get('first') as MovementArrayWithResults
    expect(movements1.length).toBe(2)
    expect(movements1.frames[0]).toBeDefined()
    expect(movements1.frames[1]).toBeDefined()
    
    // should have a frame for the movement and for the rotation onto the new conveyor
    // there should be no action from the second conveyor activation because it is now
    // on a conveyor 1
    const movements2 = handled.get('second') as MovementArrayWithResults
    expect(movements2.length).toBe(2)
    expect(movements2.frames[0]).toBeDefined()
    expect(movements2.frames[1]).toBeUndefined()

    const positions_2 = new Map<string, OrientedPosition>()
    positions_2.set('first', {x:0, y:3, orientation: Orientation.N})
    positions_2.set('second', {x:1, y:3, orientation: Orientation.W})

    // case for one actor falling into a pit
    const handled_2 = b.handleConveyor2(positions_2)
    expect(handled_2.size).toBe(2)
    expect(handled_2.has('first')).toBeTruthy()
    expect(handled_2.has('second')).toBeTruthy()

    const movements_a = handled.get('first') as MovementArrayWithResults
    expect(movements_a.length).toBe(2)
    expect(movements_a.frames[0]).toBeDefined()
    expect(movements_a.frames[1]).toBeDefined()
    
    // should have a frame for the first movement and no frame after falling into the pit
    const movements_b = handled.get('second') as MovementArrayWithResults
    expect(movements_b.length).toBe(2)
    expect(movements_b.frames[0]).toBeDefined()
    expect(movements_b.frames[1]).toBeUndefined()
})

test('Board.handleConveyor', () => {
    const b1 = new Board(sample_board)
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:1,y:2, orientation: Orientation.S})
    positions.set('second', {x:0,y:2, orientation: Orientation.E})

    const handled = b1.handleConveyor(positions)
    expect(handled.size).toBe(1)
    expect(handled.has('first')).toBeFalsy()
    expect(handled.has('second')).toBeTruthy()
    expect(handled.get('second').length).toBe(1)
    expect(isAbsoluteMovement(handled.get('second').frames[0])).toBeTruthy()
    expect(handled.get('second').frames[0].direction).toBe(Orientation.S)
    expect(handled.get('second').pushed[0]).toBeFalsy()
    expect(handled.get('second').results[0]).toBe(MovementStatus.OK)

})

test('Board.handleGear', () => {
    const b1 = new Board(sample_board)
    const positions = new Map<string, BoardPosition>()
    positions.set('first', {x:2, y:0})
    positions.set('second', {x:2, y:2})
    positions.set('third', {x:1, y:1})
    const handled = b1.handleGear(positions)

    expect(handled.size).toBe(2)
    expect(handled.has('first')).toBeTruthy()
    expect(handled.has('second')).toBeTruthy()
    expect(handled.has('third')).toBeFalsy()
    expect(handled.get('first').length).toBe(1)
    expect(handled.get('second').length).toBe(1)
    expect(handled.get('first').frames[0].direction).toBe(RotationDirection.CCW)
    expect(handled.get('second').frames[0].direction).toBe(RotationDirection.CW)
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

test('Board.getSpawnLocation', () => {
    const b = new Board(push_board)

    const loc1 = b.getSpawnLocation("aa:bb:cc:dd")
    expect(loc1).toBeDefined()
    expect(loc1.x).toBe(0)
    expect(loc1.y).toBe(0)
    expect(loc1.orientation).toBe(Orientation.N)

    const loc2 = b.getSpawnLocation('bb:cc:dd:ee')
    expect(loc2).toBeDefined()
    expect(loc2.x).toBe(2)
    expect(loc2.y).toBe(1)
    expect(loc2.orientation).toBe(Orientation.W)

    const loc3 = b.getSpawnLocation('test_value')
    expect(loc3).toBeUndefined()
})

test('Board.getRespawnLocation', () => {
    const b = new Board(push_board)

    const loc1 = b.getRespawnLocation("aa:bb:cc:dd")
    expect(loc1).toBeDefined()
    expect(loc1.x).toBe(3)
    expect(loc1.y).toBe(2)
    expect(loc1.orientation).toBe(Orientation.S)

    const loc2 = b.getRespawnLocation('test_value')
    expect(loc2).toBeUndefined()
})

// test('Board.rotateBoard', () => {})

test('getWalls', () => {
    const pb = new Board(push_board)
    const sb = new Board(sample_board)

    const r1 = getWalls(pb, {x:3, y:1})
    expect(r1).toBeDefined()
    expect(r1.n).toBeUndefined()
    expect(r1.s).toBeDefined()
    expect(r1.e).toBeDefined()
    expect(r1.w).toBeDefined()

    // this cell has no walls
    const r2 = getWalls(pb, {x:1, y:2})
    expect(r2).toBeDefined()
    expect(r2.n).toBeUndefined()
    expect(r2.e).toBeUndefined()
    expect(r2.s).toBeUndefined()
    expect(r2.w).toBeUndefined()

    const r3 = getWalls(sb, {x:2, y:2})
    expect(r3).toBeDefined()
    expect(r3.n).toBeUndefined()
    expect(r3.w).toBeUndefined()
    expect(r3.s).toBeDefined()
    expect(r3.e).toBeDefined()
})
