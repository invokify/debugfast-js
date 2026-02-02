<script setup lang="ts">
import { ref } from 'vue';
import BugFast from 'bugfast-js';
import { useBugFastErrorHandler } from 'bugfast-js/vue';
import BuggyComponent from './BuggyComponent.vue';

const showBuggy = ref(false);
const inputValue = ref('');

const { captureError } = useBugFastErrorHandler();

const triggerGlobalError = () => {
  setTimeout(() => {
    throw new Error('Global error from setTimeout!');
  }, 0);
};

const triggerUnhandledRejection = () => {
  Promise.reject(new Error('Unhandled promise rejection!'));
};

const triggerManualCapture = () => {
  try {
    JSON.parse('invalid json {{{');
  } catch (error) {
    BugFast.captureError(error as Error, {
      extra: { context: 'Parsing user input in Vue' },
      tags: { feature: 'json-parser', framework: 'vue' },
    });
  }
};

const triggerComposableCapture = () => {
  captureError(new Error('Error from useBugFastErrorHandler'), {
    source: 'composable',
  });
};

const triggerConsoleError = () => {
  console.error('This is a console error from Vue!');
  console.warn('This is a warning from Vue');
  console.log('This is a log message from Vue');
};

const triggerNetworkRequest = async () => {
  try {
    await fetch('https://httpbin.org/get');
    console.log('Request succeeded');
    await fetch('https://httpbin.org/status/500');
  } catch (error) {
    console.error('Network error:', error);
  }
};
</script>

<template>
  <div class="container">
    <h1>BugFast-JS Vue Test App</h1>
    <p>Open the browser console to see BugFast debug output.</p>

    <div class="controls">
      <section>
        <h3>Test User Actions</h3>
        <input
          type="text"
          placeholder="Type something..."
          v-model="inputValue"
        />
        <input
          type="password"
          placeholder="Password (will be masked)"
        />
      </section>

      <section>
        <h3>Trigger Errors</h3>
        <button @click="showBuggy = true">
          Trigger Vue Component Error
        </button>
        <button @click="triggerGlobalError">
          Trigger Global Error
        </button>
        <button @click="triggerUnhandledRejection">
          Trigger Unhandled Rejection
        </button>
        <button @click="triggerManualCapture">
          Trigger Manual Capture
        </button>
        <button @click="triggerComposableCapture">
          Trigger Composable Capture
        </button>
      </section>

      <section>
        <h3>Test Collectors</h3>
        <button @click="triggerConsoleError">
          Trigger Console Logs
        </button>
        <button @click="triggerNetworkRequest">
          Trigger Network Requests
        </button>
      </section>
    </div>

    <BuggyComponent v-if="showBuggy" />
  </div>
</template>

<style scoped>
.container {
  padding: 20px;
  font-family: system-ui, sans-serif;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 400px;
}

h1 {
  color: #42b883;
  margin-bottom: 10px;
}

p {
  color: #666;
  margin-bottom: 20px;
}
</style>
