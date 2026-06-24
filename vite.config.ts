import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import tailwindcss from '@tailwindcss/vite';
import VueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
    // Carrega o arquivo env baseado em `mode` no diretório de trabalho atual.
    // Defina o terceiro parâmetro como '' para carregar todos os ambientes, independentemente do
    // Prefixo `VITE_`.
    const env = loadEnv(mode, process.cwd(), '');

    const configBase = {
        plugins: [
            vue({
                template: {
                    transformAssetUrls: {
                        base: null,
                        includeAbsolute: false,
                    },
                },
            }),
            VueDevTools({
                launchEditor: env?.VITE_VUE_DEVTOOLS_LAUNCH_EDITOR || 'code', // 'antigravity' | 'code', ...
                // launchEditor: 'antigravity', // 'antigravity' | 'code', ...
                // appendTo: 'src/main.ts',
                openInEditorHost: env?.VITE_VUE_DEVTOOLS_EDITOR_HOST || 'https://open-in-editor-server.local.com',
            }),
            tailwindcss(),
            //
        ],

        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
                '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
                '@layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
                '@types': fileURLToPath(new URL('./src/types', import.meta.url)),
                '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
                '@router': fileURLToPath(new URL('./src/router', import.meta.url)),
                '@composables': fileURLToPath(new URL('./src/composables', import.meta.url)),
                '@views': fileURLToPath(new URL('./src/views', import.meta.url)),
                '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
                '@stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
                '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
                '@public': fileURLToPath(new URL('./public', import.meta.url)),
            },
        },
    };

    if (command === 'serve') {
        return {
            ...configBase,
            // Example: use an env var to set the dev server port conditionally.
            server: {
                port: env.APP_PORT ? Number(env.APP_PORT) || 5173 : 5173,
                watcher: {
                    awaitWriteFinish: true,

                    // Arquivos ignorados
                    ignored: [
                        'node_modules',
                        '.git',
                        'public',
                        'no-commit',
                        //
                    ],
                },

                host: '0.0.0.0',
                // allowedHosts: true,
                allowedHosts: [
                    'app.mkpayments.com.br',
                    'app.hml.mkpayments.com.br',
                    'app.local.mkpayments.com.br',
                    //
                ],
            },
            hmr: {
                host: 'localhost', // ou o hostname que o browser está usando
                port: env.APP_PORT ? Number(env.APP_PORT) || 5173 : 5173,
            },
        };
    }

    return configBase;
});
