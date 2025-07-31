<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import router from './router';
import { useGameDataStore } from './stores/render_game_data_store';
import Timer from '../shared/components/Timer.vue'
// import components and views

const r_gds = useGameDataStore()

// window.electronAPI.sendMessage('Hello from App.vue!')
function route() {
    console.log(router)
    router.back()
}
</script>

<template>
    <div id="app">
        <nav class="main">
            <span>
                <span v-if="router.getRoutes().length > 1">
                    <a @click="route()">&lt; Back</a>
                    &nbsp;
                </span>
                <RouterLink to="/robots">Robots</RouterLink>
                &nbsp;
                <RouterLink to="/board">Board</RouterLink>
                &nbsp;
                <RouterLink to="/game">Game (dev)</RouterLink>
            </span>
            <span v-if="r_gds.get_input.player!==undefined" class="text-right float-right">
                Awaiting input from {{ r_gds.get_input.player }}:
                <Timer :timeout="r_gds.get_input.timeout" @time-up="r_gds.unsetGetInput()" class="timer-width"></Timer>
                ⏱️
            </span>
        </nav>
        <RouterView />
    </div>
</template>

<style scoped>
nav.main {
    display: block;
    padding: .125em .5em;
}

.float-right {
    float: right;
}

.timer-width {
    display: inline-block;
    min-width: 1.5em;
}

#id {
    height: 100vh;;
}
</style>