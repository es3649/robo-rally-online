import { expect, test } from '@jest/globals'
import { SpaceCoverType, SpaceType, WallType } from '../src/main/game_manager/board'

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

// test('isValidBoardData', () => {
//     // TODO make some fake boards to test for this
// })

// test('Board.constructor', () => {})
// test('Board.getId', () => {})
// test('Board.rotateBoard', () => {})
// test('Board.rebuildComponentData', () => {})
// test('Board.handleConveyor2', () => {})
// test('Board.handleConveyor', () => {})
// test('Board.handleGear', () => {})
// test('Board.handleLaserPaths', () => {})
// test('Board.handlePush', () => {})

// test('getWalls', () => {})