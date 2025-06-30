<script lang="ts" setup>
import { RouterLink } from 'vue-router';
import DifferentCitiesImageDark from '@/assets/images/different-cities-dark.png'
import DifferemtCitiesImage from '@/assets/images/different-cities.png'
import { onMounted, reactive } from 'vue';
import { initDarkModeListener } from '@/scripts/darkMode';

const state = reactive({
    darkMode: false,
})

onMounted(() => { initDarkModeListener(state) })
</script>
<template>
    <div id="wrapper"
        :style="`background-image: url(${state.darkMode ? DifferentCitiesImageDark : DifferemtCitiesImage});`">
        <div id="buttonWrapper">
            <RouterLink to="/simulation">
                <div id="compareButton">Compare different city layouts →</div>
            </RouterLink>
        </div>
    </div>
</template>

<style scoped>
#wrapper {
    width: 100%;
    background-color: var(--bg-color2);
    margin-top: 1.5px;
    border-radius: 5px;
    background-size: contain;
    background-position: center;
    background-repeat: no-repeat;
}

#buttonWrapper {
    width: 100%;
    min-height: 60svh;
    display: flex;
    align-items: end;
    justify-content: center;
    padding-bottom: 24px;
}

#compareButton {
    background-color: var(--bg-color);
    padding-left: calc(var(--font-size) * 2.5);
    padding-right: calc(var(--font-size) * 2.5);
    padding-top: calc(var(--font-size) * 2);
    padding-bottom: calc(var(--font-size) * 1.8);
    border-radius: 0px;
    filter: var(--element-shadow);
}

a {
    text-decoration: none;
    color: var(--color-text);
}

a:hover #compareButton {
    background-color: var(--color-text);
    color: var(--bg-color2);
}
</style>