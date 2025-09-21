console.log('running server.js')
import express, { type Express } from 'express'
import fs from 'fs'
import { createServer } from 'http'
import { randomUUID } from 'crypto'
import { Server } from 'socket.io'
import { Client2Server, Default, Main2Server } from './shared/models/events'
import type { ClientToServerEvents, ServerToClientEvents, SocketData, Main2ServerMessage, M2SRequestPositionMessage } from './shared/models/connection'
import type { EventsMap } from 'node_modules/socket.io/dist/typed-events'
import * as m2s from './server/m2s_handlers'
import { connections } from './server/data'
import * as c2s from './server/c2s_handlers'

export const app: Express = express()
const port = process.env.PORT || 8199
const server = createServer(app)
// we may need to reset the path here
// https://socket.io/docs/v4/server-options/#path
// const io = new Server<ClientToServerEvents, ServerToClientEvents>(server)
const io = new Server<ClientToServerEvents, ServerToClientEvents, EventsMap, SocketData>(server, {
    cors: {
        origin: "*"
    }
})

// check that our assets exists
if (!fs.existsSync('assets/public_html/index.html')) {
    console.error("No files to serve in assets/public_html")
    throw new Error("Missing files to serve")
}

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
    socket.on(Default.DISCONNECT, c2s.makeDisconnectHandle(socket))
    
    // lobby events
    socket.on(Client2Server.JOIN_GAME, c2s.makeJoinGameHandle(socket))

    // let the player get their ID
    socket.on(Client2Server.GET_ID, c2s.makeGetIDHandle(socket))

    socket.on(Client2Server.USE_ID, c2s.makeUseIDHandle(socket))

    // game events
    socket.on(Client2Server.LIST_BOTS, c2s.listBotsHandle)

    socket.on(Client2Server.LIST_AVAILABLE_BOTS, c2s.listAvailableBotsHandle)

    // character selection
    socket.on(Client2Server.SELECT_BOT, c2s.makeSelectBotHandle(io, socket))

    // when a program is submitted
    socket.on(Client2Server.PROGRAM_SUBMIT, c2s.makeProgramSubmitHandle(socket))

    socket.on(Client2Server.GET_PLAYER_STATES, c2s.getPlayerStatesHandle)

    socket.on(Client2Server.GET_PROGRAMMING_DATA, c2s.makeGetProgrammingDataHandle(socket))

    socket.on(Client2Server.CONFIRM_POSITION, c2s.confirmPositionHandle)

    // socket.on(Client2Server.REQUEST_UPGRADE, () => {console.log('client:request-upgrade is not implemented')})
    // socket.on(Client2Server.ADD_UPGRADE, () => {console.log('client:add-upgrade is not implemented')})
})

// determine which message was received, send it back
process.on('message', (message: Main2ServerMessage) => {
    console.log("Received message:", message.name)
    switch (message.name) {
        case Main2Server.GAME_ACTION:
            m2s.gameActionHandle(io, message)
            break
        case Main2Server.UPDATE_PHASE:
            m2s.phaseUpdateHandle(io, message)
            break
        case Main2Server.RESET:
            m2s.resetHandle(io)
            break
        case Main2Server.GET_INPUT:
            m2s.getInputHandle(message)
            break
        case Main2Server.REQUEST_POSITION:
            m2s.requestPositionHandle(message as M2SRequestPositionMessage)
            break
        case Main2Server.UPDATE_PLAYER_STATES:
            m2s.updatePlayerStatesHandle(message)
            break
        case Main2Server.PROGRAMMING_DATA:
            m2s.programmingDataHandle(message)
            break
        case Main2Server.REMOVE_PLAYER:
            m2s.removePlayer(io, message)
            break
        default:
            console.error(`No handling for event: ${message.name}`)
    }
})

// listen and serve
server.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});
