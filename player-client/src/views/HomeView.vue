<script setup lang="ts">
import router from '@/router';
import TheWelcome from '../components/TheWelcome.vue'

function join() {
  router.push('/join')
}
</script>

<template>
  <main>
    <!-- <TheWelcome /> -->
     <button @click="join()">Join Game</button>
  </main>
</template>
