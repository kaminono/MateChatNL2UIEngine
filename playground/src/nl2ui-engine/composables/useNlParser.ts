import { ref } from 'vue';

export interface UiDsl {
  page: { title: string; layout: 'default' | 'grid' };
  components: Array<{
    component: string;
    props?: Record<string, any>;
    children?: Array<any>;
    span?: number;
  }>;
}

export function useNlParser() {
  const isGenerating = ref(false);
  const currentDsl = ref<UiDsl | null>(null);
  const errorMsg = ref('');

  // 1. 定义 System Prompt：教会 AI 我们的 DSL 语法
  const systemPrompt = `
你是一个专业的前端 UI 构建专家。你的任务是将用户的自然语言需求转换为特定的 UI DSL (JSON 格式)。

### 可用组件库 (WhiteList)
只能使用以下组件 name，不要创造不存在的组件：
1. 布局类: "d-row", "d-col" (span=1~24)
2. 容器类: "d-card" (props: title, shadow), "d-card-header", "d-card-content"
3. 表单类: "d-form", "d-form-item" (props: label, required), "d-input", "d-select" (props: options=[]), "d-button", "d-textarea"
4. 图表类: "simple-stat" (props: label, value, trend='up'|'down'), "simple-chart" (props: type='line'|'bar')

### 输出格式规范 (JSON)
必须严格遵守以下 JSON 结构，不要包含 markdown 代码块标记：
{
  "page": { "title": "页面标题", "layout": "grid" | "default" },
  "components": [
    {
      "component": "组件名",
      "props": { ...组件属性 },
      "span": 8, // 仅在 grid 布局下有效，总和 24
      "children": [ ...子组件递归 ]
    }
  ]
}

### 示例
用户: "生成一个销售卡片"
AI: { "page": {"title":"销售", "layout":"default"}, "components": [{"component":"d-card", "children": [...]}] }
`;

  // 2. 核心解析函数
  const parseCommand = async (text: string): Promise<string> => {
    isGenerating.value = true;
    errorMsg.value = '';
    
    const apiKey = localStorage.getItem('nl2ui_api_key');
    const baseUrl = localStorage.getItem('nl2ui_base_url');
    const model = localStorage.getItem('nl2ui_model');

    // 没有 Key 时，回退到 V1 版本的 Mock 数据 (兜底策略)
    if (!apiKey) {
      await new Promise(r => setTimeout(r, 1000)); // 模拟延迟
      isGenerating.value = false;
      return mockParser(text);
    }

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `用户需求: ${text}` }
          ],
          temperature: 0.2 // 低温度保证输出格式稳定
        })
      });

      if (!res.ok) throw new Error(`API Error: ${res.status}`);
      
      const data = await res.json();
      let content = data.choices[0].message.content;

      // 清洗 Markdown 标记 (防止 AI 输出 ```json ... ```)
      content = content.replace(/```json/g, '').replace(/```/g, '').trim();
      
      // 解析 JSON
      const dsl = JSON.parse(content);
      
      // 简单的校验
      if (!dsl.components || !Array.isArray(dsl.components)) {
        throw new Error('生成的 DSL 格式不合法');
      }

      currentDsl.value = dsl;
      isGenerating.value = false;
      return `已为您生成界面：${dsl.page?.title || '未命名页面'}`;

    } catch (e) {
      console.error(e);
      isGenerating.value = false;
      errorMsg.value = (e as Error).message;
      return `生成失败: ${(e as Error).message}。请检查 API Key 或 Prompt。`;
    }
  };

  // V1 Mock 逻辑 (保留作为兜底)
  const mockParser = (text: string) => {
    if (text.includes('表单')) {
        currentDsl.value = {
            page: { title: 'Mock 表单', layout: 'default' },
            components: [{ component: 'd-card', children: [{ component: 'd-button', props: { content: 'Mock 按钮' } }] }]
        };
        return '检测到未配置 Key，已展示 Mock 表单数据。请点击右上角配置 AI。';
    }
    return '未配置 AI Key，且未命中 Mock 关键词。请配置 Key 后重试。';
  };

  return { isGenerating, currentDsl, parseCommand };
}