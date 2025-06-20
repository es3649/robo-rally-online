<script setup lang="ts">
import router from '@/router';
import TheWelcome from '../components/TheWelcome.vue'

function join() {
  router.push('/join')
}
</script>

<template>
  <main>
    <p class="text-center before-logo">Welcome to</p>
    <!-- <h1 class="text-center">RoboRally</h1> -->
    <img src="@/assets/rrlogofinal.png" alt="RoboRally logo from Renegade Studios">
    <p class="text-center after-logo">Online</p>
    <img class="blurred" src="@/assets/robot_race2.jpg" alt="Image of a racing robot with sparks flying" />
    <button class="block big-button" @click="join()">Join Game</button>
  </main>
</template>

<style scoped>
/* main { */
  /* margin: 8px; */
  /* background-image: url("@/assets/styles/tread-plate-tile.svg"); */
  /* background-repeat: repeat; */
/* } */

.blurred {
  box-shadow: inset 0px 0px 2em var(--color-background);
}

h1 {
  font-size: 3rem;
}

.before-logo {
  position: relative;
  font-size: .75rem;
  margin-bottom: -.5rem;
}

.after-logo {
  position: relative;
  font-size: 1rem;
  margin-top: -1.25rem;
  /* margin-right: 5em; */
}

</style>
