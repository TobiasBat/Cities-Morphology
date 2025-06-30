<script setup lang="ts">
import logoBarRotated from '@/assets/images/logo-bar-vertical-rotated.png'
import { initDarkModeListener } from '@/scripts/darkMode';
import { onMounted, reactive } from 'vue';
import { RouterLink } from 'vue-router';

const state = reactive({
    darkMode: false
})

onMounted(() => initDarkModeListener(state))

</script>
<template>
    <div id="navContainer">
        <div id="navWrapper">
            <span class="navElement" id="logoNavElement">
                <RouterLink :to="{ path: '/', force: true }"><img id="logobar" :src="logoBarRotated"></RouterLink>
            </span>
            <span class="navElement">
                <RouterLink :to="{ path: '/compare', force: true }">Compare</RouterLink>
            </span>
            <span class="navElement">
                <RouterLink :to="{ path: '/calculator', force: true }">Calculator</RouterLink>
            </span>
            <span class="navElement">
                <RouterLink :to="{ path: '/about', force: true }">About</RouterLink>
            </span>
        </div>
    </div>
</template>
<style scoped>
#navContainer {
    height: 100vh;
    width: var(--nav-width);
    background-color: var(--bg-color2);
    border-right: solid 1.5px var(--bg-color);
    border-bottom-right-radius: 6px;
    border-top-right-radius: 6px;
    position: relative;
}

#navWrapper {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    align-content: center;
    justify-content: flex-start;
    gap: 30px;
    height: 100svh;
    padding-bottom: 20px;
    opacity: 1;
    padding-top: 25px;
    position: relative;
    /* animation-timing-function: ease-out; */
}

.navElement {
    color: var(--color-text-shade1);
    font-size: var(--font-size);
    writing-mode: vertical-rl;
    transform: rotate(180deg) translate(2.5px);
    opacity: 0;
    cursor: pointer !important;
    background: transparent;
    animation-name: navIntro;
    animation-duration: 0.33s;
    animation-delay: 1.0s;
    animation-fill-mode: forwards;
}

@keyframes navIntro {
    from {
        opacity: 0;
        transform: rotate(180deg) translate(2.5px);
    }

    to {
        opacity: 1;
        transform: rotate(180deg) translate(0px);
    }
}

#logoNavElement {
    transform: none;
}

.navElement a {
    color: var(--color-text-shade2);
    font-size: var(--font-size);
    text-decoration: none;
    cursor: pointer;
}

.navElement>a:hover {
    color: var(--color-text);
    text-decoration: underline;
}


#logobar {
    width: calc(var(--font-size) * 0.85);
    filter: grayscale(1) contrast(0) brightness(1.3);
    transition: all 0.25s;
    opacity: 1;
    cursor: pointer;
    transform: rotate(180deg);
}

#logobar:hover {
    opacity: 1;
    filter: grayscale(0) contrast(1) brightness(1);
}

@media (prefers-color-scheme: dark) {
    #logobar {
        filter: grayscale(1) contrast(0) brightness(1.2);
    }
}

@media screen and (max-width: 600px) {}
</style>