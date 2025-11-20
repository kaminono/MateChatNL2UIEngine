<script setup lang="ts">
import { ref, computed } from 'vue';
import { useClipboard } from '@vueuse/core';

// 引入 MateChat 原子组件
// import McLayout from '@matechat/core/layout';
// import McHeader from '@matechat/core/header';
// import McLayoutContent from '@matechat/core/layout-content';
// import McLayoutSender from '@matechat/core/layout-sender';
// import McBubble from '@matechat/core/bubble';
// import McInput from '@matechat/core/input';
// import McPrompt from '@matechat/core/prompt'; // ✨ 新增引入

import DslRenderer from './components/DslRenderer.vue';
import ConfigPanel from './components/ConfigPanel.vue';
import { useNlParser } from './composables/useNlParser';
import { useCodeGenerator } from './composables/useCodeGenerator';
import logoUrl from '../assets/logo.svg';

const { isGenerating, currentDsl, parseCommand } = useNlParser();
const { generateVueCode } = useCodeGenerator();
const { copy, copied } = useClipboard();

const inputValue = ref('');
const showConfig = ref(false);
const viewMode = ref<'preview' | 'code'>('preview');

const messages = ref<any[]>([
  { id: 1, role: 'admin', content: '我是 MateChat UI 生成引擎。您可以直接输入需求，或点击下方快捷指令体验。' }
]);

// ✨ 定义快捷指令数据
const promptData = ref([
  {
    value: 'dashboard',
    label: '生成销售看板',
    iconConfig: { name: 'icon-data-group', color: '#5e7ce0' },
    desc: '生成包含KPI卡片与趋势图的数据大屏',
  },
  {
    value: 'form',
    label: '创建用户注册表单',
    iconConfig: { name: 'icon-edit', color: '#3ac295' },
    desc: '生成包含姓名、邮箱校验的录入界面',
  },
]);

// 实时计算生成的代码
const sourceCode = computed(() => {
  if (!currentDsl.value) return '';
  return generateVueCode(currentDsl.value);
});

const onSubmit = async (val: string) => {
  if (!val.trim()) return;
  
  messages.value.push({ id: Date.now(), role: 'user', content: val });
  const userText = val; // 使用传入的值，可能是输入框的，也可能是 prompt 的
  inputValue.value = '';

  messages.value.push({ id: 'loading', role: 'admin', content: 'AI 正在构建组件树...', type: 'text' });
  
  viewMode.value = 'preview'; 
  
  const reply = await parseCommand(userText);
  messages.value = messages.value.filter(m => m.id !== 'loading');
  messages.value.push({ id: Date.now() + 1, role: 'admin', content: reply });
};

// ✨ 处理 Prompt 点击
const onPromptClick = (item: any) => {
  // item 是 promptData 中的对象，直接取 label 发送
  // 注意：DevUI/MateChat 的 Prompt itemClick 有时返回 item 对象，有时返回 label 字符串，视版本而定
  // 这里做个兼容处理
  const text = item.label || item;
  onSubmit(text);
};

const handleCopy = () => {
  copy(sourceCode.value);
};
</script>

<template>
  <div class="nl2ui-layout">
    <div class="panel-chat">
      <McLayout class="chat-container">
        <McHeader title="NL2UI Engine" :logo-img="logoUrl" />
        
        <McLayoutContent class="chat-body">
          <div class="chat-scroll-area">
            <div class="msg-list">
              <McBubble 
                v-for="msg in messages" 
                :key="msg.id"
                :content="msg.content"
                :align="msg.role === 'user' ? 'right' : 'left'"
                :loading="msg.id === 'loading'"
              />
            </div>

            <div class="prompt-wrapper">
              <div class="prompt-title">试一试默认指令：</div>
              <McPrompt 
                :list="promptData" 
                @itemClick="onPromptClick" 
              />
            </div>
          </div>
        </McLayoutContent>

        <McLayoutSender>
          <McInput 
            :value="inputValue" 
            placeholder="或输入自定义需求..." 
            @change="(v: string) => inputValue = v"
            @submit="onSubmit"
          />
        </McLayoutSender>
      </McLayout>
    </div>

    <div class="panel-preview">
      <div class="preview-toolbar">
        <div class="tabs">
          <button 
            class="tab-btn" 
            :class="{ active: viewMode === 'preview' }"
            @click="viewMode = 'preview'"
          >
            👁️ 实时预览
          </button>
          <button 
            class="tab-btn" 
            :class="{ active: viewMode === 'code' }"
            @click="viewMode = 'code'"
          >
            🧑‍💻 查看源码
          </button>
        </div>

        <div class="actions">
          <span v-if="isGenerating" class="status-tag generating">生成中...</span>
          <button class="icon-btn" @click="showConfig = true" title="配置 AI">⚙️</button>
        </div>
      </div>
      
      <div class="preview-body">
        <div v-if="viewMode === 'preview'" class="preview-canvas-wrapper">
          <div v-if="currentDsl" class="preview-canvas">
            <div class="page-header">{{ currentDsl.page.title }}</div>
            <DslRenderer :dsl="currentDsl" />
          </div>
          <div v-else class="empty-state">
            <div class="icon">🎨</div>
            <p>请在左侧选择指令生成界面</p>
          </div>
        </div>

        <div v-else class="code-editor-wrapper">
          <div v-if="sourceCode" class="code-box">
            <div class="code-header">
              <span>Vue SFC (Generated)</span>
              <button class="copy-btn" @click="handleCopy">
                {{ copied ? '✅ 已复制' : '📋 复制源码' }}
              </button>
            </div>
            <textarea readonly class="code-viewer" :value="sourceCode"></textarea>
          </div>
          <div v-else class="empty-state">
            <p>暂无生成的代码</p>
          </div>
        </div>
      </div>
    </div>

    <ConfigPanel v-model:visible="showConfig" />
  </div>
</template>

<style scoped>
/* 复用样式 */
.nl2ui-layout { display: flex; height: 100vh; width: 100%; background: #f3f6f8; }
.panel-chat { width: 380px; border-right: 1px solid #eef0f2; background: #fff; display: flex; flex-direction: column; }
.chat-container { height: 100% !important; }
.chat-body { padding: 0; overflow-y: hidden; display: flex; flex-direction: column; }

/* 优化滚动区域 */
.chat-scroll-area {
  padding: 16px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.msg-list { display: flex; flex-direction: column; gap: 16px; }

/* Prompt 样式 */
.prompt-wrapper {
  margin-top: auto; /* 即使消息少，也推到底部附近，或者紧跟消息 */
  padding-top: 10px;
  border-top: 1px dashed #f0f0f0;
}
.prompt-title {
  font-size: 12px; color: #999; margin-bottom: 8px; margin-left: 4px;
}

/* 右侧样式保持不变 */
.panel-preview { flex: 1; display: flex; flex-direction: column; background: #f0f2f5; }
.preview-toolbar { height: 56px; background: #fff; border-bottom: 1px solid #ddd; display: flex; align-items: center; padding: 0 24px; justify-content: space-between; }

.tabs { display: flex; gap: 24px; height: 100%; }
.tab-btn { 
  border: none; background: none; cursor: pointer; 
  font-size: 14px; font-weight: 500; color: #666;
  height: 100%; border-bottom: 2px solid transparent;
}
.tab-btn.active { color: #5e7ce0; border-bottom-color: #5e7ce0; }
.tab-btn:hover { color: #5e7ce0; }

.actions { display: flex; align-items: center; gap: 10px; }
.icon-btn { border: none; background: none; cursor: pointer; font-size: 18px; padding: 4px; border-radius: 4px; }
.icon-btn:hover { background: #eee; }

.preview-body { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.preview-canvas-wrapper { flex: 1; padding: 32px; overflow-y: auto; display: flex; justify-content: center; align-items: flex-start; }
.preview-canvas { width: 100%; max-width: 960px; background: #fff; padding: 32px; border-radius: 8px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); min-height: 400px; }
.page-header { font-size: 22px; font-weight: bold; margin-bottom: 24px; border-left: 4px solid #5e7ce0; padding-left: 12px; color: #252b3a; }

.code-editor-wrapper { flex: 1; padding: 20px; display: flex; }
.code-box { width: 100%; display: flex; flex-direction: column; background: #1e1e1e; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
.code-header { background: #2d2d2d; padding: 10px 16px; display: flex; justify-content: space-between; align-items: center; color: #ccc; font-size: 12px; }
.copy-btn { background: #5e7ce0; border: none; color: #fff; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; }
.code-viewer { flex: 1; background: #1e1e1e; color: #d4d4d4; border: none; padding: 16px; font-family: 'Consolas', 'Monaco', monospace; font-size: 14px; line-height: 1.5; resize: none; outline: none; }

.empty-state { margin: auto; text-align: center; color: #999; }
.empty-state .icon { font-size: 48px; margin-bottom: 16px; opacity: 0.3; }
.status-tag { font-size: 12px; padding: 2px 8px; border-radius: 4px; margin-left: 8px; }
.status-tag.generating { background: #e8f3ff; color: #2b85e4; }
.status-tag.ready { background: #eafff1; color: #3ac295; }
</style>