import { Robots } from "../src/main/data/robots"
import { Board, BoardData } from "../src/main/game_manager/board"
import { GameInitializer } from "../src/main/game_manager/initializers"
import { senderMaker } from "../src/main/models/connection"

const trivial_board: BoardData = {
    spaces: [],
    walls: {
        horizontal_walls: [],
        vertical_walls: [],
    },
    x_dim: 0,
    y_dim: 0,
    display_name: "Empty"
}

test('GameInitializer.addPlayer', () => {
    // construct the gm
    const gi = new GameInitializer()

    // add players until we can't
    expect(gi.addPlayer('Matthew', '001')).toBeTruthy()
    expect(gi.addPlayer('James', '001')).toBeFalsy()
    expect(gi.addPlayer('Mark', '002')).toBeTruthy()
    expect(gi.addPlayer('Luke', '003')).toBeTruthy()
    expect(gi.addPlayer('John', '004')).toBeTruthy()
    expect(gi.addPlayer('Paul', '005')).toBeTruthy()
    // using the same name again should be fine
    expect(gi.addPlayer('Paul', '006')).toBeTruthy()
    // this should be the 7th player, so we should get false by overflow check
    expect(gi.addPlayer('James', '007')).toBeFalsy()

    // we should not be able to overwrite a player using the same ID
    expect(gi.addPlayer('James', '001')).toBeFalsy()
})

test('GameInitializer.todo', () => {
    const gi = new GameInitializer()
    const todo1 = gi.todo()
    // only general TODOs
    expect(todo1.size).toBe(1)
    expect(todo1.get('General')).toBeDefined()
    expect(todo1.get('General').length).toBe(2)
    
    gi.board = new Board(trivial_board)

    // insufficient players
    const todo2 = gi.todo()
    expect(todo2.size).toBe(1)
    expect(todo2.get('General')).toBeDefined()
    expect(todo2.get('General').length).toBe(1)
    
    gi.addPlayer('Richard', 'wotc1234')
    gi.addPlayer('Chris', 'hems1234')
    const todo3 = gi.todo()
    // one TODO for each player
    expect(todo3.size).toBe(2)
    expect(todo3.get('wotc1234')).toBeDefined()
    expect(todo3.get('wotc1234').length).toBe(1)
    expect(todo3.get('hems1234')).toBeDefined()
    expect(todo3.get('hems1234').length).toBe(1)

    // only one player with errors
    gi.setCharacter('wotc1234', Robots.Twonky.id)
    const todo4 = gi.todo()
    expect(todo4.size).toBe(1)
    expect(todo4.has('wotc1234')).toBeFalsy()
    expect(todo4.get('hems1234')).toBeDefined()
    expect(todo4.get('hems1234').length).toBe(1)

    // clean it up
    gi.setCharacter('hems1234', Robots.Thor.id)
    const todo5 = gi.todo()
    console.log(todo5)
    expect(todo5.size).toBe(0)

    gi.board = undefined
    gi.addPlayer('Ken', 'miles1234')
    const todo6 = gi.todo()
    expect(todo6.size).toBe(2)
    expect(todo6.has('General')).toBeTruthy()
    expect(todo6.has('miles1234')).toBeTruthy()
})

test('GameInitializer.setCharacter', () => {
    const gi = new GameInitializer()

    gi.addPlayer('Richard', 'wotc1234')
    expect(gi.setCharacter('wotc1234', Robots.Twonky.id)).toBeTruthy()
    expect(gi.players.get('wotc1234')).toBeDefined()
    expect(gi.players.get('wotc1234').character.id).toBe(Robots.Twonky.id)
    
    // Chris doesn't exist yet, so this should be no good
    expect(gi.setCharacter('Chris', Robots.Thor.id)).toBeFalsy()
    
    gi.addPlayer('Chris', 'hems1234')
    // Twonky is in use, so this should be disallowed
    expect(gi.setCharacter('Chris', Robots.Twonky.id)).toBeFalsy()
    
    expect(gi.setCharacter('wotc1234', Robots.ZephyrM2.id)).toBeTruthy()
    expect(gi.players.get('wotc1234')).toBeDefined()
    expect(gi.players.get('wotc1234').character.id).toBe(Robots.ZephyrM2.id)

    expect(gi.setCharacter('hems1234', Robots.Twonky.id)).toBeTruthy()
    expect(gi.players.get('hems1234')).toBeDefined()
    expect(gi.players.get('hems1234').character.id).toBe(Robots.Twonky.id)
})

test('GameInitializer.ready', () => {
    const gi = new GameInitializer()

    expect(gi.ready()).toBeFalsy()
    gi.board = new Board(trivial_board)
    expect(gi.ready()).toBeFalsy()
    
    gi.addPlayer('Richard', 'wotc1234')
    gi.setCharacter('wotc1234', Robots.Twonky.id)
    // not enough players
    expect(gi.ready()).toBeFalsy()

    gi.addPlayer('Ken', 'miles1234')
    // enough players, but Ken doesn't have a character
    expect(gi.ready()).toBeFalsy()

    gi.setCharacter('miles1234', Robots.AxelV8.id)
    expect(gi.ready()).toBeTruthy()
    
    // rebuild it, but add characters first and leave the board off
    const gi2 = new GameInitializer()
    gi2.addPlayer('Richard', 'wotc1234')
    gi2.setCharacter('wotc1234', Robots.Twonky.id)
    gi2.addPlayer('Ken', 'miles1234')
    gi2.setCharacter('miles1234', Robots.AxelV8.id)
    expect(gi2.ready()).toBeFalsy()
    
    gi2.board = new Board(trivial_board)
    expect(gi2.ready()).toBeTruthy()
    
    gi2.addPlayer('Chris', 'hems1234')
    expect(gi2.ready()).toBeFalsy()
})

test('GameInitializer.getPlayers', () => {
    const gi = new GameInitializer()
    gi.board = new Board(trivial_board)
    // should initially be illegal
    expect(() => {gi.getPlayers()}).toThrow()
    
    // too few players
    gi.addPlayer('Richard', 'wotc1234')
    gi.setCharacter('wotc1234', Robots.Twonky.id)
    expect(() => {gi.getPlayers()}).toThrow()

    // incomplete player
    gi.addPlayer('Chris', 'hems1234')
    expect(() => {gi.getPlayers()}).toThrow()
    
    gi.setCharacter('hems1234', Robots.Thor.id)
    expect(gi.getPlayers()).toBeDefined()
    
    gi.addPlayer('Ken', 'miles1234')
    expect(() => {gi.getPlayers()}).toThrow()
    
    gi.setCharacter('miles1234', Robots.AxelV8.id)
    expect(gi.getPlayers()).toBeDefined()
    
    // should fail with no board, though this is odd behavior
    gi.board = undefined
    expect(() => {gi.getPlayers()}).toThrow()
})

test('GameInitializer.getBoard', () => {
    const gi = new GameInitializer()

    // there need to be at least 2 players for this to work
    gi.addPlayer('Richard', 'wotc1234')
    gi.addPlayer('Ken', 'miles1234')

    // if there's no board, it should fail
    expect(() => {gi.getBoard()}).toThrow()

    gi.board = new Board(trivial_board)

    // with a board, it should just return it
    expect(gi.getBoard()).toBeDefined()
})
