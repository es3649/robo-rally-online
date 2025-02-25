import { expect, test, jest } from '@jest/globals'
import { listBoards, loadFromJson, loadFromSerial } from '../src/main/game_manager/board_loader'

jest.mock('node:original-fs')

test('listBoards', () => {
    const boards = listBoards()
    
    // test boards must not appear
    for (const board of boards) {
        expect(board.startsWith('test.')).toBeFalsy()
    }
    
    // here are some boards we'll assume are required
    expect(boards.includes('pushy.json')).toBeTruthy()
    expect(boards.includes('in_and_out.json')).toBeTruthy()
    expect(boards.includes('docking_bay_a.json')).toBeTruthy()
    expect(boards.includes('the_keep.json')).toBeTruthy()
    expect(boards.includes('party.json')).toBeTruthy()
})

test('loadFromJson', async () => {
    // Bad filenames shouldn't work
    await expect(loadFromJson('')).rejects.toThrow()
    await expect(loadFromJson('ur_mom')).rejects.toThrow()

    // incorrect boards shouldn't load
    await expect(loadFromJson('test.empty.json')).rejects.toThrow()
    await expect(loadFromJson('test.illegal_spaces.json')).rejects.toThrow()
    await expect(loadFromJson('test.illegal_walls.json')).rejects.toThrow()

    // required boards should load
    // correctness determined more in the Board class tests
    // JSON reader can be assumed to function
    expect(await loadFromJson('pushy.json')).toBeDefined()
    expect(await loadFromJson('in_and_out.json')).toBeDefined()
    expect(await loadFromJson('docking_bay_a.json')).toBeDefined()
    expect(await loadFromJson('the_keep.json')).toBeDefined()
    // expect(await loadFromJson('party')).toBeDefined()
})

test('loadSerial', async () => {
    // not implemented, should throw
    await expect(loadFromSerial()).rejects.toThrow()
})