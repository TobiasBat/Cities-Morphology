import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
    build: {
        lib: {
            // src/indext.ts is where we have exported the component(s)
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'city-grid-concurrent',
            // the name of the output files when the build is run
            fileName: 'index',
        },
        rollupOptions: {
            output: {
                // Provide global variables to use in the UMD build
                // for externalized deps
                globals: {
                    'city-grid': 'city-grid'
                },
            },
        }
    },
    plugins: [dts()]
})