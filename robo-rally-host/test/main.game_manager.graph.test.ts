import { expect, test } from '@jest/globals'
import { ConveyorForest, DualKeyMap } from "../src/main/game_manager/graph";
import { AbsoluteMovement, BoardPosition, isAbsoluteMovement, isRotation, Movement, Orientation, Rotation, RotationDirection } from '../src/main/models/movement';

// populate the forest
const cf = new ConveyorForest()
cf.addConveyor({x:0,y:0}, Orientation.E)
cf.addConveyor({x:1,y:0}, Orientation.E, RotationDirection.CCW)
cf.addConveyor({x:2,y:0}, Orientation.N)
cf.addConveyor({x:1, y:1}, Orientation.E)

test('DualKeyMap', () => {
    const dkm = new DualKeyMap<number, string>()

    // should be empty on init
    expect(dkm.size).toBe(0)

    // get a property
    expect(dkm.has(0,0)).toBeFalsy()
    expect(dkm.get(0,0)).toBeUndefined()

    // add something
    dkm.set(0, 0, 'origin')
    expect(dkm.size).toBe(1)
    expect(dkm.has(0,0)).toBeTruthy()
    expect(dkm.get(0,0)).toBe('origin')
    
    expect(dkm.has(1,1)).toBeFalsy()
    expect(dkm.get(1,1)).toBeUndefined()

    dkm.set(0,1, 'start')
    expect(dkm.size).toBe(2)
    expect(dkm.has(0,1)).toBeTruthy()
    expect(dkm.get(0,1)).toBe('start')
    
    dkm.set(0,0, 'finish')
    expect(dkm.size).toBe(2)
    expect(dkm.has(0,0)).toBeTruthy()
    expect(dkm.has(0,1)).toBeTruthy()
    expect(dkm.get(0,0)).toBe('finish')
    expect(dkm.get(0,1)).toBe('start')

    dkm.clear()
    expect(dkm.size).toBe(0)
    expect(dkm.has(0,0)).toBeFalsy()
    expect(dkm.get(0,0)).toBeUndefined()

})

test('ConveyorForest.handleConveyance (empty)', () => {
    
    // a basic on-track set
    const basic = new Map<string, BoardPosition>()
    basic.set("first", {x:0, y:0})

    // ake an empty forest
    const cf_empty = new ConveyorForest()
    
    // if the forest is empty, shouldn't be a problem
    const res_basic = cf_empty.handleMovement(basic)
    expect(res_basic.size).toBe(1)
    expect(res_basic.has('first')).toBeTruthy()
    expect(res_basic.get("first").length).toBe(0)
    
    // test an empty map
    const empty = new Map<string, BoardPosition>()
    const res_empty = cf.handleMovement(empty)
    
    expect(res_empty.size).toBe(0)
})

test('ConveyorForest.handleConveyance (basic)', () => {

    const basic = new Map<string, BoardPosition>()
    basic.set("first", {x:0, y:0})

    // look into this real deep
    const res_basic = cf.handleMovement(basic)
    expect(res_basic.size).toBe(1)
    expect(res_basic.has("first")).toBeTruthy()
    expect(res_basic.get("first").length).toBe(1)
    let mvmt = res_basic.get("first")[0] as Movement
    expect(isAbsoluteMovement(mvmt)).toBeTruthy()
    mvmt = mvmt as AbsoluteMovement
    expect(mvmt.direction).toBe(Orientation.E)
    expect(mvmt.distance).toBe(1)
})

test('ConveyorForest.handleConveyance (off conveyor)', () => {
    // position not on a conveyor
    const off = new Map<string, BoardPosition>()
    off.set("first", {x:0, y:1})
    const res_off = cf.handleMovement(off)
    
    expect(res_off.size).toBe(1)
    expect(res_off.has('first')).toBeTruthy()
    expect(res_off.get("first").length).toBe(0)
})

test('ConveyorForest.handleConveyance (turn)', () => {

    // test action on a turn
    const turn = new Map<string, BoardPosition>()
    turn.set("first", {x:1, y:0})
    const res_turn = cf.handleMovement(turn)
    
    // should get 2 this time
    expect(res_turn.size).toBe(1)
    expect(res_turn.has('first')).toBeTruthy()
    expect(res_turn.get("first").length).toBe(2)
    let mvmt = res_turn.get("first")[0] as Movement
    expect(isAbsoluteMovement(mvmt)).toBeTruthy()
    mvmt = mvmt as AbsoluteMovement
    expect(mvmt.direction).toBe(Orientation.E)
    expect(mvmt.distance).toBe(1)
    
    mvmt = res_turn.get("first")[1] as Movement
    expect(isRotation(mvmt)).toBeTruthy()
    mvmt = mvmt as Rotation
    expect(mvmt.direction).toBe(RotationDirection.CCW)
    expect(mvmt.units).toBe(1)
})

test('ConveyorForest.handleConveyance (adjacent actors)', () => {

    // check 2 adjacent actors moving
    const parallel_movement = new Map<string, BoardPosition>()
    parallel_movement.set('first', {x:0,y:0})
    parallel_movement.set('second', {x:1,y:0})
    const res_parallel_move = cf.handleMovement(parallel_movement)
    
    expect(res_parallel_move.size).toBe(2)
    expect(res_parallel_move.has('first')).toBeTruthy()
    expect(res_parallel_move.has('second')).toBeTruthy()
    expect(res_parallel_move.get("first").length).toBe(1)
    expect(res_parallel_move.get("second").length).toBe(2)
    let mvmt = res_parallel_move.get("first")[0] as Movement
    expect(isAbsoluteMovement(mvmt)).toBeTruthy()
    mvmt = res_parallel_move.get("second")[0] as Movement
    expect(isAbsoluteMovement(mvmt)).toBeTruthy()
    mvmt = res_parallel_move.get("second")[1] as Movement
    expect(isRotation(mvmt)).toBeTruthy()
})

test('ConveyorForest.handleConveyance (collision w/ stationary)', () => {
    // check that an actor cannot be pushed into a stationary actor
    const stationary_collision = new Map<string, BoardPosition>()
    stationary_collision.set("first", {x:2,y:0})
    stationary_collision.set("second", {x:2,y:1})
    const res_stationary_col = cf.handleMovement(stationary_collision)

    expect(res_stationary_col.size).toBe(2)
    expect(res_stationary_col.has('first')).toBeTruthy()
    expect(res_stationary_col.has('second')).toBeTruthy()
    expect(res_stationary_col.get("first").length).toBe(0)
    expect(res_stationary_col.get("second").length).toBe(0)
})

test('ConveyorForest.handleConveyance (collision w/ moving)', () => {

    // check that two actors cannot be pushed onto the same space
    const moving_collision = new Map<string, BoardPosition>()
    moving_collision.set("first", {x:2,y:0})
    moving_collision.set("second", {x:1,y:1})
    const res_moving_col = cf.handleMovement(moving_collision)
    
    expect(res_moving_col.size).toBe(2)
    expect(res_moving_col.has('first')).toBeTruthy()
    expect(res_moving_col.has('second')).toBeTruthy()
    expect(res_moving_col.get("first").length).toBe(0)
    expect(res_moving_col.get("second").length).toBe(0)
})

test('ConveyorForest.handleConveyance (3-way collision)', () => {
    cf.addConveyor({x:2, y:2}, Orientation.S)
    const triple = new Map<string, BoardPosition>()
    triple.set('first', {x:1,y:1})
    triple.set('second', {x:2,y:0})
    triple.set('third', {x:2,y:2})
    const res_triple = cf.handleMovement(triple)

    expect(res_triple.size).toBe(3)
    expect(res_triple.has('first')).toBeTruthy()
    expect(res_triple.has('second')).toBeTruthy()
    expect(res_triple.has('third')).toBeTruthy()
    // all are moving to the same spot, so no movements should be allowed
    expect(res_triple.get('first').length).toBe(0)
    expect(res_triple.get('second').length).toBe(0)
    expect(res_triple.get('third').length).toBe(0)
})

test('ConveyorForest.handleConveyance (multiple pushing to collision)', () => {
    cf.addConveyor({x:0, y:1}, Orientation.S)
    const lineup = new Map<string, BoardPosition>()
    lineup.set("first", {x:2,y:0})
    lineup.set("second", {x:1,y:1})
    lineup.set("third", {x:1,y:0})
    lineup.set("fourth", {x:0,y:1})
    const res_lineup = cf.handleMovement(lineup)

    expect(res_lineup.size).toBe(4)
    expect(res_lineup.has('first')).toBeTruthy()
    expect(res_lineup.has('second')).toBeTruthy()
    expect(res_lineup.has('third')).toBeTruthy()
    expect(res_lineup.has('fourth')).toBeTruthy()
    // all are moving to the same spot, so no movements should be allowed
    expect(res_lineup.get('first').length).toBe(0)
    expect(res_lineup.get('second').length).toBe(0)
    expect(res_lineup.get('third').length).toBe(0)
    expect(res_lineup.get('fourth').length).toBe(1)
})