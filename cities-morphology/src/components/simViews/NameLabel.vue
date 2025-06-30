<script lang="ts" setup>
import { onMounted, reactive, watch } from 'vue';

const props = defineProps({
    name: {
        type: String,
        required: true
    },
    e: {
        type: Number,
        default: 1
    },
    ellipseHeight: {
        type: Number,
        default: 12
    },
    color: {
        type: String,
    },
    citySize: {
        type: Number,
        default: 1000
    }
})

const state = reactive({
    width: props.ellipseHeight
})

function updateWidth() {
    state.width = Math.min(props.ellipseHeight * props.e, props.ellipseHeight * 2.5)
}

function getName(size: number): string {
    if (size < 250) return 'Village'
    if (size < 650) return 'Town'
    return 'City'
}

onMounted(() => {
    updateWidth()
})

watch(() => [props.e], () => {
    updateWidth()
})
</script>

<template>
    <div class="batch">
        <svg :width="state.width" :height="props.ellipseHeight">
            <ellipse :cx="state.width / 2" :cy="props.ellipseHeight / 2" :rx="(state.width * 0.9) / 2"
                :ry="(props.ellipseHeight * 0.9) / 2" :fill="props.color ? props.color : ''" />
        </svg>
        <span class="label">
            {{ getName(props.citySize) + ' ' + props.name }}
        </span>
    </div>
</template>

<style scoped>
.batch {
    background-color: var(--bg-color);
    filter: var(--element-shadow-small);
    display: inline-block;
    padding-left: 12px;
    padding-top: 6px;
    padding-bottom: 6px;
    padding-right: 17px;
    border-radius: 100px;
    display: flex;
    align-items: center;
}

svg {
    margin-right: 5px;
}

.label {
    font-size: var(--font-size);
    font-family: var(--font-family);
    color: var(--color-text);
    line-height: var(--font-size);
}

@media screen and (max-width: 600px) {
    .batch {
        padding-top: 0px;
        padding-bottom: 0px;
        padding-left: 2px;
        padding-right: 6px;
    }
}
</style>