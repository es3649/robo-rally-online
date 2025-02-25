<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useConnectionsStore } from '../stores/connections_store'
import router from '../router';
import qrcodegen from 'nayuki-qr-code-generator';
import { toSvgString } from '../qr';
import { SetupPhase, useGameDataStore } from '../stores/game_data_store';
import { PlayerID } from 'src/main/models/player';

const connections_store = useConnectionsStore()
const game_store = useGameDataStore()

// const boards: Ref<string[]> = ref([])

// window.mainAPI.listBoards().then((listed: string[]) => {
//     boards.value = listed
// })

// TODO this should get a default value from the game_data_store
const lobby_open: Ref<boolean> = ref(false)
const ip = ref('')
const view_box = ref('')
const svg_path = ref('')

function openLobby(): void {
    connections_store.getIP().then((value: string|undefined):void => {
        ip.value = value
        if (value !== undefined) {
            const qr0 = qrcodegen.QrCode.encodeText(`http://${ip.value}`, qrcodegen.QrCode.Ecc.MEDIUM)
            view_box.value = `0 0 ${qr0.size + 4} ${qr0.size +4}`
            svg_path.value = toSvgString(qr0)
        }
    })
    connections_store.getToDos().then((value: Map<PlayerID, string[]>) => {
        game_store.to_dos = value
    })
    game_store.setup_status = SetupPhase.Lobby
    lobby_open.value = true
}

function start(): void {
    // send a start notification to the main thread
    connections_store.sendStart()
    // update our phase
    game_store.setup_status = SetupPhase.Done
    // go to the game thread
    router.replace('/game')
}
</script>

<template>
    <main>
        <div v-if="lobby_open">

            <p>Join IP: <span>{{ ip }}</span></p>
            <svg xmlns="http://www.w3.org/2000/svg" version="1.1" :view-box="view_box" stroke="none">
                <rect width="100%" height="100%" fill="#ffffff"/>
                <path :d="svg_path" fill="#000000" />
            </svg>

            <table>
                <tr>
                    <th>Player</th>
                    <th>Character</th>
                </tr>
                <tr v-for="[player_id, name] of game_store.players" :key="player_id">
                    <td>{{ name }}</td>
                    <td>{{ game_store.characters.has(player_id) ? game_store.characters.get(player_id).name : "[No character selected]" }}</td>
                </tr>
            </table>

            <div v-if="game_store.to_dos.size > 0">
                <h4>The following must be addressed before beginning the game</h4>
                <li v-for="[player, actions] in game_store.to_dos" :key="player">
                    <!-- <td>{{ player }}:</td> -->
                    <ul v-for="line in actions">{{ line }}</ul>
                </li>
            </div>
            <div v-else>
                <p>Ready!</p>
            </div>
            <button :disabled="game_store.to_dos.size > 0" @click="start">Start Game</button>
        </div>
        <!--
            - start with selecting board settings and whatnot
            - have a button to open the lobby to players, and display local IP address
            - display which players have joined, which bot they have selected, and whether the bot is online yet
            - button to start the game -->
            
            
            
        <p>Board: {{ game_store.board_name }}</p>
        <button v-if="!lobby_open" @click="openLobby">Start Lobby</button>
    </main>
</template>

<style scoped>
svg path {
    transform: scale(5.0);
    -ms-transform: scale(5.0);
    -webkit-transform: scale(5.0);
}
</style>