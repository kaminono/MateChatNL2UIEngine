import { ref } from 'vue';
import type { UiDsl } from './useNlParser';

export function useCodeGenerator() {
  
  // 缩进辅助函数
  const indent = (level: number) => '  '.repeat(level);

  // 1. 属性序列化：把 JSON props 转为 Vue props 字符串
  // 例如: { label: "姓名", required: true } -> 'label="姓名" :required="true"'
  const serializeProps = (props: Record<string, any> = {}) => {
    return Object.entries(props)
      .map(([key, val]) => {
        if (typeof val === 'string') return `${key}="${val}"`;
        return `:${key}="${val}"`; // 布尔值或数字使用绑定语法
      })
      .join(' ');
  };

  // 2. 递归生成 Template 代码
  const generateTemplateNode = (node: any, level: number): string => {
    // 处理纯文本
    if (typeof node === 'string' || typeof node === 'number') {
      return `${indent(level)}${node}`;
    }

    const tagName = node.component;
    const propsStr = serializeProps(node.props);
    const startTag = propsStr ? `<${tagName} ${propsStr}>` : `<${tagName}>`;
    
    // 如果没有子节点，直接闭合
    if (!node.children || node.children.length === 0) {
      return `${indent(level)}${startTag}</${tagName}>`;
    }

    // 递归处理子节点
    const childrenStr = node.children
      .map((child: any) => generateTemplateNode(child, level + 1))
      .join('\n');

    return `${indent(level)}${startTag}\n${childrenStr}\n${indent(level)}</${tagName}>`;
  };

  // 3. 主生成函数：DSL -> Vue SFC String
  const generateVueCode = (dsl: UiDsl) => {
    if (!dsl || !dsl.components) return '';

    // A. 生成 Template
    const layoutClass = dsl.page.layout === 'grid' ? 'grid-layout' : 'flow-layout';
    const templateBody = dsl.components
      .map(node => generateTemplateNode(node, 2))
      .join('\n');

    const templateCode = 
`<template>
  <div class="generated-page ${layoutClass}">
    ${templateBody}
  </div>
</template>`;

    // B. 生成 Script (简单的按需引入推断)
    // 提取所有用到的组件名并去重
    const usedComponents = new Set<string>();
    const traverse = (nodes: any[]) => {
      nodes.forEach(node => {
        if (node.component) usedComponents.add(node.component);
        if (node.children) traverse(node.children);
      });
    };
    traverse(dsl.components);
    
    // 将 kebab-case (d-button) 转为 PascalCase (Button) 以便 import
    // 这里为了演示简单，假设组件库支持解构引入
    // 实际工程中可能需要更复杂的映射表
    const imports = Array.from(usedComponents)
      .filter(c => c.startsWith('d-')) // 只处理 DevUI 组件
      .map(c => `// import { ${toPascalCase(c)} } from 'vue-devui';`)
      .join('\n');

    const scriptCode = 
`<script setup lang="ts">
import { ref } from 'vue';
// 请确保已安装 vue-devui
${imports}
</script>`;

    // C. 生成 Style
    const styleCode = 
`<style scoped>
.generated-page { padding: 20px; }
.grid-layout { display: flex; flex-wrap: wrap; gap: 16px; }
.flow-layout { display: flex; flex-direction: column; gap: 16px; }
</style>`;

    return `${scriptCode}\n\n${templateCode}\n\n${styleCode}`;
  };

  // 辅助：kebab-case 转 PascalCase
  const toPascalCase = (str: string) => 
    str.replace(/(^\w|-\w)/g, clearAndUpper);
  const clearAndUpper = (text: string) => 
    text.replace(/-/, "").toUpperCase();

  return { generateVueCode };
}