# RoboRally `online` server

This module contains the server components for RoboRally `online`.

It is a Node+Express server in Typescript

## API Documentation

The server exposes the following endpoints:

 * `/join`
 * `/games`

### `/games`

This endpoint accepts the GET, POST, and DELETE methods.

#### GET

Get the list of games

Return structure:
```json
{
  "games": [{
    // stuff
  }]
}
```

#### POST

Creates a new game

#### DELETE

Deletes the game

### `/join`

#### POST

Join a game (return connection details for the game)

Request structure:
```json
{
    "player_name": "<some name>",
    "game_code": "<some code, as returned from GET/CREATE /game>",
    "host_key": "<optional: host key, as returned from CREATE /game>"
}
```

Return structure:
```json
{
    "host": "<an IP address or domain name where the game server can be reached>",
    "port": "<the port on the the host where the player is expected to connect>",
    "AES": "<a base64 encoded AES key which will be used for the TCP connection>"
}
```

## TCP Protocol

Once a game is joined, the client is expected to establish a TCP connection with the game server so that the client and server can have effective bidirectional communication without a need for polling.