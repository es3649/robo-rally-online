<script setup lang="ts">
import { GameAction } from '../../models/game_data';
import GameEvent from "./GameEvent.vue"

const props = defineProps<{
    events: GameAction[],
    max_events: number
}>()

</script>

<template>
    <ul>
        <li v-for="event of events">
            <GameEvent :event="event" />
        </li>
    </ul>
</template>

<style scoped>
/* fill all the space that the holder gets, then scroll the overflow */
li {
    width: 100%;
    height: 100%;
    overflow: scroll;
    /* set text wrapping */
}
</style>