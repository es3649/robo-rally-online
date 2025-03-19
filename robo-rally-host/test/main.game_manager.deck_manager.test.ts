import { expect, test, jest } from '@jest/globals'
import { DeckManager } from '../src/main/game_manager/deck_manager'
import { newStandardDeck, PROGRAMMING_HAND_SIZE, ProgrammingCard, RegisterArray } from '../src/shared/models/game_data'
import { Orientation } from '../src/shared/models/movement'

test('DeckManager.constructor', () => {
    Math.random = jest.fn<() => number>(() => 0)
    const d = new DeckManager()
    const standard = newStandardDeck()

    for (let i = 0; i < standard.length; i++) {
        const card = d.draw()
        // the effect of the initial shuffle is to move all the cards forward by one index
        // HOWEVER, we draw by popping (probably more efficient), so read backward from the standard deck
        const compare = standard[(20-i)%standard.length]
        console.log(i, card, compare)
        expect(card).toBeDefined()
        expect(card.id).toEqual(compare.id)
        expect(card.action).toEqual(compare.action)
    }
    
})

test('DeckManager.draw/discard', () => {
    const d = new DeckManager([{
        id: 0,
        action: ProgrammingCard.forward1
    },{
        id: 1,
        action: ProgrammingCard.again
    }])

    // these will be shuffled, let's just make sure that we don't get the same card twice in a row
    const card1 = d.draw()
    const card2 = d.draw()
    expect(card1).toBeDefined()
    expect(card2).toBeDefined()
    expect(card1.id === card2.id).toBeFalsy()
    expect(card1.action === card2.action).toBeFalsy()

    // when it's empty we should get an error when it tries to pop from the top
    expect(d.draw()).toBeUndefined()

    // return a card to the discard
    d.discard(card1)

    const card3 = d.draw()
    // this should check not that they are equal, but that they are the SAME OBJECT, which should be true
    expect(card3).toBe(card1)
})

test('DeckManager.drawHand', () => {
    Math.random = jest.fn<() => number>(() => 0 )
    const spam_counter_reducer = (prev: number, cur: ProgrammingCard, idx: number, arr: ProgrammingCard[]) => {
        if (cur.action === ProgrammingCard.spam) {
            return prev + 1
        }
        return prev
    }
    const d = new DeckManager([{
        id: 12,
        action: ProgrammingCard.spam
    },{
        id: 0,
        action: ProgrammingCard.spam
    },{
        id: 1,
        action: ProgrammingCard.spam
    },{
        id: 2,
        action: ProgrammingCard.spam
    },{
        id: 3,
        action: ProgrammingCard.forward1
    },{
        id: 4,
        action: ProgrammingCard.forward1
    },{
        id: 5,
        action: ProgrammingCard.forward1
    },{
        id: 6,
        action: ProgrammingCard.forward1
    },{
        id: 7,
        action: ProgrammingCard.forward1
    },{
        id: 8,
        action: ProgrammingCard.forward1
    },{
        id: 9,
        action: ProgrammingCard.spam
    },{
        id: 10,
        action: ProgrammingCard.spam
    },{
        id: 11,
        action: ProgrammingCard.spam
    }])

    d.drawHand()
    const hand = d.getHand()
    expect(hand).toBeDefined()
    expect(hand.length).toBe(PROGRAMMING_HAND_SIZE)
    const hand_spams = hand.reduce<number>(spam_counter_reducer, 0)
    // it will draw the 4 spams which will be AT THE bACK of the array (draw by popping)
    expect(hand_spams).toBe(4)
    
    // getting the hand again should get the same result
    const hand_again = d.getHand()
    expect(hand_again).toBeDefined()
    expect(hand_again.length).toBe(PROGRAMMING_HAND_SIZE)
    
    for (let i = 0; i < hand.length; i++) {
        // same object should be reasonable here
        expect(hand_again[i]).toBe(hand[i])
    }
    
    // draw a new one, the remaining 4 spams should be drawn, and the previous 3 should not be discarded
    d.drawHand()
    const hand2 = d.getHand()
    expect(hand2).toBeDefined()
    expect(hand2.length).toBe(PROGRAMMING_HAND_SIZE)

    // count the spams
    const hand2_spams = hand2.reduce<number>(spam_counter_reducer, 0)
    expect(hand2_spams).toBe(7)
})

test('DeckManager.clearProgram', () => {
    const d = new DeckManager([])

    // dump a program into the manager
    const program: RegisterArray = [
        [{id: 0, action: ProgrammingCard.spam}],
        [{id: 1, action: ProgrammingCard.forward1}, {id: 2, action: ProgrammingCard.right}],
        [{id: 3, action: ProgrammingCard.right}],
        [{id: 4, action: {text: "Haywire ex", actions: [{direction: Orientation.N, distance: 3}]}}],
        []
    ]
    const damages = d.clearProgram(program)

    expect(damages).toBeDefined()
    // the haywire and the spam
    expect(damages.length).toBe(2)

    const damage_ids = new Set<number>()
    damages.forEach((item: ProgrammingCard) => {
        damage_ids.add(item.id)
    })
    expect(damage_ids.has(0)).toBeTruthy()
    expect(damage_ids.has(4)).toBeTruthy()

    // draw the other cards from the deck
    const other_ids = new Set<number>()
    
    // we expect 3 cards here
    const card1 = d.draw()
    expect(card1).toBeDefined()
    other_ids.add(card1.id)
    const card2 = d.draw()
    expect(card2).toBeDefined()
    other_ids.add(card2.id)
    const card3 = d.draw()
    expect(card3).toBeDefined()
    other_ids.add(card3.id)

    expect(other_ids.size).toBe(3)
    expect(other_ids.has(1)).toBeTruthy()
    expect(other_ids.has(2)).toBeTruthy()
    expect(other_ids.has(3)).toBeTruthy()

    
})

test('DeckManager.clearProgram (illegal program)', () => {
    const d = new DeckManager([])

    // make another test with some arrangements that shouldn't happen, just to be safe
    const program: RegisterArray = [
        [{id: 0, action: ProgrammingCard.spam}, {id: 4, action: ProgrammingCard.forward3}],
        [{id: 1, action: ProgrammingCard.forward1}, {id: 2, action: ProgrammingCard.right}],
        [],
        [],
        [{id: 3, action: ProgrammingCard.right}, {id: 5, action: ProgrammingCard.spam}]
    ]
    const damages = d.clearProgram(program)

    expect(damages).toBeDefined()
    // the haywire and the spam
    expect(damages.length).toBe(2)

    const damage_ids = new Set<number>()
    damages.forEach((item: ProgrammingCard) => {
        damage_ids.add(item.id)
    })
    expect(damage_ids.has(0)).toBeTruthy()
    expect(damage_ids.has(5)).toBeTruthy()

    // draw the other cards from the deck
    const other_ids = new Set<number>()
    
    // we expect 3 cards here
    const card1 = d.draw()
    expect(card1).toBeDefined()
    other_ids.add(card1.id)
    const card2 = d.draw()
    expect(card2).toBeDefined()
    other_ids.add(card2.id)
    const card3 = d.draw()
    expect(card3).toBeDefined()
    other_ids.add(card3.id)
    const card4 = d.draw()
    expect(card4).toBeDefined()
    other_ids.add(card4.id)

    expect(other_ids.size).toBe(4)
    expect(other_ids.has(1)).toBeTruthy()
    expect(other_ids.has(2)).toBeTruthy()
    expect(other_ids.has(3)).toBeTruthy()
    expect(other_ids.has(4)).toBeTruthy()

    
})

