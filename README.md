# RoboRally Online

RoboRally Online is a Typescript implementation of the RoboRally board game, by Richard Garfield and Renegade Game Studio.
Since the game is very programmatic in nature, and the execution phase can often be carried out algorithmically from player input, I thought an online version of the game would be super cool, so I made one.
It's also just an excuse for me to develop my Typescript, Vuejs, and general web-dev skills.


**Disclaimer**: This project is not affiliated with nor endorsed by Richard Garfield nor Renegade Game Studio

## Structure

The project is broken into 4 main parts:

* Player Client
* Host Application
* Bot Drivers
* Schematics

### Player Client

The Player Client, contained in the `player-client` directory, is a Vue+Vite+Pinia web application which provides a web interface for playing the game

### Host Application

The host application, in the `robo-rally-host` folder, is an Electron+Vite+Vue3 desktop application written in Typescript which provides an interface for starting the game, choosing some game settings, and managing Bluetooth connections with the robots.
It also contains a express-powered and socket.io-enabled server for hosting and joining games, and for handling communication with the players.
This server serves the Player Client.

### Bot Drivers

The bot drivers, in the `bot-drivers` directory, are a series of Arduino programs, designed to control robots over a Bluetooth connection managed by the host

### Schematics

The `schematics` folder contains PCB and CAD schematics.

The PCB schematics are created using KiCad to model the custom boards used inside each robot.
For simplicity, there is one schematic to service all bots, and thus all robot features will be supported on each PCB.
Robots which do not support a certain feature, will simply not have relevant components added, and will not have those components supported in their drivers.

CAD schematics were created in OnShape, and contain the 3D models for the robots.
Each of these is unique.

## Windows Setup

```ps
# install node
winget install Schniz.fnm

# restart shell
fnm env --use-on-cd | Out-String | Invoke-Expression
fnm use --install-if-missing 22

# set execution policy for npm access
Set-ExecutionPolicy -Scope CurrentUser Unrestricted

# check installation versions
node -v # should print v22.6.0
npm -v  # should print 10.8.2

# install git
winget install --id Git.Git -e --source winget

# clone project
git clone git@github.com:es3649/robo-rally-online.git

# install dependencies
cd robo-rally-online\robo-rally-host
npm install

# start test application
npm run start
```
