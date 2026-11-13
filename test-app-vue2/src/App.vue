<script lang="ts">
import Vue from 'vue';
import DebugFast from 'debugfast-js';
import BuggyComponent from './components/BuggyComponent.vue';

export default Vue.extend({
  name: 'App',
  components: { BuggyComponent },
  data() {
    return {
      showBuggy: false,
      inputValue: '',
      counter: 0,
    };
  },
  methods: {
    triggerComponentError(): void {
      this.showBuggy = true;
    },
    triggerHandlerError(): void {
      // Thrown inside a v-on handler: Vue 2 routes it to config.errorHandler
      // with info "v-on handler".
      throw new Error('Error thrown from a Vue 2 v-on handler!');
    },
    triggerWatcherError(): void {
      this.counter += 1;
    },
    triggerGlobalError(): void {
      setTimeout(() => {
        throw new Error('Global error from setTimeout!');
      }, 0);
    },
    triggerUnhandledRejection(): void {
      Promise.reject(new Error('Unhandled promise rejection!'));
    },
    triggerManualCapture(): void {
      try {
        JSON.parse('invalid json {{{');
      } catch (error) {
        DebugFast.captureError(error as Error, {
          extra: { context: 'Parsing user input in Vue 2' },
          tags: { feature: 'json-parser', framework: 'vue2' },
        });
      }
    },
    triggerConsoleError(): void {
      console.error('This is a console error from Vue 2!');
      console.warn('This is a warning from Vue 2');
      console.log('This is a log message from Vue 2');
    },
    async triggerNetworkRequest(): Promise<void> {
      try {
        await fetch('https://httpbin.org/get');
        console.log('Request succeeded');
        await fetch('https://httpbin.org/status/500');
      } catch (error) {
        console.error('Network error:', error);
      }
    },
  },
  watch: {
    counter(value: number): void {
      if (value > 0) {
        throw new Error(`Error thrown from a Vue 2 watcher (counter=${value})`);
      }
    },
  },
});
</script>

<template>
  <div class="container">
    <h1>DebugFast-JS Vue 2 Test App</h1>
    <p>Vue CLI 4 (webpack 4) + TypeScript + Babel. Open the console to see DebugFast debug output.</p>

    <div class="controls">
      <section>
        <h3>Test User Actions</h3>
        <input v-model="inputValue" type="text" placeholder="Type something..." />
        <input type="password" placeholder="Password (will be masked)" />
      </section>

      <section>
        <h3>Trigger Errors</h3>
        <button @click="triggerComponentError">Trigger Vue Component Error</button>
        <button @click="triggerHandlerError">Trigger v-on Handler Error</button>
        <button @click="triggerWatcherError">Trigger Watcher Error</button>
        <button @click="triggerGlobalError">Trigger Global Error</button>
        <button @click="triggerUnhandledRejection">Trigger Unhandled Rejection</button>
        <button @click="triggerManualCapture">Trigger Manual Capture</button>
      </section>

      <section>
        <h3>Test Collectors</h3>
        <button @click="triggerConsoleError">Trigger Console Logs</button>
        <button @click="triggerNetworkRequest">Trigger Network Requests</button>
      </section>
    </div>

    <BuggyComponent v-if="showBuggy" label="from-app" />
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
