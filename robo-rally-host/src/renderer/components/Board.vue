<script setup lang="ts">
import BoardTile from './BoardTile.vue'
import { BoardData } from '../../main/game_manager/board';
import { getWalls } from '../../main/game_manager/board';

const props = defineProps<{
    editable: boolean,
    board: BoardData|undefined
}>()

// const board: Ref<Board> = ref(props.board)

</script>

<template>
    <main>
        <div v-if="!board">
            <p>No board Loaded</p>
        </div>
        <div v-else class="board">
            <div v-for="(col, x) of board.spaces" class="col">
                <div v-for="(space, y) of col.slice().reverse()">
                    <BoardTile :tile="space" class="tile" :dim="20" :boundary="getWalls(board, {x:x,y:board.y_dim-1-y})"/>
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