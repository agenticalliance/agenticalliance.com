import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from 'fs';
import { componentTagger } from "lovable-tagger";

// Helper function to copy special files
function copySpecialFiles() {
  return {
    name: 'copy-special-files',
    closeBundle() {
      // Ensure .nojekyll and CNAME files are copied to the build output
      if (fs.existsSync('.nojekyll')) fs.copyFileSync('.nojekyll', 'dist/.nojekyll');
      if (fs.existsSync('CNAME')) fs.copyFileSync('CNAME', 'dist/CNAME');
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // Listen on all addresses
    port: 8080,
    strictPort: true, // Fail if port is in use
    open: true, // Open browser on server start
    cors: true, // Enable CORS
  },
  build: { outDir: 'dist' }, // Build to the dist folder for GitHub Pages
  base: '/', // Base to root for custom domain
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    copySpecialFiles(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
