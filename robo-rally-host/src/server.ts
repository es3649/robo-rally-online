console.log('running serverjs')
import express, { type Express } from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { joinHandler } from './main/server/handlers/join_handlers'
// import dotenv from 'dotenv'
import cors from 'cors'
// import { joinHandler } from './main/server/handlers/join_handlers'
// import { getRobotsHandler, selectRobotHandler } from './main/server/handlers/robot_handlers'

// import { ClientToServerEvents, ServerToClientEvents} from '../models/connection'

export const app: Express = express()
const port = process.env.PORT || 80
const server = createServer(app)
// we may need to reset the path here
// https://socket.io/docs/v4/server-options/#path
// const io = new Server<ClientToServerEvents, ServerToClientEvents>(server)
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5174"
    }
})

// add a file handler at the root
app.use(express.static('assets/public_html'))

// handle the connection event
io.on('connection', (socket) => {
    console.log('a user connected')
    // connection events
    socket.on('disconnect', () => console.log('a user disconnected'))
    
//     // lobby events
//     socket.on('join', joinHandler)
//     socket.on('getRobots', getRobotsHandler)
//     socket.on('selectRobot', selectRobotHandler)

//     // game events
})


// listen and serve
// app.listen(port, () => {
server.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});

console.log("Hello World")