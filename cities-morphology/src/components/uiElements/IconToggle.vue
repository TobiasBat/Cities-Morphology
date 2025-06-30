<script setup lang="ts">

const props = defineProps({
    icons: Array<String>,
    titles: Array<String>
})

const optionSelected = defineModel<number | unknown>('optionSelected', { required: true })

</script>

<template>
    <div id="toggleWrapper" @click="optionSelected = (optionSelected === 0 ? 1 : 0)">
        <div class="backgroundContainer">
            <div :class="`backgroundElement ${optionSelected == 1 ? 'left' : ''}`"></div>
        </div>
        <div class="container">
            <div :class="`title option1 ${optionSelected === 0 ? 'selected' : ''}`">
                {{ props.titles ? props.titles[0] : '' }}
            </div>
            <div :class="`title option2 ${optionSelected === 1 ? 'selected' : ''}`">
                {{ props.titles ? props.titles[1] : '' }}
            </div>
        </div>
    </div>
</template>

<style scoped>
#toggleWrapper {
    position: relative;
    pointer-events: auto;
    cursor: pointer;
    filter: var(--element-shadow-small);
    min-height: calc(var(--font-size) + 5px + 5px);
}

.container {
    display: flex;
    height: 100%;
    align-items: center;
    top: 0;
    position: absolute;
}

.title {
    width: calc(var(--font-size) * 7);
    text-align: center;
    display: inline-block;
    padding-top: 0px;
    padding-bottom: 0px;
    font-size: var(--font-size);
    line-height: var(--font-size);
}

.title.selected {
    color: var(--bg-color);
}

.backgroundContainer {
    background-color: var(--bg-color);
    border-radius: 100px;
    width: calc(var(--font-size) * 7 * 2);
    height: 100%;
    /* transform: translate(0, -10px); */
    position: relative;
    /* display: block; */
    /* top: 0; */
}

.backgroundElement {
    width: calc(var(--font-size) * 7 - 6px);
    position: absolute;
    top: 3px;
    left: 3px;
    height: calc(100% - 5px);
    display: inline-block;
    background-color: var(--color-text);
    border-radius: 100px;
    transition: left 0.2s ease-out;
}

.backgroundElement.left {
    left: calc(var(--font-size) * 7 + 3px);
}
</style>