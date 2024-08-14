import { isValidBoardData, Board, type BoardData } from "./board";
import { readFile } from 'fs/promises'
import * as path from 'node:path'

/**
 * loads a board with the given name. there must be  file called ${name}.json in the
 * resources/boards folder for this to work.
 * @param name the name of the board to load
 * @returns the board which we loaded from the JSON file
 * @throws an error if the file does not exist, does not contain valid JSON, or does not
 * contain properly formatted board data
 */
export async function loadFromJson(name:string): Promise<Board> {
    const file = await readFile(path.join('res://boards', name+'.json'))
    const raw = JSON.parse(file.toString())

    // validate the unsanitary json data
    if (isValidBoardData(raw)) {
        return new Board(raw)
    }

    throw new Error("File does not include valid board data")
}

/**
 * Loads board data from a serial device. the interface and API for this process is not yet
 * defined, so this function should not be used yet.
 * @returns board data loaded from a serial port
 */
export async function loadFromSerial(): Promise<any> {
    return {}
}

const BOARD_PATH = ''

export function listBoards(): string[] {
    console.log('which boards?')
    return [
        "the_keep",
        "pushy",
        "in_and_out",
        "manual_list"
    ]
}