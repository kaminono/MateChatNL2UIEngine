<template>
  <div class="chart-box">
    <svg width="100%" height="100%" viewBox="0 0 500 150" preserveAspectRatio="none">
      <path d="M0,150 L0,100 L100,50 L200,120 L300,30 L400,80 L500,20 L500,150 Z" fill="rgba(94, 124, 224, 0.1)" />
      <path d="M0,100 L100,50 L200,120 L300,30 L400,80 L500,20" fill="none" stroke="#5e7ce0" stroke-width="3" />
    </svg>
  </div>
</template>
<style scoped>
.chart-box { width: 100%; height: 200px; border: 1px dashed #eee; border-radius: 4px; overflow: hidden; }
</style>