<script setup lang="ts">
import BoardTile from './BoardTile.vue'
import { Board } from '../../main/game_server/board';
import { Ref, ref } from 'vue';
import { get_walls } from '../../main/game_server/board';

const props = defineProps<{
    editable: boolean,
    board: Board|undefined
}>()

</script>

<template>
    <main>
        <div v-if="!board">
            <p>No board Loaded</p>
        </div>
        <div v-else class="board">
            <div v-for="(col, x) of board.data.spaces" class="col">
                <div v-for="(space, y) of col.slice().reverse()">
                    <BoardTile :tile="space" class="tile" :dim="50" :boundary="get_walls(board, {x:x,y:board.data.y_dim-1-y})"/>
                    <!-- <p>space</p> -->
                </div>
            </div>
        </div>

    </main>
</template>

<style scoped>
.col {
    float: left;
    position: relative;
    /* overflow: scroll; */
}
/* .tile {
    height: 50px;
    width: 50px;
} */
</style>