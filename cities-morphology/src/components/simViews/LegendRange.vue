<script lang="ts" setup>

const props = defineProps<{
    range: [string, string, string]
    labelFrom: string,
    labelTo: string
}>()
</script>

<template>
    <div id="container">
        <div class="label">{{ props.labelFrom }}</div>
        <div class="bar"
            :style="`background: linear-gradient(${props.range[0]}, ${props.range[1]}, ${props.range[2]});`"></div>
        <div class="label">{{ props.labelTo }}</div>
    </div>
</template>

<style scoped>
#container {
    display: flex;
    flex-direction: column;
    align-items: center;
    pointer-events: none;
    gap: calc(var(--font-size) * 0.3);
    background-color: var(--bg-color2);
    padding-top: calc(var(--font-size) * 0.5);
    padding-bottom: calc(var(--font-size) * 0.5);
}

.bar {
    width: calc(var(--font-size) * 0.9);
    height: 120px;
}

.label {
    font-size: var(--font-size);
    font: var(--font-family);
    color: var(--color-text);
    transform: rotate(-180deg) translate(2px, 0);
    writing-mode: vertical-rl;
}

.label::selection {
    background-color: transparent;
}

.label::-moz-selection {
    background-color: transparent;
}

@media screen and (max-width: 600px) {
    #container {
        gap: calc(var(--font-size-note) * 0.3);
        ;
    }

    .label {
        font-size: var(--font-size-note);
    }

    .bar {
        height: 50px;
        width: calc(var(--font-size-note) * 0.9);
    }
}
</style>