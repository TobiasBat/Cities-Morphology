import type { Reactive } from "vue"

/**
 * Updates the darkMode variable of a a Reactive object
 * Listens to future changes
 * @param outState darkMode parameter get update initial and on change.
 */
export function initDarkModeListener(outState: Reactive<{ darkMode: boolean }>) {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)
        outState.darkMode = true
    else
        outState.darkMode = false

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (event.matches)
            outState.darkMode = true
        else
            outState.darkMode = false
    })
}