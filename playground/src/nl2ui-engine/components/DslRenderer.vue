<script setup lang="ts">
import { defineAsyncComponent, h } from 'vue';

// 接收 DSL 数据
const props = defineProps<{ dsl: any }>();

// --- 1. 组件注册表 ---
const loadDevUI = (name: string) => defineAsyncComponent({
  loader: () => import('vue-devui').then(m => {
    const component = (m as any)[name];
    if (!component) console.warn(`⚠️ 组件 ${name} 未导出`);
    return component;
  }),
  onError: (error) => console.error(`Failed to load ${name}:`, error)
});

const componentRegistry: Record<string, any> = {
  // 布局与容器
  'd-row': loadDevUI('Row'),
  'd-col': loadDevUI('Col'),
  'd-card': loadDevUI('Card'),
  'd-card-header': loadDevUI('CardHeader'),
  'd-card-content': loadDevUI('CardContent'),
  
  // 表单核心
  'd-form': loadDevUI('Form'),
  'd-form-item': loadDevUI('FormItem'),
  'd-input': loadDevUI('Input'),
  'd-select': loadDevUI('Select'),
  'd-button': loadDevUI('Button'), // 确保 Button 注册了
  'd-textarea': loadDevUI('Textarea'),
  
  // 自定义组件
  'simple-stat': defineAsyncComponent(() => import('./SimpleStat.vue')),
  'simple-chart': defineAsyncComponent(() => import('./SimpleChart.vue')),
};

// --- 2. 核心渲染函数 (已修复文本节点问题) ---
const renderNode = (node: any): any => {
  // 情况 A: 空节点
  if (!node) return null;
  
  // ✅ 修复点 1: 处理纯文本节点 (如果 AI 把文字放在 children 里)
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }

  // 情况 B: 正常组件节点
  let Component = componentRegistry[node.component];
  
  // 兜底: 未知组件渲染红框
  if (!Component) {
    return h('div', { 
      style: 'border: 1px dashed red; padding: 5px; color: red; font-size: 12px; display: inline-block;' 
    }, `[未知: ${node.component}]`);
  }

  // 处理子节点
  let childrenSlot: any = undefined;
  if (node.children && node.children.length > 0) {
    childrenSlot = {
      default: () => node.children.map((child: any) => renderNode(child))
    };
  }

  // 处理属性
  const nodeProps = { ...node.props };
  
  // 样式补丁
  if (node.span) {
    nodeProps.style = { 
      ...(nodeProps.style || {}),
      flex: `0 0 ${(node.span / 24) * 100}%`,
      maxWidth: `${(node.span / 24) * 100}%`
    };
  }
  if (['d-input', 'd-select', 'd-textarea'].includes(node.component)) {
    nodeProps.style = { ...nodeProps.style, width: '100%' };
  }
  
  // ✅ 修复点 2: 按钮特殊处理 (DevUI Button 内容既可以是 slot 也可以是 props)
  // 如果 AI 把 content 放在 props 里，我们不用管；
  // 如果 AI 把文字放在 children 里，childrenSlot 已经处理好了。

  return h(Component, nodeProps, childrenSlot);
};

// --- 3. 根渲染 ---
const renderRoot = () => {
  if (!props.dsl || !props.dsl.components) return null;
  const layoutClass = props.dsl.page?.layout === 'grid' ? 'dsl-grid-layout' : 'dsl-flow-layout';
  
  return h('div', { class: `renderer-root ${layoutClass}` }, 
    props.dsl.components.map((node: any) => renderNode(node))
  );
};
</script>

<template>
  <component :is="renderRoot" />
</template>

<style>
.dsl-grid-layout { display: flex; flex-wrap: wrap; gap: 16px; align-items: stretch; }
.dsl-flow-layout { display: flex; flex-direction: column; gap: 16px; }
.renderer-root { width: 100%; }
</style>