console.log('running server.js')
import express, { type Express } from 'express'
import { createServer } from 'http'
import { randomUUID } from 'crypto'
import { Server, Socket } from 'socket.io'
import { GamePhase, newRegisterArray, ProgrammingCard, type GameAction, type Program, type RegisterArray } from "./shared/models/game_data"
import { Client2Server, Default, Server2Main, Main2Server, Server2Client } from './shared/models/events'
import { PlayerStatusUpdate, type PlayerUpdate, senderMaker } from './shared/models/connection'
import type { ClientToServerEvents, ServerToClientEvents, SocketData, Main2ServerMessage, PendingActionChoice, ProgrammingData } from './shared/models/connection'
import type { EventsMap } from 'node_modules/socket.io/dist/typed-events'
import { GameInitializer } from './main/game_manager/initializers'
import type { PlayerID, Character, PlayerState, CharacterID, PlayerStateData } from './shared/models/player'
import { BOTS } from './shared/data/robots'
import { gameActionHandle, getInputHandle, phaseUpdateHandle, programmingDataHandle, requestPositionHandle, resetHandle, updatePlayerStatesHandle } from './server/m2s_handlers'
import { connections } from './server/data'
import { confirmPositionHandle, getPlayerStatesHandle, listAvailableBotsHandle, listBotsHandle, makeDisconnectHandle, makeGetIDHandle, makeGetProgrammingDataHandle, makeJoinGameHandle, makeProgramSubmitHandle, makeSelectBotHandle, makeUseIDHandle } from './server/c2s_handlers'

export const app: Express = express()
const port = process.env.PORT || 80
const server = createServer(app)
// we may need to reset the path here
// https://socket.io/docs/v4/server-options/#path
// const io = new Server<ClientToServerEvents, ServerToClientEvents>(server)
const io = new Server<ClientToServerEvents, ServerToClientEvents, EventsMap, SocketData>(server, {
    cors: {
        origin: "*"
    }
})

// add a file handler at the root
app.use(express.static('assets/public_html'))



// handle the connection event
io.on(Default.CONNECTION, (socket) => {
    console.log('a user connected')

    // generate a socket ID and store it
    const id = randomUUID()
    connections.set(id, socket)
    socket.data.id = id

    // connection events
    socket.on(Default.DISCONNECT, makeDisconnectHandle(socket))
    
    // lobby events
    socket.on(Client2Server.JOIN_GAME, makeJoinGameHandle(socket))

    // let the player get their ID
    socket.on(Client2Server.GET_ID, makeGetIDHandle(socket))

    socket.on(Client2Server.USE_ID, makeUseIDHandle(socket))

    // game events
    socket.on(Client2Server.LIST_BOTS, listBotsHandle)

    socket.on(Client2Server.LIST_AVAILABLE_BOTS, listAvailableBotsHandle)

    // character selection
    socket.on(Client2Server.SELECT_BOT, makeSelectBotHandle(io, socket))

    // when a program is submitted
    socket.on(Client2Server.PROGRAM_SUBMIT, makeProgramSubmitHandle(socket))

    socket.on(Client2Server.GET_PLAYER_STATES, getPlayerStatesHandle)

    socket.on(Client2Server.GET_PROGRAMMING_DATA, makeGetProgrammingDataHandle(socket))

    socket.on(Client2Server.CONFIRM_POSITION, confirmPositionHandle)

    // socket.on(Client2Server.REQUEST_UPGRADE, () => {console.log('client:request-upgrade is not implemented')})
    // socket.on(Client2Server.ADD_UPGRADE, () => {console.log('client:add-upgrade is not implemented')})
})

// determine which message was received, send it back
process.on('message', (message: Main2ServerMessage<any>) => {
    console.log("Received message:", message.name)
    switch (message.name) {
        case Main2Server.GAME_ACTION:
            gameActionHandle(io, message)
            break
        case Main2Server.PHASE_UPDATE:
            phaseUpdateHandle(io, message)
            break
        case Main2Server.RESET:
            resetHandle(io)
            break
        case Main2Server.GET_INPUT:
            getInputHandle(message)
            break
        case Main2Server.REQUEST_POSITION:
            requestPositionHandle(message as Main2ServerMessage<never>)
            break
        case Main2Server.UPDATE_PLAYER_STATES:
            updatePlayerStatesHandle(message)
            break
        case Main2Server.PROGRAMMING_DATA:
            programmingDataHandle(message)
            break
        default:
            console.error(`No handling for event: ${message.name}`)
    }
})

// listen and serve
server.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
