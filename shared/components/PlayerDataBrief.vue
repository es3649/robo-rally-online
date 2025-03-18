<script setup lang="ts">
import type { PlayerStateData } from '../models/player';

const props = defineProps<{
    state: PlayerStateData
}>()
</script>

<template>
    {{ state.priority }}:&nbsp;{{ state.name }}&nbsp;{{ state.active ? "🟢" : "🔴" }}
    <br />
    🏁:&nbsp;{{ state.checkpoints }}&nbsp;⚡️:&nbsp;{{ state.energy }}
    <!-- <h4>{{ state.name }} ({{ state.active ? "Active" : "Shutdown" }})</h4>
    <table>
        <tr>
            <td>Priority</td>
            <td>{{ state.priority }}</td>
        </tr>
        <tr>
            <td>Checkpoints</td>
            <td>{{ state.checkpoints }}</td>
        </tr>
        <tr>
            <td>Energy</td>
            <td>{{ state.energy }}</td>
        </tr>
    </table> -->
</template>