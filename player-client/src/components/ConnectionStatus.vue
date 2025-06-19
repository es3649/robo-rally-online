<script setup lang="ts">
import { useConnectionStore } from '@/stores/client_connection';

const c_cs = useConnectionStore()

</script>

<template>
    <span v-if="c_cs.connected">🟢&nbsp;OK</span>
    <span v-else>🔴&nbsp;Err</span>
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