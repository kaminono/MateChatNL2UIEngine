<template>
  <div class="simple-stat">
    <div class="label">{{ label }}</div>
    <div class="value">{{ value }}</div>
    <div class="trend" :class="trend">
      {{ trend === 'up' ? '▲ 12%' : '▼ 5%' }} 环比
    </div>
  </div>
</template>
<script setup lang="ts">
defineProps(['label', 'value', 'trend']);
</script>
<style scoped>
.simple-stat { padding: 12px; }
.label { color: #8a8e99; font-size: 12px; margin-bottom: 4px; }
.value { font-size: 24px; font-weight: bold; color: #252b3a; }
.trend { font-size: 12px; margin-top: 8px; }
.trend.up { color: #3ac295; }
.trend.down { color: #f66f6a; }
</style>