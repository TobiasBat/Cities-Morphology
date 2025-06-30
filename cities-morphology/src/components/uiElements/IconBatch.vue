<script setup lang="ts">
const props = defineProps({
    icon: String,
    title: String,
    secondary: Boolean,
    clickable: Boolean,
    active: {
        type: Boolean,
        default: true
    }
})
</script>

<template>
    <div
        :class="`${props.secondary ? 'secondary' : ''} ${props.clickable ? 'clickable' : ''} ${props.active ? '' : 'inactive'}`">
        <img v-if="props.icon" :src="props.icon" />
        {{ props.title }}
    </div>
</template>

<style scoped>
div {
    font-size: var(--font-size);
    background-color: var(--bg-color);
    color: var(--color-text);
    padding: 6px;
    padding-left: 18px;
    padding-right: 18px;
    border-radius: 100px;
    border: none;
    filter: var(--element-shadow-small);
    pointer-events: auto;
    margin-inline-end: 3px;
    margin-inline-start: 3px;
    display: block;
    display: flex;
    align-items: center;
}

div::selection {
    background-color: transparent;
}

div.inactive {
    color: var(--color-text-shade2);
}

.secondary {
    color: var(--color-text-shade2);
}

.clickable {
    cursor: pointer;
    transition: color 0.25s;
}

.clickable:hover {
    color: var(--color-text);
}

img {
    width: calc(var(--font-size) * 1.2);
    margin-right: 3px;
    position: relative;
    top: 3px;
}

@media screen and (max-width: 600px) {
    div {
        padding-top: 1.5px;
        padding-bottom: 0px;
        padding-left: 12px;
        padding-right: 12px;
    }
}
</style>