import { defineConfig } from 'vite';

export default defineConfig({
  // base './' → rutas relativas en el bundle → funciona en GitHub Pages
  // (ya sea en /repo-name/ o en raíz) y con Live Server sobre la carpeta dist/
  base: './',

  server: {
    port: 3000,
    open: true,
  },

  build: {
    outDir: 'dist',
    // Subir el límite del warning de chunk (Phaser es grande por naturaleza)
    chunkSizeWarningLimit: 2000,
    // Publicar el juego (index.html) y también la landing page (landing.html)
    rollupOptions: {
      input: {
        main: 'index.html',
        landing: 'landing.html',
      },
    },
  },
});
