import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'node:path';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Fail the build if a future change accidentally pulls the backend into the demo.
function assertPreviewIsolation(): Plugin {
  return {
    name: 'assert-preview-isolation',
    generateBundle() {
      for (const id of this.getModuleIds()) {
        if (id.includes('@supabase/') || id.includes('/integrations/supabase/') || id.includes('/hooks/useAuth')) {
          this.error(`Backend module is forbidden in the standalone preview: ${id}`);
        }
      }
    },
  };
}

export default defineConfig({
  root: path.resolve(__dirname, 'preview'),
  publicDir: false,
  plugins: [react(), assertPreviewIsolation()],
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  css: {
    postcss: {
      plugins: [
        // Reuse the app theme, but remove remote font imports from this isolated build.
        { postcssPlugin: 'preview-local-fonts', AtRule: { import(rule) { rule.remove(); } } },
        tailwindcss({ config: path.resolve(__dirname, 'tailwind.config.ts') }),
        autoprefixer(),
      ],
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'preview-dist'),
    emptyOutDir: true,
  },
});
