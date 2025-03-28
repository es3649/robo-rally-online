<script setup lang="ts">
import { useConnectionStore } from '@/stores/client_connection';

const c_cs = useConnectionStore()

</script>

<template>
    <div v-if="c_cs.connected" class="connected">🟢</div>
    <div v-else class="disconnected">🔴</div>
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