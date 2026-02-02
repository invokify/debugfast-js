import { createApp } from 'vue';
import BugFast from 'bugfast-js';
import { bugfastPlugin } from 'bugfast-js/vue';
import App from './App.vue';
import './style.css';

// Initialize BugFast
BugFast.init({
  apiEndpoint: 'https://httpbin.org/post',
  apiKey: 'test-api-key',
  captureScreenshot: true,
  captureConsole: true,
  captureNetwork: true,
  captureDom: true,
  captureUserActions: true,
  debug: true,
  beforeSend: (report) => {
    console.log('BugFast Report:', report);
    return report;
  },
});

// Set user info
BugFast.setUser({
  id: 'vue-test-user-123',
  email: 'vue-test@example.com',
  name: 'Vue Test User',
});

const app = createApp(App);

// Install the BugFast Vue plugin
app.use(bugfastPlugin, {
  captureComponentInfo: true,
});

app.mount('#app');
