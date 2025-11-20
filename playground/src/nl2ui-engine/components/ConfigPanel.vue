<script setup lang="ts">
import { ref } from 'vue';
// 使用 DevUI 组件构建配置表单
import { defineAsyncComponent } from 'vue';

// 动态加载组件以避免类型检查问题
const DButton = defineAsyncComponent(() => import('vue-devui').then(m => m.Button));
const DInput = defineAsyncComponent(() => import('vue-devui').then(m => m.Input));
const DModal = defineAsyncComponent(() => import('vue-devui').then(m => m.Modal));

const props = defineProps<{ visible: boolean }>();
const emit = defineEmits(['update:visible', 'save']);

const apiKey = ref(localStorage.getItem('nl2ui_api_key') || '');
const baseUrl = ref(localStorage.getItem('nl2ui_base_url') || 'https://api.deepseek.com');
const model = ref(localStorage.getItem('nl2ui_model') || 'deepseek-chat');

const handleSave = () => {
  localStorage.setItem('nl2ui_api_key', apiKey.value);
  localStorage.setItem('nl2ui_base_url', baseUrl.value);
  localStorage.setItem('nl2ui_model', model.value);
  
  emit('save');
  emit('update:visible', false);
};

const handleClose = () => {
  emit('update:visible', false);
};
</script>

<template>
  <div v-if="visible" class="config-modal-overlay">
    <div class="config-modal">
      <div class="modal-header">
        <h3>🤖 AI 引擎配置</h3>
        <span class="close-btn" @click="handleClose">×</span>
      </div>
      <div class="modal-body">
        <div class="form-item">
          <label>Base URL</label>
          <input v-model="baseUrl" placeholder="https://api.openai.com/v1" class="native-input" />
        </div>
        <div class="form-item">
          <label>Model Name</label>
          <input v-model="model" placeholder="gpt-3.5-turbo" class="native-input" />
        </div>
        <div class="form-item">
          <label>API Key</label>
          <input v-model="apiKey" type="password" placeholder="sk-..." class="native-input" />
        </div>
        <div class="tips">
          提示：Key 仅存储在本地浏览器，不会上传服务器。
          <br/>推荐使用支持 JSON Mode 的模型 (如 GPT-4o, DeepSeek-V3)。
        </div>
      </div>
      <div class="modal-footer">
        <button class="native-btn cancel" @click="handleClose">取消</button>
        <button class="native-btn primary" @click="handleSave">保存配置</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 为了减少依赖，这里写了一些原生样式模拟 Modal */
.config-modal-overlay {
  position: fixed; top: 0; left: 0; width: 100%; height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex; justify-content: center; align-items: center;
}
.config-modal {
  background: #fff; width: 400px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: hidden;
}
.modal-header {
  padding: 16px 24px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center;
}
.modal-header h3 { margin: 0; font-size: 16px; }
.close-btn { cursor: pointer; font-size: 20px; color: #999; }
.modal-body { padding: 24px; }
.form-item { margin-bottom: 16px; }
.form-item label { display: block; margin-bottom: 8px; font-size: 12px; color: #666; }
.native-input {
  width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;
}
.tips { font-size: 12px; color: #999; margin-top: 12px; line-height: 1.5; }
.modal-footer {
  padding: 16px 24px; background: #f9f9f9; display: flex; justify-content: flex-end; gap: 12px;
}
.native-btn {
  padding: 6px 16px; border-radius: 4px; border: 1px solid #ddd; cursor: pointer; background: #fff;
}
.native-btn.primary { background: #5e7ce0; color: #fff; border-color: #5e7ce0; }
</style>