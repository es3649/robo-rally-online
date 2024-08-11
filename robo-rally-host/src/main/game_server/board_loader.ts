import type { Board, BoardData } from "./board";

export function loadFromJson(file:string): any {
    return {}
}

export function loadFromSerial(): any {
    return {}
}

const BOARD_PATH = ''

export function listBoards(): string[] {
    console.log('which boards?')
    return [
        "the_keep",
        "pushy",
        "in_and_out"
    ]
}