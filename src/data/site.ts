export const SITE = {
  url: 'https://wanghao-sunsky.github.io',
  title: 'SunSky 的 AI Agent 工程笔记',
  shortTitle: 'SunSky',
  description:
    'SunSky 的中文技术博客：读 AI Agent 源码、做实验和做项目时的记录，主题包括 Agent 架构、工具调用、长期记忆、评测和安全。',
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
