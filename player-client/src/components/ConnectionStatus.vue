<script setup lang="ts">
import { useConnectionStore } from '@/stores/client_connection';

const c_cs = useConnectionStore()

</script>

<template>
    <span v-if="c_cs.connected">🟢</span>
    <span v-else>🔴</span>
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