<script setup lang="ts">
import { useGameStateStore } from '@/stores/client_game_state'

const game_state = useGameStateStore()
</script>

<template>
    <span>🕹️:&nbsp;{{ game_state.priority }}</span>
</template>