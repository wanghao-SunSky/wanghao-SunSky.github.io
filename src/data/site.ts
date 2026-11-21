export const SITE = {
  url: 'https://wanghao-sunsky.github.io',
  title: 'SunSky 的 AI Agent 工程笔记',
  shortTitle: 'SunSky',
  description:
    'SunSky 的 AI Agent 工程博客：3 年后端转 Agent 工程，记录拆解源码、划定工具与状态边界，以及重度 AI-Native 多模型协作的一线实战。',
  lang: 'zh-CN',
};

export const AUTHOR = {
  name: 'SunSky',
  github: 'https://github.com/wanghao-SunSky',
  x: 'https://x.com/sunsky1125',
};

export const TOPICS: Record<string, { name: string; summary: string }> = {
  'agent-architecture': { name: 'Agent 架构', summary: 'Agent 循环、规划、执行与状态' },
  'tool-calling': { name: '工具调用', summary: '工具权限、预算和失败处理' },
  'agent-memory': { name: 'Agent 记忆', summary: '长期记忆怎么写入、检索、更新和遗忘' },
  'agent-evaluation': { name: '评测', summary: '评测设计、回归测试和可靠性' },
  'agent-security': { name: 'Agent 安全', summary: '提示词注入、权限边界和安全控制' },
};

export const TYPE_LABEL: Record<string, string> = {
  explainer: '原理解读',
  experiment: '实验',
  'case-study': '项目复盘',
  perspective: '观点',
  'reading-note': '阅读笔记',
};
