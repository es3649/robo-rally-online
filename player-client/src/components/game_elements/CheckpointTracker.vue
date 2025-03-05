<script setup lang="ts">
import { useGameStateStore } from '@/stores/client_game_state'

const game_state = useGameStateStore()
</script>

<template>
    Checkpoint: {{ game_state.checkpoints }} / {{ game_state.total_checkpoints }}
    <!-- TODO look at this, this value may not bind -->
    <!-- <input type="checkbox" v-for="val in game_store.checkpoint_array" disabled :value="val"> -->
</template>