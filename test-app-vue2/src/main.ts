import Vue from 'vue';
import DebugFast from 'debugfast-js';
import { debugfastPlugin } from 'debugfast-js/vue';
import App from './App.vue';
import './style.css';

Vue.config.productionTip = false;

// Initialize DebugFast
DebugFast.init({
  apiEndpoint: 'https://httpbin.org/post',
  apiKey: 'test-api-key',
  captureScreenshot: true,
  captureConsole: true,
  captureNetwork: true,
  captureDom: true,
  captureUserActions: true,
  debug: true,
  beforeSend: (report) => {
    console.log('DebugFast Report:', report);
    return report;
  },
});

// Demo store: attached to every report via the state capture API
const settings = Vue.observable({ theme: 'dark', locale: 'fr', apiKey: 'demo-secret' });
DebugFast.registerStore('settings', () => settings, 'custom');

// Set user info
DebugFast.setUser({
  id: 'vue2-test-user-123',
  email: 'vue2-test@example.com',
  name: 'Vue 2 Test User',
});

// Install the DebugFast Vue plugin. Vue 2 passes the Vue constructor to
// install(), which exposes the same `config.errorHandler` / `config.warnHandler`
// hooks the plugin sets on a Vue 3 app. The plugin is typed against Vue 3's
// `App`, hence the cast.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
Vue.use(debugfastPlugin as any, {
  captureComponentInfo: true,
});

new Vue({
  render: (h) => h(App),
}).$mount('#app');
