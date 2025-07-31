<script setup lang="ts">
import { Ref, ref } from 'vue';
import { useGameDataStore } from '../stores/render_game_data_store';
import BoardComponent from '../components/Board.vue'
import router from '../router';
import { BoardData } from '../../main/game_manager/board';

const r_gds = useGameDataStore()
const board_name = ref('')
const board: Ref<BoardData|undefined> = ref(undefined)
const load_error = ref(false)

if (r_gds.loadable_boards.length === 0) {
    console.log("loading boards")
    r_gds.listBoards()
}

async function load() {
    // load the named board
    if (!board_name.value) {
        console.log('No board selected')
        return
    }
    console.log(board_name.value)
    const ok = await r_gds.loadBoard(board_name.value)
    load_error.value = !ok
    if (ok) {
        board.value = r_gds.board
        console.log(board.value)
    }
}

function finish() {
    router.replace('/lobby')
}

</script>

<template>
    <main class="gridded boardloader-grid">
        <div class="flex flex-horiz-center flex-columns">
            <div>
                <select id="board_select" v-model="board_name">
                    <option value="" default disabled>Choose a Board</option>
                    <option value="_serial" disabled>From Serial</option>
                    <option v-if="!r_gds.loadable_boards" disabled>Loading...</option>
                    <option v-for="b of r_gds.loadable_boards" :value="b">{{ b }}</option>
                </select>
            </div>
            <button @click="load" :disabled="!board_name">Load Selected</button>
            <div v-if="load_error" class="error"><p>Failed to load requested board</p></div>
        </div>
        <!-- position buttons above, below, L, and R of the guy to extend the board
         re-evaluate the board data type before writing extend method
          -->
        <div class="flex flex-horiz-center flex-vert-center flex-columns">
            <BoardComponent :editable="true" :board="board"/>
            <button :disabled="board === undefined" @click="finish">Finish</button>
        </div>
    </main>
</template>

<style lang="css" scoped>
.boardloader-grid {
    grid-template-columns: 1fr 2fr;
}
</style>