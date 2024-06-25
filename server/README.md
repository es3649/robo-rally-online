# RoboRally `online` server

This module contains the server components for RoboRally `online`.

It is a Node+Express server in Typescript

## API Documentation

The server exposes the following endpoints:

`/join`
`/games`

GET /games: get the list of games
POST /games: creates a new game
DELETE /games: deletes the game

POST /join: join a game (return connection details for the game)
Requires:
```json
{
    "player_name": "<some name>",
    "game_code": "<some code, as returned from GET/CREATE /game>",
    "host_key": "<optional: host key, as returned from CREATE /game>"
}
```

Returns:
```json
{
    "host": "<an IP address or domain name where the game server can be reached>",
    "port": "<the port on the the host where the player is expected to connect>",
    "AES": "<a base64 encoded AES key which will be used for the TCP connection>"
}
```

## TCP Protocol

Once a game is joined, 