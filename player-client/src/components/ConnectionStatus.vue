<script setup lang="ts">
import { useConnectionStore } from '@/stores/client_connection';

const connection_store = useConnectionStore()

</script>

<template>
    <main>
        <div v-if="connection_store.connected" class="connected"><p>Connected</p></div>
        <div v-else class="disconnected">
            <button @click="connection_store.connect()">Reconnect</button>
        </div>
    </main>
</template>

<style scoped>
.connected {
    color: darkgreen;
}
.disconnected {
    color: darkred;
}
.disconnected button {
    background-color: darkgrey;
    color: inherit;
}
</style>