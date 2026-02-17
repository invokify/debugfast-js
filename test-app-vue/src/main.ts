import { createApp } from 'vue';
import BugFast from 'bugfast-js';
import { bugfastPlugin } from 'bugfast-js/vue';
import App from './App.vue';
import './style.css';

// Initialize BugFast
BugFast.init({
  apiEndpoint: 'http://localhost:3001/v1/events', // Single events go here, batches go to /batch
  apiKey: 'f76bf7ae-669f-4dc7-b406-431e67f635a9:03333005c455472c92a559c263981e82',
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
