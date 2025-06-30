<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import sliderAIndicatorPath from '@/assets/images/sliderTopIndicator.png'
import sliderBIndicatorPath from '@/assets/images/sliderBottomIndicator.png'
import dependentValuesIcon from '@/assets/images/dependentValues.png'
import independentValuesIcon from '@/assets/images/independentValues.png'

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
    icon: {
        type: String,
        required: false
    },
    showTwo: {
        type: Boolean,
        default: true
    }
})

const theme = ref({
    sliderTopIndicator: `url(${sliderAIndicatorPath})`,
    sliderBottomIndicator: `url(${sliderBIndicatorPath})`,
})

const valueA = defineModel('valueA')
const valueB = defineModel('valueB')


const emit = defineEmits<{
    (e: 'change', v: [string, string]): void,
    (e: 'input', v: [string, string]): void,
}>()

const state = reactive({
    transformA: `translate(-10px, 5px)`,
    transformB: `translate(-10px, 5px)`,
    hoveringA: false,
    hoveringB: false
})

const sliderA = ref()
const sliderB = ref()

function setBValueAsA() {
    valueB.value = valueA.value
    emit('change', [valueA as unknown as string, valueB as unknown as string])
    updateTransform()
}

function updateTransform() {
    const rect = sliderA.value.getBoundingClientRect()
    const width = rect.width - 20

    const kA = (sliderA.value.value - props.min) / (props.max - props.min)
    state.transformA = `translate(${Math.round(kA * width) - 15}px, 0px)`

    if (sliderB.value) {
        const kB = (sliderB.value.value - props.min) / (props.max - props.min)
        state.transformB = `translate(${Math.round(kB * width) - 15}px, 0px)`
    }
}

onMounted(() => {
    sliderA.value.addEventListener('mouseenter', () => {
        state.hoveringA = true
    })
    sliderA.value.addEventListener('mouseleave', () => {
        state.hoveringA = false
    })
    sliderB.value.addEventListener('mouseenter', () => {
        state.hoveringB = true
    })
    sliderB.value.addEventListener('mouseleave', () => {
        state.hoveringB = false
    })
    sliderA.value.addEventListener('change', (event: any) => {
        emit('change', [valueA as unknown as string, valueB as unknown as string])
        updateTransform()
    })
    sliderB.value.addEventListener('change', (event: any) => {
        emit('change', [valueA as unknown as string, valueB as unknown as string])
        updateTransform()
    })

    sliderA.value.addEventListener('input', (event: any) => {
        emit('input', [valueA as unknown as string, valueB as unknown as string])
        updateTransform()
    })
    sliderB.value.addEventListener('input', (event: any) => {
        emit('input', [valueA as unknown as string, valueB as unknown as string])
        updateTransform()
    })
    updateTransform()

    const resObserver = new ResizeObserver(() => updateTransform())
    resObserver.observe(sliderA.value)
})
</script>

<template>
    <div id="wrapper">
        <div id="label"><img v-if="icon" :src="icon"><span>{{ props.label }}</span></div>
        <div class="rangeLabel left">{{ props.min }}</div>
        <div id="sliders">
            <input type="range" id="sliderA" ref="sliderA" v-model="valueA" :min="props.min" :max="props.max"
                :step="props.step">
            <div id="line"></div>
            <input type="range" id="sliderB" ref="sliderB" v-model="valueB" :min="props.min" :max="props.max"
                :step="props.step" :class="`${props.showTwo ? '' : 'hidden'}`">
            <span id="valueA" :style="`transform: ${state.transformA};`"
                :class="`${state.hoveringA ? '' : 'hidden'}`">{{ valueA }}</span>
            <span id="valueB" :style="`transform: ${state.transformB};`"
                :class="`${props.showTwo && state.hoveringB ? '' : 'hidden'}`">{{
                    valueB }}</span>
        </div>
        <div class="rangeLabel right">{{ props.max }}</div>
        <div id="dependentContainer" @click="setBValueAsA" v-if="showTwo">
            <img :src="dependentValuesIcon" v-if="valueA === valueB">
            <img :src="independentValuesIcon" v-if="valueA !== valueB">
        </div>
    </div>
</template>

<style scoped>
#wrapper {
    width: 100%;
    display: flex;
    gap: 6px;
    box-sizing: border-box;
    height: auto;
    min-height: 26px;
}

#label {
    width: 250px;
    display: flex;
    align-items: center;
}

#label::selection {
    background-color: transparent;
}

#label::-moz-selection {
    background-color: transparent;
}

#label>img {
    width: calc(var(--font-size) * 0.6);
    margin-right: calc(var(--font-size) * 0.3);
    filter: var(--icon-filter);
}

#label>span {
    font-size: var(--font-size);
    line-height: 0.9;
}

#label>span::selection {
    background-color: transparent;
}

#sliders {
    position: relative;
    width: 100%;
}

input {
    position: absolute;
    left: 0;
    top: 0;
    /* -webkit-appearance: none; */
    appearance: none;
    width: 100%;
    background: transparent;
    height: 12px;
}

input.hidden {
    opacity: 0.0;
    pointer-events: none;
}

#sliderA {
    top: 0px;
}

#sliderB {
    top: 12px;
}

#sliderA::-webkit-slider-thumb,
#sliderB::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    background-color: transparent;
    width: 20px;
    height: 12px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    cursor: ew-resize;
    filter: none;
    box-shadow: none;

}

#sliderA::-webkit-slider-thumb {
    background-image: v-bind('theme.sliderTopIndicator');
}

#sliderB::-webkit-slider-thumb {
    background-image: v-bind('theme.sliderBottomIndicator');
}

#sliderA::-moz-range-thumb,
#sliderB::-moz-range-thumb {
    width: 20px;
    height: 12px;
    background-position: 50% 50%;
    background-color: transparent;
    background-size: contain;
    background-repeat: no-repeat;
    border-radius: 0px;
    border: none;
    cursor: ew-resize;
    background-position: 0 0;
    padding: 0;

}

#sliderA::-moz-range-thumb {
    background-image: v-bind('theme.sliderTopIndicator');
}

#sliderB::-moz-range-thumb {
    background-image: v-bind('theme.sliderBottomIndicator');
}



#dependentContainer {
    display: flex;
    width: 25px;
    height: 25px;
    justify-content: center;
    align-items: center;
    cursor: pointer;
}

#dependentContainer>img {
    width: 100%;
    filter: var(--icon-filter);
    opacity: 1.0;
}

#dependentContainer:hover>img {
    opacity: 0.5;
}

#line {
    width: 100%;
    height: 1px;
    position: absolute;
    top: 12px;
    border-bottom: solid 1px var(--color-text);
}

.rangeLabel {
    font-size: var(--font-size-note);
    width: 30px;
    color: var(--color-text-shade2);
    line-height: var(--font-size-note);
    padding-top: 8px;
}

.rangeLabel.left {
    text-align: right;
}

#valueA,
#valueB {
    font-size: var(--font-size-note);
    min-width: 50px;
    position: absolute;
    pointer-events: none;
    text-align: center;
    border-radius: 120px;
    top: -18px;
    color: var(--color-text);
}

#valueA {
    background-color: rgb(177, 192, 36);
}

#valueB {
    background-color: rgb(83, 126, 93);
}

#valueA.hidden,
#valueB.hidden {
    display: none;
}

@media screen and (max-width: 600px) {
    #wrapper {
        gap: px;

    }

    #sliders {
        height: auto;
    }

    #sliderA::-webkit-slider-thumb,
    #sliderB::-webkit-slider-thumb {
        width: 12px;
        height: 12px;
    }

    #sliderB {
        top: 12px;
    }

    #line {
        top: 12px;
    }

    .rangeLabel {
        font-size: var(--font-size-note);
        padding-top: 2px;
    }

    #dependentContainer {
        display: flex;
        width: 50px;
        /* height: 100px; */
    }
}

@media (prefers-color-scheme: dark) {

    #valueA,
    #valueB {
        color: var(--bg-color);
    }
}
</style>