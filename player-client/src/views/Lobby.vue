<script setup lang="ts">

</script>

<template>
  <h2>Lobby</h2>
    <p>Room Code: <code>{{ room_code }}</code></p>
    <p>Game Type: <code>{{ game_type }}</code></p>
    <h3>Players</h3>
    <ul>
      <li v-for="player in players">{{ player.name }}</li>
    </ul>
    <button @click="start_game()">Start</button>
  </main>
</template>