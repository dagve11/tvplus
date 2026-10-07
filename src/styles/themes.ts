// 内置主题定义
// 本文件是 shadcn/ui 重构后移植版：主题不再用 [class*=...] !important 暴力覆盖 Tailwind 类，
// 而是直接覆写 shadcn 设计 token（CSS 变量）。所有新 UI 组件读变量，旧标记不再被染色
// （过渡期降级，随各面迁移逐步消失）。--theme-primary / --theme-primary-hover 为兼容别名，
// 供音乐 token 与加载动画引用。
export const builtInThemes = {
  default: {
    name: '默认主题',
    description: '使用系统默认样式（黑白极简）',
    color: '#3b82f6',
    css: ``,
  },
  dark_blue: {
    name: '深蓝夜空',
    description: '深邃的蓝色科技风格',
    color: '#3b82f6',
    css: `
:root {
  --background: 214 100.0% 96.9%;
  --foreground: 224 64.3% 32.9%;
  --card: 0 0% 100%;
  --card-foreground: 224 64.3% 32.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 224 64.3% 32.9%;
  --primary: 221 83.2% 53.3%;
  --primary-foreground: 0 0% 98%;
  --secondary: 214 94.6% 92.7%;
  --secondary-foreground: 224 64.3% 32.9%;
  --muted: 214 94.6% 92.7%;
  --muted-foreground: 217 91.2% 59.8%;
  --accent: 214 94.6% 92.7%;
  --accent-foreground: 224 64.3% 32.9%;
  --border: 212 96.4% 78.4%;
  --input: 212 96.4% 78.4%;
  --ring: 221 83.2% 53.3%;
  --theme-primary: #2563eb;
  --theme-primary-hover: #1d4ed8;
}

.dark {
  --background: 222 47.4% 11.2%;
  --foreground: 214 31.8% 91.4%;
  --card: 217 32.6% 17.5%;
  --card-foreground: 214 31.8% 91.4%;
  --popover: 217 32.6% 17.5%;
  --popover-foreground: 214 31.8% 91.4%;
  --primary: 217 91.2% 59.8%;
  --primary-foreground: 0 0% 98%;
  --secondary: 222 47.4% 11.2%;
  --secondary-foreground: 214 31.8% 91.4%;
  --muted: 222 47.4% 11.2%;
  --muted-foreground: 215 20.2% 65.1%;
  --accent: 222 47.4% 11.2%;
  --accent-foreground: 214 31.8% 91.4%;
  --border: 215 25.0% 26.7%;
  --input: 215 25.0% 26.7%;
  --ring: 217 91.2% 59.8%;
  --theme-primary: #3b82f6;
  --theme-primary-hover: #2563eb;
}
`,
  },
  purple_dream: {
    name: '紫色梦境',
    description: '神秘的紫色渐变风格',
    color: '#a78bfa',
    css: `
:root {
  --background: 270 100.0% 98.0%;
  --foreground: 274 65.6% 32.0%;
  --card: 0 0% 100%;
  --card-foreground: 274 65.6% 32.0%;
  --popover: 0 0% 100%;
  --popover-foreground: 274 65.6% 32.0%;
  --primary: 262 83.3% 57.8%;
  --primary-foreground: 0 0% 98%;
  --secondary: 269 100.0% 95.5%;
  --secondary-foreground: 274 65.6% 32.0%;
  --muted: 269 100.0% 95.5%;
  --muted-foreground: 262 83.3% 57.8%;
  --accent: 269 100.0% 95.5%;
  --accent-foreground: 274 65.6% 32.0%;
  --border: 269 97.4% 85.1%;
  --input: 269 97.4% 85.1%;
  --ring: 262 83.3% 57.8%;
  --theme-primary: #7c3aed;
  --theme-primary-hover: #6d28d9;
}

.dark {
  --background: 266 61.4% 11.2%;
  --foreground: 269 100.0% 95.5%;
  --card: 261 48.6% 20.6%;
  --card-foreground: 269 100.0% 95.5%;
  --popover: 261 48.6% 20.6%;
  --popover-foreground: 269 100.0% 95.5%;
  --primary: 255 91.7% 76.3%;
  --primary-foreground: 0 0% 98%;
  --secondary: 266 61.4% 11.2%;
  --secondary-foreground: 269 100.0% 95.5%;
  --muted: 266 61.4% 11.2%;
  --muted-foreground: 252 94.7% 85.1%;
  --accent: 266 61.4% 11.2%;
  --accent-foreground: 269 100.0% 95.5%;
  --border: 264 67.4% 34.9%;
  --input: 264 67.4% 34.9%;
  --ring: 255 91.7% 76.3%;
  --theme-primary: #a78bfa;
  --theme-primary-hover: #8b5cf6;
}
`,
  },
  green_forest: {
    name: '翠绿森林',
    description: '清新的绿色自然风格',
    color: '#10b981',
    css: `
:root {
  --background: 152 81.0% 95.9%;
  --foreground: 164 85.7% 16.5%;
  --card: 0 0% 100%;
  --card-foreground: 164 85.7% 16.5%;
  --popover: 0 0% 100%;
  --popover-foreground: 164 85.7% 16.5%;
  --primary: 161 93.5% 30.4%;
  --primary-foreground: 0 0% 98%;
  --secondary: 149 80.4% 90.0%;
  --secondary-foreground: 164 85.7% 16.5%;
  --muted: 149 80.4% 90.0%;
  --muted-foreground: 161 93.5% 30.4%;
  --accent: 149 80.4% 90.0%;
  --accent-foreground: 164 85.7% 16.5%;
  --border: 156 71.6% 66.9%;
  --input: 156 71.6% 66.9%;
  --ring: 161 93.5% 30.4%;
  --theme-primary: #059669;
  --theme-primary-hover: #047857;
}

.dark {
  --background: 164 85.7% 16.5%;
  --foreground: 149 80.4% 90.0%;
  --card: 163 88.1% 19.8%;
  --card-foreground: 149 80.4% 90.0%;
  --popover: 163 88.1% 19.8%;
  --popover-foreground: 149 80.4% 90.0%;
  --primary: 160 84.1% 39.4%;
  --primary-foreground: 0 0% 98%;
  --secondary: 164 85.7% 16.5%;
  --secondary-foreground: 149 80.4% 90.0%;
  --muted: 164 85.7% 16.5%;
  --muted-foreground: 156 71.6% 66.9%;
  --accent: 164 85.7% 16.5%;
  --accent-foreground: 149 80.4% 90.0%;
  --border: 163 93.5% 24.3%;
  --input: 163 93.5% 24.3%;
  --ring: 160 84.1% 39.4%;
  --theme-primary: #10b981;
  --theme-primary-hover: #059669;
}
`,
  },
  orange_sunset: {
    name: '橙色日落',
    description: '温暖的橙色日落风格',
    color: '#f97316',
    css: `
:root {
  --background: 34 100.0% 91.8%;
  --foreground: 15 74.6% 27.8%;
  --card: 0 0% 100%;
  --card-foreground: 15 74.6% 27.8%;
  --popover: 0 0% 100%;
  --popover-foreground: 15 74.6% 27.8%;
  --primary: 21 90.2% 48.2%;
  --primary-foreground: 0 0% 98%;
  --secondary: 32 97.7% 83.1%;
  --secondary-foreground: 15 74.6% 27.8%;
  --muted: 32 97.7% 83.1%;
  --muted-foreground: 21 90.2% 48.2%;
  --accent: 32 97.7% 83.1%;
  --accent-foreground: 15 74.6% 27.8%;
  --border: 31 97.2% 72.4%;
  --input: 31 97.2% 72.4%;
  --ring: 21 90.2% 48.2%;
  --theme-primary: #ea580c;
  --theme-primary-hover: #c2410c;
}

.dark {
  --background: 13 81.1% 14.5%;
  --foreground: 32 97.7% 83.1%;
  --card: 15 74.6% 27.8%;
  --card-foreground: 32 97.7% 83.1%;
  --popover: 15 74.6% 27.8%;
  --popover-foreground: 32 97.7% 83.1%;
  --primary: 25 95.0% 53.1%;
  --primary-foreground: 0 0% 98%;
  --secondary: 13 81.1% 14.5%;
  --secondary-foreground: 32 97.7% 83.1%;
  --muted: 13 81.1% 14.5%;
  --muted-foreground: 31 97.2% 72.4%;
  --accent: 13 81.1% 14.5%;
  --accent-foreground: 32 97.7% 83.1%;
  --border: 15 79.1% 33.7%;
  --input: 15 79.1% 33.7%;
  --ring: 25 95.0% 53.1%;
  --theme-primary: #f97316;
  --theme-primary-hover: #ea580c;
}
`,
  },
  pink_candy: {
    name: '粉色糖果',
    description: '甜美的粉色糖果风格',
    color: '#ec4899',
    css: `
:root {
  --background: 327 73.3% 97.1%;
  --foreground: 336 69.0% 30.4%;
  --card: 0 0% 100%;
  --card-foreground: 336 69.0% 30.4%;
  --popover: 0 0% 100%;
  --popover-foreground: 336 69.0% 30.4%;
  --primary: 333 71.4% 50.6%;
  --primary-foreground: 0 0% 98%;
  --secondary: 326 77.8% 94.7%;
  --secondary-foreground: 336 69.0% 30.4%;
  --muted: 326 77.8% 94.7%;
  --muted-foreground: 333 71.4% 50.6%;
  --accent: 326 77.8% 94.7%;
  --accent-foreground: 336 69.0% 30.4%;
  --border: 326 84.6% 89.8%;
  --input: 326 84.6% 89.8%;
  --ring: 333 71.4% 50.6%;
  --theme-primary: #db2777;
  --theme-primary-hover: #be185d;
}

.dark {
  --background: 336 83.9% 17.1%;
  --foreground: 326 77.8% 94.7%;
  --card: 336 69.0% 30.4%;
  --card-foreground: 326 77.8% 94.7%;
  --popover: 336 69.0% 30.4%;
  --popover-foreground: 326 77.8% 94.7%;
  --primary: 330 81.2% 60.4%;
  --primary-foreground: 0 0% 98%;
  --secondary: 336 83.9% 17.1%;
  --secondary-foreground: 326 77.8% 94.7%;
  --muted: 336 83.9% 17.1%;
  --muted-foreground: 326 84.6% 89.8%;
  --accent: 336 83.9% 17.1%;
  --accent-foreground: 326 77.8% 94.7%;
  --border: 343 79.7% 34.7%;
  --input: 343 79.7% 34.7%;
  --ring: 330 81.2% 60.4%;
  --theme-primary: #ec4899;
  --theme-primary-hover: #db2777;
}
`,
  },
  cyan_ocean: {
    name: '青色海洋',
    description: '清爽的青色海洋风格',
    color: '#06b6d4',
    css: `
:root {
  --background: 183 100.0% 96.3%;
  --foreground: 196 63.6% 23.7%;
  --card: 0 0% 100%;
  --card-foreground: 196 63.6% 23.7%;
  --popover: 0 0% 100%;
  --popover-foreground: 196 63.6% 23.7%;
  --primary: 192 91.4% 36.5%;
  --primary-foreground: 0 0% 98%;
  --secondary: 185 95.9% 90.4%;
  --secondary-foreground: 196 63.6% 23.7%;
  --muted: 185 95.9% 90.4%;
  --muted-foreground: 192 91.4% 36.5%;
  --accent: 185 95.9% 90.4%;
  --accent-foreground: 196 63.6% 23.7%;
  --border: 187 92.4% 69.0%;
  --input: 187 92.4% 69.0%;
  --ring: 192 91.4% 36.5%;
  --theme-primary: #0891b2;
  --theme-primary-hover: #0e7490;
}

.dark {
  --background: 197 78.9% 14.9%;
  --foreground: 185 95.9% 90.4%;
  --card: 196 63.6% 23.7%;
  --card-foreground: 185 95.9% 90.4%;
  --popover: 196 63.6% 23.7%;
  --popover-foreground: 185 95.9% 90.4%;
  --primary: 189 94.5% 42.7%;
  --primary-foreground: 0 0% 98%;
  --secondary: 197 78.9% 14.9%;
  --secondary-foreground: 185 95.9% 90.4%;
  --muted: 197 78.9% 14.9%;
  --muted-foreground: 187 92.4% 69.0%;
  --accent: 197 78.9% 14.9%;
  --accent-foreground: 185 95.9% 90.4%;
  --border: 194 69.6% 27.1%;
  --input: 194 69.6% 27.1%;
  --ring: 189 94.5% 42.7%;
  --theme-primary: #06b6d4;
  --theme-primary-hover: #0891b2;
}
`,
  },
};

export type ThemeName = keyof typeof builtInThemes;

export function getThemeCSS(themeName: ThemeName): string {
  return builtInThemes[themeName]?.css || '';
}

export function getThemeNames(): { value: ThemeName; label: string }[] {
  return Object.entries(builtInThemes).map(([key, theme]) => ({
    value: key as ThemeName,
    label: theme.name,
  }));
}
