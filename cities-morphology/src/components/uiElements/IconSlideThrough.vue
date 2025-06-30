<script lang="ts" setup>
import { reactive } from 'vue';

const props = defineProps<{
    options: Array<{ value: string, label: string, icon?: string }>
}>()

const state = reactive({
    slide: 0
})

const emit = defineEmits<{
    (e: 'change', v: string): void,
}>()

const optionSelected = defineModel<string>('optionSelected', { required: true })

function increaseSlide() {
    if (state.slide + 1 < props.options.length) {
        state.slide += 1
    } else {
        state.slide = 0
    }
    updateOptionSelected()
}

function decreaseSlide() {
    if (state.slide > 0) {
        state.slide -= 1
    } else {
        state.slide = props.options.length - 1
    }
    updateOptionSelected()
}

function updateOptionSelected() {
    optionSelected.value = props.options[state.slide].value
    emit('change', optionSelected.value)
}
</script>

<template>
    <div id="slide-wrapper">
        <div @click="decreaseSlide" class="sliders-arrow">←</div>
        <div id="label">
            <img v-if="props.options[state.slide].icon" :src="props.options[state.slide].icon">
            <span v-html="props.options[state.slide].label"></span>
        </div>
        <div @click="increaseSlide" class="sliders-arrow">→</div>
    </div>
</template>

<style scoped>
#slide-wrapper {
    display: flex;
    width: 280px;
    justify-content: space-between;
}

#slide-wrapper #label span {
    font-size: var(--font-size);
}

#slide-wrapper img {
    /* background-color: yellowgreen; */
    width: var(--font-size);
    margin-right: calc(var(--font-size) * 0.5);
    filter: var(--icon-filter);
}

.sliders-arrow {
    pointer-events: auto;
    cursor: pointer;
}

.sliders-arrow::selection {
    background-color: transparent;
}

@media (prefers-color-scheme: dark) {}
</style>