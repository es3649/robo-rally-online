<script setup lang="ts">
import { useConnectionStore } from '@/stores/client_connection';
import ConnectionStatus from './ConnectionStatus.vue';

const c_cs = useConnectionStore()

</script>

<template>
    <main>
        <h2>Settings</h2>
        <p>Session ID: <span class="text-primary text-smaller">{{ c_cs.id ? c_cs.id : "<none>" }}</span></p>
        <p>Connection Status: <span v-if="c_cs.connected" class="connected">Connected</span>
            <span v-else class="disconnected">
                <button @click="c_cs.connect()">Reconnect</button>
            </span>
        </p>
        <h3>Credits</h3>
        <p class="text-smaller">Development by: Eric Steadman.
            Game Design: Richard Garfield and Renegade Game Studios.
            This project is not affiliated with nor endorsed by Richard Garfield nor Renegade Game Studios.
        </p>
    </main>
</template>

<style lang="css" scoped>
.connected {
    color: darkgreen;
}

.disconnected {
    color: var(--invert-color-text);
}
</style>