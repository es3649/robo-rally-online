<script setup lang="ts">
import { useGameStateStore } from '@/stores/client_game_state'

const game_state = useGameStateStore()
</script>

<template>
    🕹️:&nbsp;{{ game_state.priority }}
</template>