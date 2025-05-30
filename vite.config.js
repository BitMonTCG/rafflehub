import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export default defineConfig({
    plugins: [
        react(),
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "client", "src"),
            "@shared": path.resolve(__dirname, "shared"),
            "@assets": path.resolve(__dirname, "attached_assets"),
        },
    },
    root: path.resolve(__dirname, "client"),
    build: {
        outDir: path.resolve(__dirname, "dist"),
        emptyOutDir: true,
    },
    server: {
        hmr: false,
        proxy: {
            // Forward requests for /api to the backend server
            '/api': {
                target: 'http://localhost:3000', // Your backend server
                changeOrigin: true, // Recommended for virtual hosted sites
                // secure: false, // Uncomment if your backend is on HTTPS with a self-signed cert
            },
        },
    },
});
