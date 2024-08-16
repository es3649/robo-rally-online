<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useConnectionsStore } from '../stores/connections_store'
import router from '../router';

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
        
        
        <p>{{ board }}</p>
        <button v-if="!lobby_open" @click="openLobby">Start Lobby</button>
    </main>
</template>