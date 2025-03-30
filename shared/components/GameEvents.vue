<script setup lang="ts">
import { ref } from 'vue';
import type { GameAction } from '../models/game_data'
import GameEvent from "./GameEvent.vue"

const props = defineProps<{
    events: GameAction[],
    max_events: number
}>()

</script>

<template>
    <ul>
        <li v-for="event of props.events.slice(-max_events).reverse()">
            <GameEvent :event="event" />
        </li>
    </ul>
</template>

<style scoped>
/* fill all the space that the holder gets, then scroll the overflow */
ul {
    height: 40vh;
    overflow: hidden;
    /* set text wrapping */
}

ul:hover, ul:focus, ul:active {
    overflow: auto;
}

/* ul::-webkit-scrollbar {
    display: none;
} */
</style>