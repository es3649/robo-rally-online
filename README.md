# RoboRally Online

RoboRally Online is a Typescript implementation of the RoboRally board game, by Richard Garfield and Renegade Game Studio.
Since the game is very programmatic in nature, and the execution phase can often be carried out algorithmically from player input, I thought an online version of the game would be super cool, so I made one.
It's also just an excuse for me to develop my Typescript, Vuejs, and general web-dev skills.


**Disclaimer**: This project is not affiliated with nor endorsed by Richard Garfield nor Renegade Game Studio

## Structure

The project is broken into 4 main parts:

* `player-client`
* `robo-rally-host`
* `bot-drivers`

### `player-client`

The `player-client` is a Vue+Vite+Pinia web application which provides a web interface for playing the game

### `robo-rally-host`

The `robo-rally-host` is an Electron and Vite+Typescript desktop application which provides an interface for starting the `server`, choosing some game settings, and managing Bluetooth connections with the robots.
It also contains a express-powered and socket.io-enabled server for hosting and joining games, and for handling communication with the players.

### `bot-drivers`

The `bot-drivers` are a series of Arduino programs, designed to control robots over a Bluetooth connection managed by the host