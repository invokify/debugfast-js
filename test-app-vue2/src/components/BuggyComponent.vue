<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'BuggyComponent',
  props: {
    label: { type: String, default: 'buggy' },
  },
  created() {
    throw new Error('This Vue 2 component always crashes!');
  },
});
</script>

<template>
  <div>This will never render</div>
</template>
