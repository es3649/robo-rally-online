<script setup lang="ts">
import { PlayerStateBrief } from 'src/main/models/player';

const props = defineProps<{
    state: PlayerStateBrief
}>()
</script>

<template>
    <h4>{{ state.name }} ({{ state.active ? "Active" : "Shutdown" }})</h4>
    <table>
        <tr>
            <td>Priority</td>
            <td>{{ state.priority }}</td>
        </tr>
        <tr>
            <td>Checkpoints</td>
            <td>{{ state.checkpoints }}</td>
        </tr>
    </table>
</template>