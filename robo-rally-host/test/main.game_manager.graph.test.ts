import { expect, test } from '@jest/globals'
import { MovementForest, DualKeyMap } from "../src/main/game_manager/graph";
import { AbsoluteMovement, isAbsoluteMovement, isRotation, Orientation, RotationDirection } from '../src/main/models/movement';
import { AbsoluteStep, MovementFrame, MovementResult, MovementStatus, OrientedPosition, Turn } from '../src/main/game_manager/move_processors';

// populate the forest
const cf = new MovementForest(false)
cf.addMover({x:0,y:0}, Orientation.E)
cf.addMover({x:1,y:0}, Orientation.E, RotationDirection.CCW)
cf.addMover({x:2,y:0}, Orientation.N)
cf.addMover({x:1, y:1}, Orientation.E)

const walls = {
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
}

const pf0 = new MovementForest()
pf0.addMover({x:0, y:0}, Orientation.N)
pf0.addMover({x:1, y:1}, Orientation.E)
pf0.addMover({x:1, y:1}, Orientation.N)

const pf2 = new MovementForest()
pf2.addMover({x:1, y:1}, Orientation.E)
pf2.addMover({x:2, y:0}, Orientation.N)
pf2.addMover({x:3, y:1}, Orientation.W)

const pf3 = new MovementForest()
pf3.addMover({x:0, y:0}, Orientation.N)
pf3.addMover({x:0, y:2}, Orientation.E)
pf3.addMover({x:1, y:1}, Orientation.N)
pf3.addMover({x:2, y:0}, Orientation.N)
pf3.addMover({x:3, y:1}, Orientation.N)
pf3.addMover({x:3, y:2}, Orientation.E)

const pf4 = new MovementForest()
pf4.addMover({x:2, y:2}, Orientation.S)

function dummy_evaluator(position: OrientedPosition, move: MovementFrame): MovementResult {
    return {
        movement: move,
        status: MovementStatus.OK,
        pushed: false
    }
}

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

test('MovementForest.handleMovement (conveyor: empty)', () => {
    
    // a basic on-track set
    const basic = new Map<string, OrientedPosition>()
    basic.set("first", {x:0, y:0, orientation: Orientation.N})

    // make an empty forest
    const cf_empty = new MovementForest(false)
    
    // if the forest is empty, shouldn't be a problem
    const res_basic = cf_empty.handleMovement(basic, dummy_evaluator)
    expect(res_basic.size).toBe(1)
    expect(res_basic.has('first')).toBeTruthy()
    expect(res_basic.get("first").length).toBe(0)
    
    // test an empty map
    const empty = new Map<string, OrientedPosition>()
    const res_empty = cf.handleMovement(empty, dummy_evaluator)
    
    expect(res_empty.size).toBe(0)
})

test('MovementForest.handleMovement (conveyor: basic)', () => {

    const basic = new Map<string, OrientedPosition>()
    basic.set("first", {x:0, y:0, orientation: Orientation.S})

    // look into this real deep
    const res_basic = cf.handleMovement(basic, dummy_evaluator)
    expect(res_basic.size).toBe(1)
    expect(res_basic.has("first")).toBeTruthy()
    expect(res_basic.get("first").length).toBe(1)
    const mvmt = res_basic.get("first")[0] as MovementResult
    expect(isAbsoluteMovement(mvmt)).toBeTruthy()
    const step = mvmt.movement as AbsoluteMovement
    expect(step.direction).toBe(Orientation.E)
    expect(step.distance).toBe(1)
})

test('MovementForest.handleMovement (conveyor: off conveyor)', () => {
    // position not on a conveyor
    const off = new Map<string, OrientedPosition>()
    off.set("first", {x:0, y:1, orientation: Orientation.W})
    const res_off = cf.handleMovement(off, dummy_evaluator)
    
    expect(res_off.size).toBe(1)
    expect(res_off.has('first')).toBeTruthy()
    expect(res_off.get("first").length).toBe(0)
})

test('MovementForest.handleMovement (conveyor: turn)', () => {

    // test action on a turn
    const turn = new Map<string, OrientedPosition>()
    turn.set("first", {x:1, y:0, orientation: Orientation.E})
    const res_turn = cf.handleMovement(turn, dummy_evaluator)
    
    // should get 2 this time
    expect(res_turn.size).toBe(1)
    expect(res_turn.has('first')).toBeTruthy()
    expect(res_turn.get("first").length).toBe(2)
    let mvmt = res_turn.get("first")[0] as MovementResult
    expect(isAbsoluteMovement(mvmt)).toBeTruthy()
    let step = mvmt.movement as AbsoluteStep
    expect(step.direction).toBe(Orientation.E)
    expect(step.distance).toBe(1)
    
    mvmt = res_turn.get("first")[1] as MovementResult
    expect(isRotation(mvmt)).toBeTruthy()
    let step_2 = mvmt.movement as Turn
    expect(step_2.direction).toBe(RotationDirection.CCW)
    expect(step_2.units).toBe(1)
})

test('MovementForest.handleMovement (conveyor: adjacent actors)', () => {

    // check 2 adjacent actors moving
    const parallel_movement = new Map<string, OrientedPosition>()
    parallel_movement.set('first', {x:0,y:0, orientation: Orientation.S})
    parallel_movement.set('second', {x:1,y:0, orientation: Orientation.W})
    const res_parallel_move = cf.handleMovement(parallel_movement, dummy_evaluator)
    
    expect(res_parallel_move.size).toBe(2)
    expect(res_parallel_move.has('first')).toBeTruthy()
    expect(res_parallel_move.has('second')).toBeTruthy()
    expect(res_parallel_move.get("first").length).toBe(1)
    expect(res_parallel_move.get("second").length).toBe(2)
    const mvmt = res_parallel_move.get("first")[0] as MovementResult
    expect(isAbsoluteMovement(mvmt)).toBeTruthy()
    const step = res_parallel_move.get("second")[0].movement as AbsoluteStep
    expect(isAbsoluteMovement(step)).toBeTruthy()
    const step_2 = res_parallel_move.get("second")[1].movement as Turn
    expect(isRotation(mvmt)).toBeTruthy()
})

test('MovementForest.handleMovement (conveyor: collision w/ stationary)', () => {
    // check that an actor cannot be pushed into a stationary actor
    const stationary_collision = new Map<string, OrientedPosition>()
    stationary_collision.set("first", {x:2,y:0, orientation: Orientation.S})
    stationary_collision.set("second", {x:2,y:1, orientation: Orientation.S})
    const res_stationary_col = cf.handleMovement(stationary_collision, dummy_evaluator)

    expect(res_stationary_col.size).toBe(2)
    expect(res_stationary_col.has('first')).toBeTruthy()
    expect(res_stationary_col.has('second')).toBeTruthy()
    expect(res_stationary_col.get("first").length).toBe(0)
    expect(res_stationary_col.get("second").length).toBe(0)
})

test('MovementForest.handleMovement (conveyor: collision w/ moving)', () => {

    // check that two actors cannot be pushed onto the same space
    const moving_collision = new Map<string, OrientedPosition>()
    moving_collision.set("first", {x:2,y:0, orientation: Orientation.W})
    moving_collision.set("second", {x:1,y:1, orientation: Orientation.N})
    const res_moving_col = cf.handleMovement(moving_collision, dummy_evaluator)
    
    expect(res_moving_col.size).toBe(2)
    expect(res_moving_col.has('first')).toBeTruthy()
    expect(res_moving_col.has('second')).toBeTruthy()
    expect(res_moving_col.get("first").length).toBe(0)
    expect(res_moving_col.get("second").length).toBe(0)
})

test('MovementForest.handleMovement (conveyor: 3-way collision)', () => {
    cf.addMover({x:2, y:2}, Orientation.S)
    const triple = new Map<string, OrientedPosition>()
    triple.set('first', {x:1,y:1, orientation: Orientation.N})
    triple.set('second', {x:2,y:0, orientation: Orientation.N})
    triple.set('third', {x:2,y:2, orientation: Orientation.N})
    const res_triple = cf.handleMovement(triple, dummy_evaluator)

    expect(res_triple.size).toBe(3)
    expect(res_triple.has('first')).toBeTruthy()
    expect(res_triple.has('second')).toBeTruthy()
    expect(res_triple.has('third')).toBeTruthy()
    // all are moving to the same spot, so no movements should be allowed
    expect(res_triple.get('first').length).toBe(0)
    expect(res_triple.get('second').length).toBe(0)
    expect(res_triple.get('third').length).toBe(0)
})

test('MovementForest.handleMovement (conveyor: multiple pushing to collision)', () => {
    cf.addMover({x:0, y:1}, Orientation.S)
    const lineup = new Map<string, OrientedPosition>()
    lineup.set("first", {x:2,y:0, orientation: Orientation.N})
    lineup.set("second", {x:1,y:1, orientation: Orientation.S})
    lineup.set("third", {x:1,y:0, orientation: Orientation.E})
    lineup.set("fourth", {x:0,y:1, orientation: Orientation.W})
    const res_lineup = cf.handleMovement(lineup, dummy_evaluator)

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

test('MovementForest.handleMovement(pusher: basic)', () => {

    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:0, y:0, orientation: Orientation.N}) // pushed one space up
    positions.set('second', {x:1, y:0, orientation: Orientation.N}) // not pushed: no pusher
    positions.set('third', {x:2, y:2, orientation: Orientation.S}) // not pushed: wrong register

    const movements = pf3.handleMovement(positions, dummy_evaluator)
    expect(movements.size).toBe(3)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first')).toBeDefined()
    expect(isAbsoluteMovement(movements.get('first'))).toBeTruthy()
    expect(movements.get('first')[0].movement.direction).toBe(Orientation.N)
    expect((movements.get('first')[0].movement as AbsoluteStep).distance).toBe(1)
    expect(movements.get('second')).toBeUndefined()
    expect(movements.get('third')).toBeUndefined()
})

test('MovementForest.handleMovement(pusher: basic chain)', () => {
    console.log('basic chain')
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:0, y:0, orientation: Orientation.N})
    positions.set('second', {x:0, y:1, orientation: Orientation.E})

    const movements = pf0.handleMovement(positions, dummy_evaluator)
    expect(movements.size).toBe(2)
    expect(movements.has('first')).toBeTruthy()
    expect(isAbsoluteMovement(movements.get('first'))).toBeTruthy()
    expect((movements.get('first')[0].movement as AbsoluteStep).direction).toBe(Orientation.N)
    expect((movements.get('first')[0].movement as AbsoluteStep).distance).toBe(1)
    expect(movements.has('second')).toBeTruthy()
    expect(isAbsoluteMovement(movements.get('second'))).toBeTruthy()
    expect((movements.get('second')[0].movement as AbsoluteStep).direction).toBe(Orientation.N)
    expect((movements.get('second')[0].movement as AbsoluteStep).distance).toBe(1)
})

test('MovementForest.handleMovement(pusher: basic collide)', () => {
    console.log('basic collide')
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:0, y:2, orientation: Orientation.S})
    positions.set('second', {x:1, y:1, orientation: Orientation.E})

    const movements = pf3.handleMovement(positions, dummy_evaluator)
    // both should get cancelled when they collide
    expect(movements.size).toBe(2)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first')).toBeUndefined()
    expect(movements.has('second')).toBeTruthy()
    expect(movements.get('second')).toBeUndefined()
})

test('MovementForest.handleMovement(pusher: chain-end collide)', () => {
    console.log('chain-end collide')
    const positions_1 = new Map<string, OrientedPosition>()
    positions_1.set('first', {x:3, y:2, orientation: Orientation.S})
    positions_1.set('second', {x:2, y:2, orientation: Orientation.S})
    positions_1.set('third', {x:1, y:1, orientation: Orientation.E})

    const movements_1 = pf3.handleMovement(positions_1, dummy_evaluator)
    expect(movements_1.size).toBe(3)
    // all movements 0 for colliding parties and actors in the column
    expect(movements_1.has('first')).toBeTruthy()
    expect(movements_1.get('first')).toBeUndefined()
    expect(movements_1.has('second')).toBeTruthy()
    expect(movements_1.get('second')).toBeUndefined()
    expect(movements_1.has('third')).toBeTruthy()
    expect(movements_1.get('third')).toBeUndefined()
    
    const positions_2 = new Map<string, OrientedPosition>()
    positions_2.set('first', {x:0, y:2, orientation: Orientation.S})
    positions_2.set('second', {x:1, y:2, orientation: Orientation.S})
    positions_2.set('third', {x:2, y:1, orientation: Orientation.E})
    positions_2.set('fourth', {x:2, y:0, orientation: Orientation.N})

    const movements_2 = pf3.handleMovement(positions_2, dummy_evaluator)
    expect(movements_2.size).toBe(4)
    // all movements 0 for colliding parties and actors in the column
    expect(movements_2.has('first')).toBeTruthy()
    expect(movements_2.get('first')).toBeUndefined()
    expect(movements_2.has('second')).toBeTruthy()
    expect(movements_2.get('second')).toBeUndefined()
    expect(movements_2.has('third')).toBeTruthy()
    expect(movements_2.get('third')).toBeUndefined()
    expect(movements_2.has('fourth')).toBeTruthy()
    expect(movements_2.get('fourth')).toBeUndefined()
})

test('MovementForest.handleMovement(pusher: push to active pusher)', () => {
    console.log('push to active pusher')
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:3, y:1, orientation: Orientation.E})
    
    const movements_1 = pf3.handleMovement(positions, dummy_evaluator)
    expect(movements_1.size).toBe(1)
    expect(movements_1.has('first')).toBeTruthy()
    expect(movements_1.get('first')).toBeUndefined()

    positions.set('second', {x:3, y:2, orientation: Orientation.S})

    const movements_2 = pf3.handleMovement(positions, dummy_evaluator)
    expect(movements_2.size).toBe(2)
    expect(movements_2.has('first')).toBeTruthy()
    expect(movements_2.get('first')).toBeUndefined()
    expect(movements_2.has('second')).toBeTruthy()
    expect(movements_2.get('second')).toBeUndefined()
})

test('MovementForest.handleMovement(pusher: mid-chain collide)', () => {
    console.log('mid-chain collide')
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:1, y:1, orientation: Orientation.E})
    positions.set('second', {x:0, y:2, orientation: Orientation.S})
    positions.set('third', {x:1, y:2, orientation: Orientation.S})

    const movements = pf3.handleMovement(positions, dummy_evaluator)
    expect(movements.size).toBe(3)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first')).toBeUndefined()
    expect(movements.has('second')).toBeTruthy()
    expect(movements.get('second')).toBeUndefined()
    expect(movements.has('third')).toBeTruthy()
    expect(movements.get('third')).toBeUndefined()
})

test('MovementForest.handleMovement(pusher: both ends push)', () => {
    console.log('both ends push')
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:0, y:2, orientation: Orientation.S})
    positions.set('second', {x:1, y:2, orientation: Orientation.S})
    positions.set('third', {x:2, y:2, orientation: Orientation.S})

    const movements_1 = pf3.handleMovement(positions, dummy_evaluator)
    expect(movements_1.size).toBe(3)
    expect(movements_1.has('first')).toBeTruthy()
    expect(movements_1.get('first')).toBeUndefined()
    expect(movements_1.has('second')).toBeTruthy()
    expect(movements_1.get('second')).toBeUndefined()
    expect(movements_1.has('third')).toBeTruthy()
    expect(movements_1.get('third')).toBeUndefined()

    positions.set('fourth', {x:3, y:2, orientation: Orientation.S})
    const movements_2 = pf3.handleMovement(positions, dummy_evaluator)
    expect(movements_2.size).toBe(4)
    expect(movements_2.has('first')).toBeTruthy()
    expect(movements_2.get('first')).toBeUndefined()
    expect(movements_2.has('second')).toBeTruthy()
    expect(movements_2.get('second')).toBeUndefined()
    expect(movements_2.has('third')).toBeTruthy()
    expect(movements_2.get('third')).toBeUndefined()
    expect(movements_2.has('fourth')).toBeTruthy()
    expect(movements_2.get('fourth')).toBeUndefined()
})

test('MovementForest.handleMovement(pusher: wall stops)', () => {
    console.log('wall stops')
    const positions_1 = new Map<string, OrientedPosition>()
    positions_1.set('first', {x:3, y:1, orientation: Orientation.E})

    const movements_1 = pf2.handleMovement(positions_1, dummy_evaluator)
    expect(movements_1.size).toBe(1)
    expect(movements_1.has('first')).toBeTruthy()
    expect(movements_1.get('first')).toBeUndefined()
    
    // try again in a column
    const positions_2 = new Map<string, OrientedPosition>()
    positions_2.set('first', {x:1, y:1, orientation: Orientation.E})
    positions_2.set('second', {x:2, y:1, orientation: Orientation.E})

    const movements_2 = pf2.handleMovement(positions_2, dummy_evaluator)
    expect(movements_2.size).toBe(2)
    expect(movements_2.has('first')).toBeTruthy()
    expect(movements_2.get('first')).toBeUndefined()
    expect(movements_2.has('second')).toBeTruthy()
    expect(movements_2.get('second')).toBeUndefined()
})

test('MovementForest.handleMovement(pusher: wall shield)', () => {
    console.log('wall shield')
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:2, y:0, orientation: Orientation.N})
    positions.set('second', {x:2, y:1, orientation: Orientation.E})
    positions.set('third', {x:3, y:1, orientation: Orientation.E})

    const movements = pf2.handleMovement(positions, dummy_evaluator)
    expect(movements.size).toBe(3)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first')).toBeDefined()
    expect(isAbsoluteMovement(movements.get('first'))).toBeTruthy()
    expect((movements.get('first')[0].movement as AbsoluteStep).direction).toBe(Orientation.N)
    expect((movements.get('first')[0].movement as AbsoluteStep).distance).toBe(1)
    expect(movements.has('second')).toBeTruthy()
    expect(movements.get('second')).toBeDefined()
    expect(isAbsoluteMovement(movements.get('second'))).toBeTruthy()
    expect((movements.get('second')[0].movement as AbsoluteStep).direction).toBe(Orientation.N)
    expect((movements.get('second')[0].movement as AbsoluteStep).distance).toBe(1)
    expect(movements.has('third')).toBeTruthy()
    expect(movements.get('third')).toBeUndefined()
})

test('MovementForest.handleMovement(pusher: 2 acting pushers)', () => {
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:1, y:1, orientation: Orientation.E})

    const movements = pf0.handleMovement(positions, dummy_evaluator)
    expect(movements.size).toBe(1)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first')).toBeUndefined()
})

test('MovementForest.handleMovement(pusher: mid-chain pusher)', () => {
    console.log('mid-chain pusher')
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:2, y:2, orientation: Orientation.S})
    positions.set('second', {x:3, y:2, orientation: Orientation.S})

    const movements = pf4.handleMovement(positions, dummy_evaluator)
    expect(movements.size).toBe(2)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first')).toBeUndefined()
    expect(movements.has('second')).toBeTruthy()
    expect(movements.get('second')).toBeUndefined()
})

test('MovementForest.handleMovement(pusher: moving past conflicted chain)', () => {
    const positions = new Map<string, OrientedPosition>()
    positions.set('first', {x:2, y:2, orientation: Orientation.S})
    positions.set('second', {x:3, y:2, orientation: Orientation.S})
    positions.set('third', {x: 1, y:1, orientation: Orientation.E})

    const movements = pf0.handleMovement(positions, dummy_evaluator)
    expect(movements.size).toBe(3)
    expect(movements.has('first')).toBeTruthy()
    expect(movements.get('first')).toBeUndefined()
    expect(movements.has('second')).toBeTruthy()
    expect(movements.get('second')).toBeUndefined()
    expect(movements.has('third')).toBeTruthy()
    expect(movements.get('third')).toBeUndefined()
})
