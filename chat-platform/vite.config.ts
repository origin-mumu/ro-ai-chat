import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite' 


export default defineConfig({
  plugins: [vue(),tailwindcss],
  server:{
    proxy:{
      '/api/mimo':{
        target:'https://api.xiaomimimo.com',
        changeOrigin:true,
        rewrite:(path)=>path.replace(/^\/api\/mimo/,'')
      },
      '/api/qwen-plus':{
        target:'https://dashscope.aliyuncs.com/compatible-mode',
        changeOrigin:true,
        rewrite:(path)=>path.replace(/^\/api\/qwen-plus/,'')
      }
    }
  }
})
