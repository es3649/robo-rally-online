/* default events emitted by the socket connection */
export namespace Default {
    export const DISCONNECT = "disconnect"
    export const CONNECTION = "connection"
}

/* events emitted by the player-clients */
export namespace Client2Server {
    export const JOIN_GAME = "client:join-game"
    export const LIST_BOTS = "client:list-bots"
    export const SELECT_BOTS = "client:select-bots"
    export const REQUEST_UPGRADE = "client:request-upgrade"
    export const ADD_UPGRADE = "client:add-upgrade"
    export const PROGRAM_SUBMIT = "client:program-submit"
    export const PROGRAM_SHUTDOWN = "client:program-shutdown"
    export const GET_ID = "client:get-id"
}
export type Client2Server = typeof Client2Server.JOIN_GAME |
    typeof Client2Server.LIST_BOTS |
    typeof Client2Server.SELECT_BOTS |
    typeof Client2Server.REQUEST_UPGRADE |
    typeof Client2Server.ADD_UPGRADE |
    typeof Client2Server.PROGRAM_SUBMIT |
    typeof Client2Server.PROGRAM_SHUTDOWN |
    typeof Client2Server.GET_ID

/* events emitted by the main desktop process */
// events sent back to server 
export namespace Main2Server {
    export const BOT_SELECTED = "main:bot-selected"
    export const GAME_ACTION = "main:game-action"
    export const PHASE_UPDATE = "main:phase-update"
    export const RESET = "main:reset"
}
export type Main2Server = typeof Main2Server.BOT_SELECTED |
    typeof Main2Server.GAME_ACTION |
    typeof Main2Server.PHASE_UPDATE |
    typeof Main2Server.RESET

// events sent to renderer
export namespace Main2Render {
    export const PLAYER_ADDED = "main:player-added"
    export const UPDATE_BOT_STATUS = "main:update-bot-status"
    export const UPDATE_BOT_CONNECTION = "main:update-bot-connection"
    export const GAME_ACTION = "main:game-action"
    export const GAME_ERROR = "main:game-error"
    export const UPDATE_PLAYER = "main:update-player"
}
export type Main2Render = typeof Main2Render.PLAYER_ADDED |
    typeof Main2Render.UPDATE_BOT_STATUS |
    typeof Main2Render.UPDATE_BOT_CONNECTION |
    typeof Main2Render.GAME_ACTION |
    typeof Main2Render.GAME_ERROR |
    typeof Main2Render.UPDATE_PLAYER

// events sent to bots
// technically writeable BLE characteristics
export namespace Main2Bot {
    export const PLAY_SOUND = "main:play-sound"
    export const STATE = "main:state"
    export const MOVE = "main:move"
}

// events sent to main from the bot
// technically readable BLE characteristics
export namespace Bot2Main {
    export const RFID = "bot:rfid"
}

/* events emitted by the server thread */
// sent to player client
export namespace Server2Client {
    export const PHASE_UPDATE = "server:phase-update"
    export const GAME_ACTION = "server:game-action"
    export const BOT_SELECTED = "server:bot-selected"
    export const BOT_LIST = "server:bot-list"
    export const RESET = "server:reset"
}

// sent to main thread
export namespace Server2Main {
    export const ADD_PLAYER = "server:add-player"
    export const LIST_BOTS = "server:list-bots"
    export const SELECT_BOT = "server:select-bot"
    export const REQUEST_UPGRADE = "server:request-upgrade"
    export const ADD_UPGRADE = "server:add-upgrade"
    export const PROGRAM_SET = "server:program-set"
    export const PROGRAM_SHUTDOWN = "server:program-shutdown"
    export const PLAYER_DISCONNECTED = "server:player-disconnected"
}
export type Server2Main = typeof Server2Main.ADD_PLAYER |
    typeof Server2Main.LIST_BOTS |
    typeof Server2Main.SELECT_BOT |
    typeof Server2Main.REQUEST_UPGRADE |
    typeof Server2Main.ADD_UPGRADE |
    typeof Server2Main.PROGRAM_SET |
    typeof Server2Main.PROGRAM_SHUTDOWN |
    typeof Server2Main.PLAYER_DISCONNECTED

/* events emitted by the renderer */
export namespace Render2Main {
    export const BLE_CONNECT = "render:ble-connect"
    export const GET_IP = "render:get-ip"
    export const RESET = "render:reset"
    export namespace BOARD {
        export const LIST_BOARDS = "render:board:list-boards"
        export const LOAD_BOARD = "render:board:load-board"
        export const LOAD_SERIAL = "render:board:load-serial"
        // export const ROTATE = "render:board:rotate"
        // export const EXTEND = "render:board:extend"
        export const READY = "render:board:ready"
        // export const TOGGLE_CHECKPOINT = "render:board:toggle-checkpoint"
        // export const TOGGLE_RESPAWN = "render:board:toggle-respawn"
        // export const ROTATE_RESPAWN = "render:board:rotate-respawn"
    }
}