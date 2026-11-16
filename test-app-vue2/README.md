# DebugFast-JS Vue 2 Test App

Vue 2.7 + Vue CLI 4 (webpack 4) + TypeScript + Babel, on **Node 14.21.3** (`.nvmrc`).
It reproduces a legacy toolchain that customers still run, so the SDK's published
`dist/` is consumed exactly the way webpack 4 sees it.

```bash
nvm use            # Node 14.21.3
npm install
npm run dev        # http://localhost:5175
npm run build
```

Build the SDK first (`npm run build` in `..`). `resolve.symlinks: false` in
`vue.config.js` keeps the `file:..` link from being transpiled by Babel, so it
behaves like a package installed from npm.

## Scenarios

Vue component error (`created` hook), `v-on` handler error, watcher error,
global error, unhandled rejection, manual capture, console logs, network requests,
user actions with a masked password field, and a custom store via `registerStore`.

## What this app guards

webpack 4 ignores `package.json` `exports`, so it uses the SDK's legacy build
(`dist/legacy/*.js`, ES2019) through the `module` field and the `vue/` folder.
After an SDK change, check that:

- `npm run build` succeeds, with no parse errors and `debugfast-js/vue` resolves.
- Each Vue error button logs a `DebugFast Report`. If only the manual capture
  reports, the plugin is talking to a second DebugFast instance.
