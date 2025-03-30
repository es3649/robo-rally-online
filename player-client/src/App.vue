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
  router.replace('/lobby')
}

function game() {
  router.replace('/game')
}

// this needs to be called early on
setupSessionID()

</script>

<template>
  <main>
    <div v-if="c_gs.phase == GamePhase.Lobby || c_gs.phase == GamePhase.Setup">
      <header>
        <div class="flex-buttons">
          <button @click="lobby">Lobby</button>
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

.flex-buttons {
  display: flex;
}

nav {
  width: 100%;
  font-size: 12px;
  text-align: center;
  margin-top: 2rem;
}

nav a.router-link-exact-active {
  color: var(--color-text);
}

nav a.router-link-exact-active:hover {
  background-color: transparent;
}

nav a {
  display: inline-block;
  padding: 0 1rem;
  border-left: 1px solid var(--color-border);
}

nav a:first-of-type {
  border: 0;
}

@media (min-width: 1024px) {
  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  nav {
    text-align: left;
    margin-left: -1rem;
    font-size: 1rem;

    padding: 1rem 0;
    margin-top: 1rem;
  }
}
</style>
