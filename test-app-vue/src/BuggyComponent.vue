<script setup lang="ts">
// This component throws an error during setup
throw new Error('This Vue component always crashes!');
</script>

<template>
  <div>This will never render</div>
</template>
