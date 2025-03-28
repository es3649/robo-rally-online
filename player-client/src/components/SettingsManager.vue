<script setup lang="ts">
import { useConnectionStore } from '@/stores/client_connection';
import { useGameStateStore } from '@/stores/client_game_state';
import ConnectionStatus from './ConnectionStatus.vue';

const c_gs = useGameStateStore()
const c_cs = useConnectionStore()

</script>

<template>
    <main>
        <ConnectionStatus />
        <div v-if="c_cs.connected" class="connected"><p>Connected</p></div>
        <div v-else class="disconnected">
            <button @click="c_cs.connect()">Reconnect</button>
        </div>
        <h2>Settings WIP</h2>
        <p>Session ID: {{ c_cs.id }}</p>
    </main>
</template>