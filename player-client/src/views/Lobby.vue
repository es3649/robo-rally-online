<script setup lang="ts">
import type { Character, CharacterID } from '@/shared/models/player';
import { useConnectionStore } from '@/stores/client_connection';
import { useGameStateStore } from '@/stores/client_game_state';
import { ref } from 'vue';


const c_cs = useConnectionStore()
const c_gs = useGameStateStore()
// when we load, request the available characters, and display them

const selecting = ref(false)
// TODO rotate image while waiting for game start
const loading_image = ref('schematic.png')

c_cs.getCharacters((result: Character[], available: CharacterID[]) => {
  for (const character of available) {
    c_gs.available_characters.add(character)
  }
  c_gs.all_characters = result
})

function select(character: Character) {
  selecting.value = true
  console.log("Selected: ", character)
  c_cs.selectCharacter(character.id, (message?: string) => {
    if (message) {
      console.log(message)
    } else {
      c_gs.character = character
    }
    selecting.value = false
  }) 
}

</script>

<template>
  <main>
    <h2>Lobby</h2>
    <div v-if="c_gs.character === undefined">
      <h4>Select a character:</h4>
      <ul>
        <li v-for="character of c_gs.all_characters" :key="character.id">
          <img :src="character.sprite_small">
          <p>{{ character.name }}</p>
          <button :disabled="selecting || !c_gs.available_characters.has(character.id)" @click="select(character)">Select</button>
        </li>
      </ul>
    </div>
    <div v-else>
      <h2>Waiting for the host to start the game</h2>
      <p>Character: {{ c_gs.character.name }}</p>
      <img :src="c_gs.character.sprite_large">
      <img :src="`src/assets/loading/${loading_image}`">
    </div>
  </main>
</template>