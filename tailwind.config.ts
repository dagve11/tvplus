import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ===== 排版尺度（全站单一来源） =====
      // 背景：全站 2440 处字号工具类里 text-sm(1148) + text-xs(817) 占 80.5%，
      // text-base 只有 74 处——正文默认档被跳过，层级是断的；卡片标题用 13-14px
      // 反而比 body 的 16px 小。这里沿用 Tailwind 原名、只调整配对行高（全站
      // 约 2371 处吃默认行高，改这里一次性生效），并新增两个语义档：
      //   micro = 角标/评分/时长/表头的下限（替代此前 7-10px 的硬编码字号）
      //   title = 卡片/列表项标题（把"标题大于正文"这条层级补回来）
      // 行高按中文调过：中文没有上下伸部余量，12px 配 16px 行高会显挤。
      fontSize: {
        micro: ['11px', { lineHeight: '16px' }],
        xs: ['12px', { lineHeight: '18px' }],
        sm: ['14px', { lineHeight: '22px' }],
        base: ['16px', { lineHeight: '26px' }],
        title: ['15px', { lineHeight: '22px' }],
        lg: ['18px', { lineHeight: '28px' }],
        xl: ['20px', { lineHeight: '28px' }],
        '2xl': ['24px', { lineHeight: '32px' }],
        '3xl': ['30px', { lineHeight: '38px' }],
      },
      lineHeight: {
        // 段落正文用（替代 leading-relaxed 的 1.625）
        cjk: '1.7',
        // 中文标题用（替代 leading-none —— 那个值会把中文的上下伸部压掉）
        'cjk-tight': '1.35',
      },
      // 让 src/app/private-library/page.tsx 与 movie-request/page.tsx 里已有的
      // `container` 真正居中并带内边距（此前未配置，行为依赖 Tailwind 默认值）。
      container: {
        center: true,
        padding: { DEFAULT: '1rem', sm: '1.5rem', lg: '2rem' },
      },
      screens: {
        'mobile-landscape': {
          raw: '(orientation: landscape) and (max-height: 700px)',
        },
      },
      fontFamily: {
        // 全站默认字：拉丁走 Inter（next/font 自托管，变量由 src/app/layout.tsx
        // 注入），中文依次落到系统黑体。此前只加载 Inter 的 latin 子集、中文完全
        // 靠浏览器默认，各平台字形/字重/行高都不一样；这里把中文栈显式声明出来，
        // 零额外下载。globals.css 的 body 上有一份同样的栈（供 next/font 变量生效
        // 前的首屏兜底），两处必须保持一致。
        sans: [
          'var(--font-inter)',
          'PingFang SC',
          'HarmonyOS Sans SC',
          'Microsoft YaHei',
          'Noto Sans CJK SC',
          'Source Han Sans SC',
          'Hiragino Sans GB',
          'WenQuanYi Micro Hei',
          ...defaultTheme.fontFamily.sans,
        ],
        // 书名/小节标题用的"书卷"衬线：拉丁走 Georgia，中文依次落到宋体系。
        book: [
          'Georgia',
          '"Songti SC"',
          '"Noto Serif CJK SC"',
          '"Noto Serif SC"',
          'STSong',
          'SimSun',
          ...defaultTheme.fontFamily.serif,
        ],
        // 音乐模块「唱片店」用的三副字。变量由 src/app/music/layout.tsx 里的
        // next/font 注入（和 Inter 同一套机制，构建期自托管，不发运行时外链）。
        // 中文没有窄体/等宽的正经对应，落到系统黑体——数字和拉丁才是这几副字的主场：
        // 名次、时长、音源键名这些"要排成轴"的地方才是它们干活的地方。
        'music-display': [
          'var(--font-music-display)',
          '"Archivo Narrow"',
          ...defaultTheme.fontFamily.sans,
        ],
        'music-body': [
          'var(--font-music-body)',
          'Archivo',
          ...defaultTheme.fontFamily.sans,
        ],
        'music-mono': [
          'var(--font-music-mono)',
          ...defaultTheme.fontFamily.mono,
        ],
      },
      colors: {
        // ===== shadcn/ui 设计 token（单色 neutral 体系，黑白极简） =====
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // 音乐模块仅剩的运行时主题桥：指向 --theme-primary（admin 可切 7 套主题，
        // themes.ts 纯 CSS 变量驱动）。只给"可操作"控件用（按钮、选中态、焦点环、
        // 正在播放）。chip = 压在封面图上的纯白文字/图标，不随明暗走。
        // 书库 library.* 与音乐材质色板（paper/ink/night-* 等）经全库 grep 零引用，
        // 已删除；书/漫画/音乐区统一并入单色 token 体系。
        music: {
          theme: 'var(--theme-primary, #10b981)',
          'theme-hover': 'var(--theme-primary-hover, #059669)',
          chip: '#ffffff',
        },
        // 注：原 sky 色阶 primary 与 #222 dark 色标经全库 grep 零引用，已删除。
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      zIndex: {
        base: '0',
        sticky: '20',
        header: '30',
        nav: '30',
        drawer: '40',
        modal: '50',
        popover: '60',
        toast: '70',
      },
      keyframes: {
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': {
            opacity: '0.99',
            filter:
              'drop-shadow(0 0 1px rgba(252, 211, 77)) drop-shadow(0 0 15px rgba(245, 158, 11)) drop-shadow(0 0 1px rgba(252, 211, 77))',
          },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': {
            opacity: '0.4',
            filter: 'none',
          },
        },
        shimmer: {
          '0%': {
            backgroundPosition: '-700px 0',
          },
          '100%': {
            backgroundPosition: '700px 0',
          },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInFromRight: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
      animation: {
        flicker: 'flicker 3s linear infinite',
        shimmer: 'shimmer 1.3s linear infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-in-out',
        'slide-down': 'slideDown 0.3s ease-in-out',
        'slide-in-from-right': 'slideInFromRight 0.3s ease-out',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        // 黑胶盘面：细密的同心圆纹路打底（压出来的槽），上面叠几道深浅不一的
        // 弧形，拼出"反光在盘上走"的错觉。两层写进同一个值里——它们是同一条
        // background-image 的两个图层，拆成两个 bg-* 类只会互相顶掉。
        //
        // 盘面是烧焦的深棕而不是纯黑：压在暖色的套面旁边，纯黑会读成"一块洞"。
        // 两档取自乙的 --app-disc-lo / --app-disc-hi。
        'music-vinyl':
          'repeating-radial-gradient(circle, transparent 0 2px, rgba(255,255,255,0.05) 2px 3px), conic-gradient(from 40deg, #170f08 0%, #412c17 12%, #1c1208 24%, #120b05 40%, #3a2714 56%, #180f07 72%, #452f18 88%, #170f08 100%)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
    require('tailwindcss-animate'),
  ],
} satisfies Config;

export default config;
