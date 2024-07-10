<script setup lang="ts">
import { ref } from 'vue'
import type { Ref } from 'vue';
import { useGameStateStore } from '@/stores/game_state'
import ProgrammingCard from './ProgrammingCard.vue'

const game_state = useGameStateStore()
const selected: Ref<number|undefined> = ref(undefined)
</script>

<template>
    <div class="card" v-for="register in game_state.registers">
        <ProgrammingCard v-if="register != undefined" fill_color="" border_color="" :value="register" @click="selected= (selected === undefined? 0 : undefined)"></ProgrammingCard>
    </div>
</template>