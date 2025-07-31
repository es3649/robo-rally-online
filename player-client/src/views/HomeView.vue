<script setup lang="ts">
import router from '@/router';
import TheWelcome from '../components/TheWelcome.vue'

function join() {
  router.push('/join')
}
</script>

<template>
  <main class="text-center">
    <div class="welcome-logo background-card">
      <p class="text-center before-logo">Welcome to</p>
      <!-- <h1 class="text-center">RoboRally</h1> -->
      <img src="@/shared/assets/rrlogofinal.png" alt="RoboRally logo from Renegade Studios">
      <p class="text-center after-logo">Online</p>
    </div>
    <img class="cover-image" src="@/shared/assets/robot_race2.jpg" alt="Image of a racing robot with sparks flying" />
    <button class="block big-button contrast-small" @click="join()">Join Game</button>
  </main>
</template>

<style scoped>
/* main { */
  /* margin: 8px; */
  /* background-image: url("@/shared/assets/styles/tread-plate-tile.svg"); */
  /* background-repeat: repeat; */
/* } */

.welcome-logo {
  padding: .5em .25em;
  margin: 0em .5em;
}

.cover-image {
  /* box-shadow: inset 0px 0px 2em var(--color-background); */
  margin: 0px .5em;
  width: calc(100% - 1em);
  max-width: 400px;
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
