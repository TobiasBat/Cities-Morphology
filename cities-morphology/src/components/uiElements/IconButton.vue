<script setup lang="ts">
const props = defineProps({
    icon: String,
    title: String,
    active: {
        type: Boolean,
        default: true
    },
    largeIcon: {
        type: Boolean,
        default: false
    },
    negative: {
        type: Boolean,
        default: false
    }
})
const emit = defineEmits(['click'])
</script>

<template>
    <button
        :class="`${props.active ? '' : 'inactive'} ${props.largeIcon ? 'largeIcon' : ''} ${props.negative ? 'negative' : ''}`"
        @click="emit('click')">
        <img v-if="props.icon" :src="props.icon" />
        {{ props.title }}
    </button>
</template>

<style scoped>
button {
    font-size: var(--font-size);
    line-height: var(--font-size);
    background-color: var(--bg-color);
    color: var(--color-text);
    padding: 8px;
    padding-left: 16px;
    padding-right: 16px;
    border-radius: 100px;
    border: none;
    cursor: pointer;
    filter: var(--element-shadow-small);
    pointer-events: auto;
    display: flex;
    align-items: center;
}

img {
    height: calc(var(--font-size) * 0.8);
    margin-right: 3px;
    position: relative;
    filter: var(--icon-filter);
}

button.largeIcon img {
    height: calc(var(--font-size) * 1.0);
}

button.negative {
    background-color: var(--color-text);
    color: var(--bg-color);
}

@media screen and (max-width: 600px) {
    button {
        font-size: var(--font-size);
        padding-top: 0px;
        padding-bottom: 0px;
        padding-left: 8px;
        padding-right: 8px;
        min-height: 27px;
        min-width: 27px;
    }

    img {
        margin-right: 1.5px;
    }
}
</style>