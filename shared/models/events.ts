/* default events emitted by the socket connection */
export namespace Default {
    export const DISCONNECT = "disconnect"
    export const CONNECTION = "connection"
}

/* events emitted by the player-clients */
export namespace Client2Server {
    export const JOIN_GAME = "client:join-game"
    export const LEAVE_GAME = "client:leave-game"
    export const LIST_BOTS = "client:list-bots"
    export const LIST_AVAILABLE_BOTS = "client:list-available-bots"
    export const SELECT_BOT = "client:select-bot"
    // export const REQUEST_UPGRADE = "client:request-upgrade"
    // export const ADD_UPGRADE = "client:add-upgrade"
    // export const USE_UPGRADE = "client:use-upgrade"
    export const PROGRAM_SUBMIT = "client:program-submit"
    export const GET_ID = "client:get-id"
    export const USE_ID = "client:use-id"
    export const CONFIRM_POSITION = "client:confirm-position"
    export const SEND_INPUT = "client:send-input"
    export const GET_PROGRAMMING_DATA = "client:get-programming-data"
    export const GET_PLAYER_STATES = "client:get-player-states"
}
export type Client2Server = typeof Client2Server.JOIN_GAME |
    typeof Client2Server.LEAVE_GAME |
    typeof Client2Server.LIST_BOTS |
    typeof Client2Server.LIST_AVAILABLE_BOTS |
    typeof Client2Server.SELECT_BOT |
    // typeof Client2Server.REQUEST_UPGRADE |
    // typeof Client2Server.ADD_UPGRADE |
    // typeof Client2Server.USE_UPGRADE |
    typeof Client2Server.PROGRAM_SUBMIT |
    typeof Client2Server.GET_ID |
    typeof Client2Server.USE_ID |
    typeof Client2Server.CONFIRM_POSITION |
    typeof Client2Server.SEND_INPUT |
    typeof Client2Server.GET_PROGRAMMING_DATA |
    typeof Client2Server.GET_PLAYER_STATES

/* events emitted by the main desktop process */
// events sent back to server 
export namespace Main2Server {
    export const GAME_ACTION = "main:game-action"
    export const PHASE_UPDATE = "main:phase-update"
    export const RESET = "main:reset"
    export const REQUEST_POSITION = "main:request-position"
    export const GET_INPUT = "main:get-input"
    export const UPDATE_BOT_CONNECTION = "main:update-bot-connection"
    export const UPDATE_PLAYER_STATES = "main:update-player-states"
    export const PROGRAMMING_DATA = "main:programming-data"
    export const GAME_OVER = "main:game-over"
}
export type Main2Server = typeof Main2Server.GAME_ACTION |
    typeof Main2Server.PHASE_UPDATE |
    typeof Main2Server.RESET |
    typeof Main2Server.REQUEST_POSITION |
    typeof Main2Server.GET_INPUT |
    typeof Main2Server.UPDATE_BOT_CONNECTION |
    typeof Main2Server.UPDATE_PLAYER_STATES |
    typeof Main2Server.PROGRAMMING_DATA |
    typeof Main2Server.GAME_OVER

// events sent to renderer
export namespace Main2Render {
    export const PLAYER_ADDED = "main:player-added"
    export const UPDATE_BOT_ACTIVE = "main:update-bot-active"
    export const UPDATE_BOT_CONNECTION = Main2Server.UPDATE_BOT_CONNECTION
    export const GAME_ACTION = Main2Server.GAME_ACTION
    export const GAME_ERROR = "main:game-error"
    export const UPDATE_PLAYER = "main:update-player"
    export const GET_INFO_NOTIFICATION = "main:get-info-notification"
    export const READY_STATUS = "main:ready-notification"
    export const UPDATE_PLAYER_STATE = Main2Server.UPDATE_PLAYER_STATES
    export const UPDATE_GAME_PHASE = "main:update-game-state"
    export const GAME_OVER = Main2Server.GAME_OVER
}
export type Main2Render = typeof Main2Render.PLAYER_ADDED |
    typeof Main2Render.UPDATE_BOT_ACTIVE |
    typeof Main2Render.UPDATE_BOT_CONNECTION |
    typeof Main2Render.GAME_ACTION |
    typeof Main2Render.GAME_ERROR |
    typeof Main2Render.UPDATE_PLAYER |
    typeof Main2Render.GET_INFO_NOTIFICATION |
    typeof Main2Render.READY_STATUS |
    typeof Main2Render.UPDATE_PLAYER_STATE |
    typeof Main2Render.UPDATE_GAME_PHASE |
    typeof Main2Render.GAME_OVER

/* events emitted by the server thread */
// sent to player client
export namespace Server2Client {
    export const PHASE_UPDATE = "server:phase-update"
    export const GAME_ACTION = "server:game-action"
    export const BOT_SELECTED = "server:bot-selected"
    export const BOT_LIST = "server:bot-list"
    export const RESET = "server:reset"
    export const UPDATE_PLAYER_STATES = "server:update-player-states"
    export const REQUEST_POSITION = "server:request-position"
    export const REQUEST_INPUT = "server:request-input"
    export const GAME_OVER = "server:game-over"
}

// sent to main thread
export namespace Server2Main {
    export const ADD_PLAYER = "server:add-player"
    export const SELECT_BOT = "server:select-bot"
    // export const REQUEST_UPGRADE = "server:request-upgrade"
    // export const ADD_UPGRADE = "server:add-upgrade"
    // export const USE_UPGRADE = "server:use-upgrade"
    export const PROGRAM_SET = "server:program-set"
    export const PROGRAM_SHUTDOWN = "server:program-shutdown"
    export const PLAYER_DISCONNECTED = "server:player-disconnected"
    export const CONFIRM_POSITION = "server:confirm-position"
    export const SEND_INPUT = "server:send-input"
}
export type Server2Main = typeof Server2Main.ADD_PLAYER |
    typeof Server2Main.SELECT_BOT |
    // typeof Server2Main.REQUEST_UPGRADE |
    // typeof Server2Main.ADD_UPGRADE |
    // typeof Server2Main.USE_UPGRADE |
    typeof Server2Main.PROGRAM_SET |
    typeof Server2Main.PROGRAM_SHUTDOWN |
    typeof Server2Main.PLAYER_DISCONNECTED |
    typeof Server2Main.CONFIRM_POSITION |
    typeof Server2Main.SEND_INPUT

/* events emitted by the renderer */
export namespace Render2Main {
    export const BLE_CONNECT = "render:ble-connect"
    export const GET_BOT_STATUS = "render:get-bot-status"
    export const GET_IP = "render:get-ip"
    export const RESET = "render:reset"
    export const START_GAME = "render:start-game"
    export const GET_READY_STATUS = "render:get-ready-status"
    export namespace BOARD {
        export const LIST_BOARDS = "render:board:list-boards"
        export const LOAD_BOARD = "render:board:load-board"
        export const LOAD_SERIAL = "render:board:load-serial"
        // export const ROTATE = "render:board:rotate"
        // export const EXTEND = "render:board:extend"
        // export const READY = "render:board:ready"
        // export const TOGGLE_CHECKPOINT = "render:board:toggle-checkpoint"
        // export const TOGGLE_RESPAWN = "render:board:toggle-respawn"
        // export const ROTATE_RESPAWN = "render:board:rotate-respawn"
    }
}