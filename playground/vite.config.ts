import { defineConfig } from 'vite'
import Vue from '@vitejs/plugin-vue'
import DeployCheck from '../src/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    Vue(),
    DeployCheck(),
  ],
})
