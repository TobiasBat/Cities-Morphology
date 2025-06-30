<script setup lang="ts">
import sliderAIndicatorPath from '@/assets/images/sliderBlackIndicator.png'
import { onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';

const props = defineProps({
    label: {
        type: String,
        default: ''
    },
    min: {
        type: Number,
        default: 0
    },
    max: {
        type: Number,
        default: 1.0
    },
    step: {
        type: Number,
        default: 0.1
    },
    dependent: {
        type: Boolean,
        default: true
    },
    showValueLabel: {
        type: Boolean,
        default: true
    },
    icon: {
        type: String,
        required: false
    },
    motivator: {
        type: Boolean,
        default: false
    }
})

const theme = ref({
    sliderIndicator: `url(${sliderAIndicatorPath})`
})
const value = defineModel('value')
const sliderInput = ref()
const valueLabelWidth = 50
const valueLabelWidthStyle = `${valueLabelWidth}px`

const emit = defineEmits<{
    (e: 'change', v: string): void,
    (e: 'input', v: string): void
}>()

const state = reactive({
    valueLabelOffset: 0,
    hideValueLabel: false,
    showMotivator: props.motivator
})

function updateValueLabelPosition() {
    if (!value.value || !sliderInput.value) return
    const rect = (sliderInput.value as HTMLInputElement).getBoundingClientRect()
    state.hideValueLabel = rect.width === 0 ? false : true
    const k = (+value.value - props.min) / (props.max - props.min)
    state.valueLabelOffset = 6 + k * (rect.width - 12)
}

onMounted(() => {
    const sliderElement = sliderInput.value as HTMLInputElement
    sliderElement.addEventListener('change', () => {
        state.showMotivator = false
        emit('change', value as unknown as string)
    })
    sliderElement.addEventListener('input', () => {
        emit('input', value as unknown as string)
    })
    updateValueLabelPosition()
})

</script>
<template>
    <div id="wrapper">
        <div id="label"><img v-if="icon" :src="icon"><span>{{ props.label }}</span></div>
        <div class="rangeLabel left">{{ props.min }}</div>
        <div id="slider">
            <input type="range" id="sliderInput" ref="sliderInput" v-model="value" :min="props.min" :max="props.max"
                :step="props.step" @input="updateValueLabelPosition" @mousemove="updateValueLabelPosition()">
            <div id="line"></div>
            <div id="valueLabel" v-if="props.showValueLabel && state.hideValueLabel" ref="valueLabel"
                :style="`left: ${state.valueLabelOffset - valueLabelWidth / 2}px;`">
                {{ value }}
            </div>
            <div id="motivator" v-if="state.showMotivator"
                :style="`left: ${state.valueLabelOffset - valueLabelWidth / 2}px;`">Change slider ↔</div>
        </div>
        <div class="rangeLabel right">{{ props.max }}</div>
    </div>
</template>
<style scoped>
#wrapper {
    width: 100%;
    display: flex;
    gap: 6px;
    box-sizing: border-box;
    height: auto;
    min-height: 15px;
    pointer-events: none;
    opacity: 0.0;
    animation-name: displaySlider;
    animation-duration: 0.5s;
    animation-delay: 1s;
    animation-timing-function: ease-out;
    animation-fill-mode: forwards;
}

@keyframes displaySlider {
    from {
        opacity: 0;
        transform: translate(0, 10px);
    }

    to {
        opacity: 1;
        transform: translate(0, 0);
    }
}

#label {
    display: flex;
    align-items: center;
    white-space: nowrap;
}

#label::selection {
    background-color: transparent;
}

#label>span {
    font-size: var(--font-size);
}

#label>span::selection {
    background-color: transparent;
}

#slider {
    width: 100%;
    position: relative;
}

input {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    appearance: none;
    background: transparent;
    pointer-events: auto;
    height: 12px;
    padding-bottom: 0px;
}

#sliderInput::-webkit-slider-thumb {
    appearance: none;
    background-color: transparent;
    width: 12px;
    height: 12px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    cursor: ew-resize;
    filter: var(--icon-filter);
    box-shadow: none;
    background-image: v-bind('theme.sliderIndicator');
}

#sliderInput::-moz-range-thumb {
    background-color: transparent;
    width: 20px;
    height: 12px;
    background-image: v-bind('theme.sliderIndicator');
    background-size: contain;
    background-repeat: no-repeat;
    border-radius: 0px;
    background-position: 50% 50%;
    filter: var(--icon-filter);
    border: none;
    cursor: ew-resize;
}

#line {
    width: 100%;
    height: 1px;
    position: absolute;
    top: 11.5px;
    border-bottom: solid 1px var(--color-text);
}

.rangeLabel {
    font-size: var(--font-size-note);
    width: 30px;
    color: var(--color-text-shade2);
    padding-top: 4px;
    line-height: 1;
}

.rangeLabel.left {
    text-align: right;
}

#valueLabel {
    font-size: var(--font-size-note);
    display: block;
    width: v-bind('valueLabelWidthStyle');
    position: absolute;
    top: -18px;
    text-align: center;
    line-height: var(--font-size-note);
    padding-top: 4px;
}

img {
    width: calc(var(--font-size) * 0.6);
    margin-right: calc(var(--font-size) * 0.5);
    filter: var(--icon-filter);
}


#motivator {
    background-color: var(--bg-color);
    display: inline-block;
    font-size: var(--font-size);
    width: auto;
    text-align: right;
    padding-right: 16px;
    padding-left: 16px;
    border-radius: 100px;
    transform: translate(calc(-25% - 8px), 0);
    position: relative;
    top: -30px;
    animation: motivated;
    animation-duration: 1.5s;
    animation-iteration-count: infinite;
    animation-timing-function: ease-in-out;
}

@keyframes motivated {
    0% {
        top: -30px;
    }

    50% {
        top: -40px;
    }

    100% {
        top: -30px;
    }
}
</style>