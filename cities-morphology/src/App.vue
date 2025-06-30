<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavComponent from './components/Nav.vue';
</script>

<template>
  <div id="navCompontent">
    <NavComponent />
  </div>
  <div id="page">
    <RouterView />
  </div>
</template>

<style scoped>
nav>a {
  margin: 10px;
  font-size: 12px;
}

#navCompontent {
  position: fixed;
  left: 0;
  top: 0;
  width: var(--nav-width);
  display: inline;
}

#page {
  display: inline;
  position: absolute;
  left: calc(var(--nav-width) + 0.0px);
  width: calc(100% - var(--nav-width) - 0px);
  top: 0px;
}
</style>
