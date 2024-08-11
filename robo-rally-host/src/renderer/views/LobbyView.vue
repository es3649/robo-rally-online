<script setup lang="ts">
import { gameStore } from '../../main/stores/game_store';
import { Ref, ref } from 'vue';
import { useConnectionsStore } from '../stores/connections_store'

const connections_store = useConnectionsStore()

const boards: Ref<string[]> = ref([])

window.mainAPI.listBoards().then((listed: string[]) => {
    boards.value = listed
})

const board: Ref<string> = ref("")
const lobby_open: Ref<boolean> = ref(false)
const ip = ref('')

async function openLobby(): Promise<void> {
    lobby_open.value = true
    gameStore.lobby_closed = false
    ip.value = await connections_store.getIP()
}
</script>

<template>
    <main>
        <p v-if="lobby_open">Join IP: <span>{{ ip }}</span></p>
        <!--
        - start with selecting board settings and whatnot
        - have a button to open the lobby to players, and display local IP address
        - display which players have joined, which bot they have selected, and whether the bot is online yet
        - button to start the game -->
        <select id="board_select" v-model="board">
            <option value="" default disabled>Choose a Board</option>
            <option value="_serial" disabled>From Serial</option>
            <option v-if="!boards" disabled>Loading...</option>
            <option v-for="b of boards" :value="b">{{ b }}</option>
        </select>
        
        <p>{{ board }}</p>
        <button v-if="!lobby_open" :disabled="board==''" @click="openLobby">Start Lobby</button>
    </main>
</template>