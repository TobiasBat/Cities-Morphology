import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'city-grid',
            fileName: 'index',
        },
        rollupOptions: {
            output: {
                globals: {},
            },
        }
    },
    plugins: [dts()]
})