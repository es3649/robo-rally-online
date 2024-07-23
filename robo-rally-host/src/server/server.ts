import express, { Express, Response, Request } from 'express'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import dotenv from 'dotenv'
import cors from 'cors'
import { games_post_handler, games_delete_handler } from './handlers/game_handlers'
import { join_post_handler } from './handlers/join_handlers'
import bodyParser from 'body-parser'

const app: Express = express()
const port = process.env.PORT || 3000
const server = createServer(app)
// we may need to reset the path here
// https://socket.io/docs/v4/server-options/#path
const io = new Server(server)

const jsonParser = bodyParser.json()

app.use(cors())

// define the endpoints
// this is pretty simple thanks to express
app.post('/API/games', jsonParser, games_post_handler)
app.delete('/API/games', games_delete_handler)
app.post('/API/join', jsonParser, join_post_handler)

// add a file handler at the root
app.use('/', express.static('public'))

// handle the connection event
io.on('connection', (socket) => {
    console.log('a user connected')
    // add socket handlers here
})

// listen and serve
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
});