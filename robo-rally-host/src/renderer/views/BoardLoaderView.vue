<script setup lang="ts">
import { Ref, ref } from 'vue';
import { SetupPhase, useGameDataStore } from '../stores/game_data_store';
import BoardComponent from '../components/Board.vue'
import router from '../router';
import { BoardData } from '../../main/game_manager/board';

const gds = useGameDataStore()
const board_name = ref('')
const board_list: Ref<string[]> = ref([])
const board: Ref<BoardData|undefined> = ref(undefined)
const add = ref(true)
const load_error = ref(false)

if (gds.loadable_boards.length === 0) {
    gds.listBoards().then(() => {
        board_list.value = gds.loadable_boards
    })
}

async function load() {
    // load the named board
    if (!board_name.value) {
        console.log('No board selected')
        return
    }
    console.log(board_name.value)
    const ok = await gds.loadBoard(board_name.value)
    load_error.value = !ok
    if (ok) {
        board.value = gds.board
        console.log(board.value)
    }
}

function finish() {
    router.replace('/lobby')
}

</script>

<template>
    <main>
        <div v-if="add">
            <select id="board_select" v-model="board_name">
                <option value="" default disabled>Choose a Board</option>
                <option value="_serial" disabled>From Serial</option>
                <option v-if="!board_list" disabled>Loading...</option>
                <option v-for="b of board_list" :value="b">{{ b }}</option>
            </select>
        </div>
        <button @click="load" :disabled="!board_name">Load Selected</button>
        <div v-if="load_error" class="error"><p>Failed to load requested board</p></div>
        <!-- position buttons above, below, L, and R of the guy to extend the board
         re-evaluate the board data type before writing extend method
          -->
        <BoardComponent :editable="true" :board="board"/>
        <button @click="finish">Finish</button>
    </main>
</template>