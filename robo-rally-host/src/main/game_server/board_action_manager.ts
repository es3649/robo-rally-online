// this is where things really get crazy

import type { Board } from "./board";

// we make bluetooth calls, wait for callbacks, Etm.

export declare interface BoardManager {
    load_board(board: Board): void
}