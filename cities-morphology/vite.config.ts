import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

export default defineConfig(({ command, mode }) => {
  let debug = true
  let prettyShadows = true
  if (mode == 'production') {
    debug = false
    prettyShadows = false
  }
  console.log('Debug Info:', debug)
  console.log('Pretty Shadows:', prettyShadows)
  return {
    define: {
      __DEBUG_INFO__: debug,
      __HIGH_RES_SHADOWS__: prettyShadows
    },
    plugins: [
      vue(),
      vueJsx(),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    base: '/cities-morphology/',
    server: {
      fs: {
        allow: ['..']
      }
    }
  }
})
