import { createApp } from 'vue';
import DebugFast from 'debugfast-js';
import { debugfastPlugin } from 'debugfast-js/vue';
import App from './App.vue';
import './style.css';

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

// Set user info
DebugFast.setUser({
  id: 'vue-test-user-123',
  email: 'vue-test@example.com',
  name: 'Vue Test User',
});

const app = createApp(App);

// Install the DebugFast Vue plugin
app.use(debugfastPlugin, {
  captureComponentInfo: true,
});

app.mount('#app');
