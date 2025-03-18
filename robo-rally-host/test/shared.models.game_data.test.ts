import { anyRegisterEmpty, newDamageDeck, newRegisterArray, newStandardDeck, ProgrammingCard, type RegisterArray } from '../src/shared/models/game_data'
import { isRelativeMovement, isRotation, Movement, MovementDirection, Rotation, RotationDirection, type RelativeMovement } from '../src/shared/models/movement'
import { expect, jest, test } from '@jest/globals'

test('ProgrammingCard.isActionChoice/isHaywire', () => {
    const h1: ProgrammingCard.Haywire = {
        text: "Test Haywire 1",
        actions: [
            new Rotation(RotationDirection.CCW, 1),
            { direction: MovementDirection.Forward, distance: 5}
        ]
    }

    const h2: ProgrammingCard.Haywire = {
        text: "Test Haywire 2",
        actions: {
            options: ['a', 'b'],
            prompt: "These are your options",
            choice: (options:string): Movement[] => []
        },
        special: () => "ur mom"
    }

    // true for legit haywire
    expect(ProgrammingCard.isHaywire(h1)).toBeTruthy()
    expect(ProgrammingCard.isHaywire(h2)).toBeTruthy()

    // false for basic types
    expect(ProgrammingCard.isHaywire(ProgrammingCard.forward1)).toBeFalsy()
    expect(ProgrammingCard.isHaywire(ProgrammingCard.forward2)).toBeFalsy()
    expect(ProgrammingCard.isHaywire(ProgrammingCard.forward3)).toBeFalsy()
    expect(ProgrammingCard.isHaywire(ProgrammingCard.back)).toBeFalsy()
    expect(ProgrammingCard.isHaywire(ProgrammingCard.left)).toBeFalsy()
    expect(ProgrammingCard.isHaywire(ProgrammingCard.right)).toBeFalsy()
    expect(ProgrammingCard.isHaywire(ProgrammingCard.u_turn)).toBeFalsy()
    expect(ProgrammingCard.isHaywire(ProgrammingCard.power_up)).toBeFalsy()
    expect(ProgrammingCard.isHaywire(ProgrammingCard.again)).toBeFalsy()
    expect(ProgrammingCard.isHaywire(ProgrammingCard.spam)).toBeFalsy()
    expect(ProgrammingCard.isHaywire(undefined)).toBeFalsy()

    // test is action choice
    expect(ProgrammingCard.isActionChoice(h1.actions)).toBeFalsy()
    expect(ProgrammingCard.isActionChoice(h2.actions)).toBeTruthy()
})

test('ProgrammingCard.isTurn', () => {
    // should be true for the turns
    expect(ProgrammingCard.isTurn(ProgrammingCard.left)).toBeTruthy()
    expect(ProgrammingCard.isTurn(ProgrammingCard.right)).toBeTruthy()
    expect(ProgrammingCard.isTurn(ProgrammingCard.u_turn)).toBeTruthy()

    // should be false for movements
    expect(ProgrammingCard.isTurn(ProgrammingCard.forward1)).toBeFalsy()
    expect(ProgrammingCard.isTurn(ProgrammingCard.forward2)).toBeFalsy()
    expect(ProgrammingCard.isTurn(ProgrammingCard.forward3)).toBeFalsy()
    expect(ProgrammingCard.isTurn(ProgrammingCard.back)).toBeFalsy()

    // false for specials
    expect(ProgrammingCard.isTurn(ProgrammingCard.again)).toBeFalsy()
    expect(ProgrammingCard.isTurn(ProgrammingCard.power_up)).toBeFalsy()
    expect(ProgrammingCard.isTurn(ProgrammingCard.spam)).toBeFalsy()

    // false for haywire
    expect(ProgrammingCard.isTurn({
        text: "Test Haywire",
        actions: []
    })).toBeFalsy()
})

test('ProgrammingCard.isMovement', () => {
    // should be false for the turns
    expect(ProgrammingCard.isMovement(ProgrammingCard.left)).toBeFalsy()
    expect(ProgrammingCard.isMovement(ProgrammingCard.right)).toBeFalsy()
    expect(ProgrammingCard.isMovement(ProgrammingCard.u_turn)).toBeFalsy()

    // should be true for movements
    expect(ProgrammingCard.isMovement(ProgrammingCard.forward1)).toBeTruthy()
    expect(ProgrammingCard.isMovement(ProgrammingCard.forward2)).toBeTruthy()
    expect(ProgrammingCard.isMovement(ProgrammingCard.forward3)).toBeTruthy()
    expect(ProgrammingCard.isMovement(ProgrammingCard.back)).toBeTruthy()

    // false for specials
    expect(ProgrammingCard.isMovement(ProgrammingCard.again)).toBeFalsy()
    expect(ProgrammingCard.isMovement(ProgrammingCard.power_up)).toBeFalsy()
    expect(ProgrammingCard.isMovement(ProgrammingCard.spam)).toBeFalsy()

    // false for haywire
    expect(ProgrammingCard.isMovement({
        text: "Test Haywire",
        actions: []
    })).toBeFalsy()
})

test('ProgrammingCard.toMovement', () => {
    // these should all be relative movements
    let f1_mv = ProgrammingCard.toMovement({ action: ProgrammingCard.forward1, id: 0})
    expect(f1_mv).toBeDefined()
    expect(isRelativeMovement(f1_mv)).toBeTruthy()
    f1_mv = f1_mv as RelativeMovement
    expect(f1_mv.direction).toBe(MovementDirection.Forward)
    expect(f1_mv.distance).toBe(1)

    let f2_mv = ProgrammingCard.toMovement({ action: ProgrammingCard.forward2, id: 0})
    expect(f2_mv).toBeDefined()
    expect(isRelativeMovement(f2_mv)).toBeTruthy()
    f2_mv = f2_mv as RelativeMovement
    expect(f2_mv.direction).toBe(MovementDirection.Forward)
    expect(f2_mv.distance).toBe(2)

    let f3_mv = ProgrammingCard.toMovement({ action: ProgrammingCard.forward3, id: 0})
    expect(f3_mv).toBeDefined()
    expect(isRelativeMovement(f3_mv)).toBeTruthy()
    f3_mv = f3_mv as RelativeMovement
    expect(f3_mv.direction).toBe(MovementDirection.Forward)
    expect(f3_mv.distance).toBe(3)

    let bk_mv = ProgrammingCard.toMovement({ action: ProgrammingCard.back, id: 0})
    expect(bk_mv).toBeDefined()
    expect(isRelativeMovement(bk_mv)).toBeTruthy()
    bk_mv = bk_mv as RelativeMovement
    expect(bk_mv.direction).toBe(MovementDirection.Back)
    expect(bk_mv.distance).toBe(1)

    // check that turns are rotations
    let rt_mv = ProgrammingCard.toMovement({ action: ProgrammingCard.right, id: 0})
    expect(rt_mv).toBeDefined()
    expect(isRotation(rt_mv)).toBeTruthy()
    rt_mv = rt_mv as Rotation
    expect(rt_mv.direction).toBe(RotationDirection.CW)
    expect(rt_mv.units).toBe(1)

    let lf_mv = ProgrammingCard.toMovement({ action: ProgrammingCard.left, id: 0})
    expect(lf_mv).toBeDefined()
    expect(isRotation(lf_mv)).toBeTruthy()
    lf_mv = lf_mv as Rotation
    expect(lf_mv.direction).toBe(RotationDirection.CCW)
    expect(lf_mv.units).toBe(1)
    
    let ut_mv = ProgrammingCard.toMovement({ action: ProgrammingCard.u_turn, id: 0})
    expect(ut_mv).toBeDefined()
    expect(isRotation(ut_mv)).toBeTruthy()
    ut_mv = ut_mv as Rotation
    expect(ut_mv.units).toBe(2)

    // specials have no movement
    let pu_mv = ProgrammingCard.toMovement({ action: ProgrammingCard.power_up, id: 0})
    expect(pu_mv).toBeUndefined()

    let ag_mv = ProgrammingCard.toMovement({ action: ProgrammingCard.again, id: 0})
    expect(ag_mv).toBeUndefined()

    let sp_mv = ProgrammingCard.toMovement({ action: ProgrammingCard.spam, id: 0})
    expect(sp_mv).toBeUndefined()

    let hw_mv = ProgrammingCard.toMovement({ action: { text: "test haywire", actions: [new Rotation(RotationDirection.CCW, 1)]}, id: 0})
    expect(hw_mv).toBeUndefined()
})

test('newStandardDeck', () => {
    const deck = newStandardDeck()

    const IDs = new Set<number>()
    for (const card of deck) {
        IDs.add(card.id)
        // make sure this is not a damage card
        expect(card.action == ProgrammingCard.spam).toBeFalsy()
        expect(ProgrammingCard.isHaywire(card.action)).toBeFalsy()
    }

    // make sure there are 20 cards with unique IDs
    expect(deck.length).toBe(20)
    expect(IDs.size).toBe(deck.length)
})

test('newDamageDeck', () => {
    const deck = newDamageDeck()

    const IDs = new Set<number>()
    for (const card of deck) {
        IDs.add(card.id)
        // check that this is a damage card
        const damageType = ProgrammingCard.isHaywire(card.action) || card.action == ProgrammingCard.spam
        expect(damageType).toBeTruthy()
    }

    // make sure there are 40 cards with unique IDs
    expect(deck.length).toBe(40)
    expect(IDs.size).toBe(deck.length)
})

test('newRegisterArray', () => {
    const the_array = newRegisterArray()

    expect(the_array.length).toBe(5)

    for (let i = 0; i < 5; i++) {
        expect(the_array[i]).toBeInstanceOf(Array)
        expect(the_array[i].length).toBe(0)
    }
})

test('anyRegisterEmpty', () => {
    const c1: ProgrammingCard = {
        action: ProgrammingCard.forward1,
        id: 0
    }
    const c2: ProgrammingCard = {
        action: ProgrammingCard.again,
        id: 1
    }

    const h1: ProgrammingCard = {
        action: {
            text: "test haywire",
            actions: [new Rotation(RotationDirection.CW, 1)]
        },
        id: 2
    }

    const R1: RegisterArray = [[c1], [c2], [h1], [], []]
    const R2: RegisterArray = [[],[],[],[],[]]
    const R3: RegisterArray = [[c1],[c2],[c1],[h1],[c2]]
    const R4: RegisterArray = [[],[c1],[c2],[h1],[c2]]
    const R5: RegisterArray = [[c2],[c1],[],[h1],[c2]]

    expect(anyRegisterEmpty(R1)).toBeTruthy()
    expect(anyRegisterEmpty(R2)).toBeTruthy()
    expect(anyRegisterEmpty(R3)).toBeFalsy()
    expect(anyRegisterEmpty(R4)).toBeTruthy()
    expect(anyRegisterEmpty(R5)).toBeTruthy()
})
