<script setup lang="ts">
import { reactive } from 'vue';
import IconBatchComponent from '@/components/uiElements/IconBatch.vue';


const props = defineProps<{
    options: Array<{ value: string, label: string, icon?: string }>,
    down?: boolean,
    defaultLabel?: string
}>()
const state = reactive({
    open: false,
})
const emit = defineEmits<{
    (e: 'change', v: string): void,
}>()

const optionSelected = defineModel<string>('optionSelected', { required: true })

function getLabel(value: string): string {
    for (let i = 0; i < props.options.length; i++) {
        if (props.options[i].value === value) return props.options[i].label
    }
    return props.defaultLabel ? props.defaultLabel : ''
}

function getIcon(value: string): string | undefined {
    for (let i = 0; i < props.options.length; i++) {
        if (props.options[i].value === value) {
            if (props.options[i].icon) {
                return props.options[i].icon
            }
            return
        }
    }
    return
}

function isActive(value: string): boolean {
    for (let i = 0; i < props.options.length; i++) {
        if (props.options[i].value === value) return true
    }
    return false
}

</script>
<template>
    <div id="optionsContainer" :class="`${state.open ? '' : 'closed'} ${!props.down ? '' : 'down'}`">
        <div class="optionContainer" v-for="option in props.options"
            @click="optionSelected = option.value; state.open = false; emit('change', option.value)">
            <IconBatchComponent :title="option.label" :secondary="true" :clickable="true" :icon="option.icon" />
        </div>
    </div>
    <IconBatchComponent :title="getLabel(optionSelected)" @click="state.open = !state.open" :clickable="true"
        :icon="getIcon(optionSelected)" :active="isActive(optionSelected)" />

</template>
<style scoped>
#optionsContainer {
    position: absolute;
    transform: translate(0, calc(-100% - 7px));
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 1.0;
    gap: 6px;
    transition: all 0.15s;
}

#optionsContainer.down {
    transform: translate(0, calc(32px + 12px));
}

#optionsContainer.closed {
    opacity: 0.0;
    gap: 0px;
    transform: translate(0, calc(-100% - 0px));
    visibility: hidden;
}

#optionsContainer.closed.down {
    opacity: 0.0;
    gap: 0px;
    transform: translate(0, 0);
    visibility: hidden;
}

@media screen and (max-width: 600px) {
    #optionsContainer {
        gap: 8px 6px;
        flex-wrap: wrap;
        flex-direction: row;
    }

    #optionContainer {
        display: inline;
    }

    #optionsContainer.down {
        transform: translate(0, calc(30px + 0px));
    }
}
</style>