import type { BotState } from "../bluetooth";
import type { PlayerID } from "../models/player";
import type { MovementFrame } from "./move_processors";

export interface ActionFrame {
    pre_action: any
    movement: MovementFrame,
    end_state: BotState
}

export interface MovementExecutor {
    executeMovements: (movements: Map<PlayerID, ActionFrame>) => void
    
}