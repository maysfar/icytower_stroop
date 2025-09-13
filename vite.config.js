import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main:   resolve(__dirname, 'index.html'),
        classic: resolve(__dirname, 'classic.html'),
        game:   resolve(__dirname, 'game.html'),
        end:   resolve(__dirname, 'end.html'),
        qualtrics:   resolve(__dirname, 'qualtrics.html'),
      },
    },
  },
})
