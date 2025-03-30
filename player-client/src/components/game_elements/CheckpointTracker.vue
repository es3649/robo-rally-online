<script setup lang="ts">
import { useGameStateStore } from '@/stores/client_game_state'

const game_state = useGameStateStore()
</script>

<template>
    <span>🏁:&nbsp;{{ game_state.checkpoints }}/{{ game_state.total_checkpoints }}</span>
</template>