<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { useGameStateStore } from './stores/client_game_state';
import { GamePhase } from './shared/models/game_data';
import HelloWorld from './components/HelloWorld.vue'
import { socket } from './socket';
import ConnectionStatus from './components/ConnectionStatus.vue';
import { PLAYER_ID_COOKIE, useConnectionStore } from './stores/client_connection';
import { useCookie } from 'vue-cookie-next';
import router from './router';

// disable any listeners (after a hot module reload)
socket.off()

// set up stores and listeners
const c_gs = useGameStateStore()
const c_cs = useConnectionStore()
c_gs.bindEvents()
c_cs.bindEvents()

/**
 * get the session ID. First check if a cookie is present. If so, request that the server
 * let us use that cookie, as it may represent an in-progress session. If the request is
 * denied, request our assigned ID and save it in a cookie in the event of a disconnect
 * 
 * The method is defined here because the cookie module only works inside of components
 * (otherwise I would put it in the client_connection module bc that makes more sense)
 */
function setupSessionID() {
  // this should be called early on to allow reconnection
  const cookie = useCookie()
  // check for an existing ID cookie
  if (cookie.isCookieAvailable(PLAYER_ID_COOKIE)) {
    console.log("Found id in cookie")
    const stored_id = cookie.getCookie(PLAYER_ID_COOKIE)
    if (stored_id) {
      // if there is a cookie, request the id from the server
      console.log(`requesting use of ID from cookie: ${stored_id}`)
      c_cs.id = stored_id
      c_cs.useID(stored_id, (err: Error, ok: boolean) => {
        // log error
        if (err) {
          console.error(err)
        }
        if (!ok) {
          // if we aren't allowed to use the id we sent, then delete the cookie (so this
          // branch isn't executed again, and try the ID fetch again)
          console.log('ID use request was rejected, clearing cookie')
          cookie.removeCookie(PLAYER_ID_COOKIE)
          c_cs.getPlayerID((id:string) => cookie.setCookie(PLAYER_ID_COOKIE, id))
        } else {
          console.log("ID request accepted")
        }
      })
    }
  }
  // after all this, if there is still no ID set, we need to get the id
  if (!c_cs.id) {
    // set it on a cookie after as well
    c_cs.getPlayerID((id: string) => cookie.setCookie(PLAYER_ID_COOKIE, id))
  }
}

function lobby() {
  c_gs.phase = GamePhase.Lobby
  c_gs.all_characters = [
    {
      name:"Sample",
      id:"test123",
      "sprite_small":"/src/assets/robot_race1.jpg",
      "sprite_large":"#",
      "color":{
          "border_color":"#a55",
          "fill_color":"#faa"
      },
      "bluetooth_id":"blootoototoototoototh"
    },{
      name:"Sample 2",
      id:"test234",
      "sprite_small":"/src/assets/robot_race1.jpg",
      "sprite_large":"#",
      "color":{
          "border_color":"#a55",
          "fill_color":"#faa"
      },
      "bluetooth_id":"blootoototoototoototh"
    },{
      name:"Sample 3",
      id:"test2345",
      "sprite_small":"/src/assets/robot_race1.jpg",
      "sprite_large":"#",
      "color":{
          "border_color":"#a55",
          "fill_color":"#faa"
      },
      "bluetooth_id":"blootoototoototoototh"
    },{
      name:"Sample 4",
      id:"test2346",
      "sprite_small":"/src/assets/robot_race1.jpg",
      "sprite_large":"#",
      "color":{
          "border_color":"#a55",
          "fill_color":"#faa"
      },
      "bluetooth_id":"blootoototoototoototh"
    },{
      name:"Sample 5",
      id:"test2347",
      "sprite_small":"/src/assets/robot_race1.jpg",
      "sprite_large":"#",
      "color":{
          "border_color":"#a55",
          "fill_color":"#faa"
      },
      "bluetooth_id":"blootoototoototoototh"
    },{
      name:"Sample 6",
      id:"test2348",
      "sprite_small":"/src/assets/robot_race1.jpg",
      "sprite_large":"#",
      "color":{
          "border_color":"#a55",
          "fill_color":"#faa"
      },
      "bluetooth_id":"blootoototoototoototh"
    }
  ]
  c_gs.available_characters.add('test123')
  c_gs.character = undefined
  router.replace('/lobby')
}

function lobby2() {
  c_gs.character = {
    name:"Sample",
    id:"test123",
    "sprite_small":"/src/assets/robot_race1.jpg",
    "sprite_large":"/src/assets/robot_fighter.jpg",
    "color":{
        "border_color":"#a55",
        "fill_color":"#faa"
    },
    "bluetooth_id":"blootoototoototoototh"
  }
}

function game() {
  router.replace('/game')
  c_gs.phase = GamePhase.Upgrade
}

// this needs to be called early on
setupSessionID()

</script>

<template>
  <main>
    <div v-if="c_gs.phase == GamePhase.Lobby || c_gs.phase == GamePhase.Setup">
      <header>
        <div class="inline-buttons">
          <button @click="lobby">Lobby</button>
          <button @click="lobby2">Lobby 2</button>
          <button @click="game">Game</button>
        </div>
      </header>
      
      <RouterView />
    </div>
    <div v-else>
      <RouterView />
    </div>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
  max-height: 100vh;
}

.inline-buttons {
  display: inline;
}
</style>
