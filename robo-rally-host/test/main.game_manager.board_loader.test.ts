import { expect, test } from '@jest/globals'
import { listBoards, loadFromJson } from '../src/main/game_manager/board_loader'

test('listBoards', () => {
    const boards = listBoards()
    
    // test boards must not appear
    for (const board of boards) {
        expect(board.startsWith('test.')).toBeFalsy()
    }
    
    // here are some boards we'll assume are required
    expect(boards.includes('pushy.json')).toBeTruthy()
    expect(boards.includes('in-and-out.json')).toBeTruthy()
    expect(boards.includes('docking-bay-a.json')).toBeTruthy()
    expect(boards.includes('the_keep.json')).toBeTruthy()
    expect(boards.includes('party.json')).toBeTruthy()
})

test('loadFromJson', async () => {
    // Bad filenames shouldn't work
    expect(loadFromJson('')).toThrow()
    expect(loadFromJson('ur_mom')).toThrow()

    // incorrect boards shouldn't load
    expect(loadFromJson('test.empty.json')).toThrow()
    expect(loadFromJson('test.illegal_spaces.json')).toThrow()
    expect(loadFromJson('test.illegal_walls.json')).toThrow()


    expect(await loadFromJson('pushy.json')).toBeDefined()
    expect(await loadFromJson('in-and-out.json')).toBeDefined()
    expect(await loadFromJson('docking-bay-a.json')).toBeDefined()
    expect(await loadFromJson('the_keep.json')).toBeDefined()
    expect(await loadFromJson('party.json')).toBeDefined()
})