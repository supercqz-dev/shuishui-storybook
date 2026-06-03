import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ━━━ 儿童端(绘本馆 + 阅读器):温暖、毛绒、奶油色 ━━━
        cream: {
          50: '#FFFBF5',   // 最浅
          100: '#FFF4E6',
          200: '#FFE9D2',
          bg: '#FFF9F2',    // 馆内主背景
          card: '#FFFFFF',  // 卡片底
        },
        shuishui: {
          // 旧 token 保留,避免破坏现有引用
          pink: '#FFA8C2',
          'pink-soft': '#FFE0EA',
          // 新增
          'pink-deep': '#FF6E9C',
          yellow: '#FFE8A8',
          cream: '#FFF8F0',
          brown: '#5C4434',
          'brown-soft': '#8B6F5A',
        },
        // ━━━ 绘本馆语义点缀色(童趣活泼,克制使用)━━━
        lib: {
          peach: '#FFD9B8',
          mint: '#BFE6C9',
          sky: '#BFD9F2',
          lilac: '#E2D2F2',
          honey: '#F2C879',  // 蜜糖,标题/强调
        },
        // ━━━ 工具端(创作器 + 角色管理):清晰、低饱和 ━━━
        tool: {
          bg: '#FAFAFA',
          card: '#FFFFFF',
          border: '#E5E7EB',
          ink: '#374151',
          'ink-soft': '#6B7280',
          accent: '#EC4899',
          purple: '#A78BFA',
          green: '#10B981',
          red: '#EF4444',
        },
      },
      fontFamily: {
        kid: ['"Quicksand"', '"Comfortaa"', 'ui-rounded', '"PingFang SC"', '"Hiragino Sans"', 'system-ui', 'sans-serif'],
        // 绘本英文标题专用(圆润手感)
        display: ['"Quicksand"', '"Comfortaa"', 'ui-rounded', 'system-ui', 'sans-serif'],
        tool: ['"Inter"', '"PingFang SC"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        sans: ['"Quicksand"', '"Comfortaa"', 'ui-rounded', '"PingFang SC"', 'system-ui', 'sans-serif'],
      },
      // ━━━ 绘本馆语义字号(clamp 响应式)━━━
      fontSize: {
        'book-title': ['clamp(0.95rem, 2.4vw, 1.2rem)', { lineHeight: '1.25', fontWeight: '700' }],
        'book-subtitle': ['clamp(0.7rem, 1.8vw, 0.82rem)', { lineHeight: '1.35' }],
        'shelf-section': ['clamp(1.1rem, 3vw, 1.5rem)', { lineHeight: '1.2', fontWeight: '700' }],
      },
      // ━━━ 绘本馆语义圆角 ━━━
      borderRadius: {
        book: '14px',   // 封面卡
        card: '20px',   // 大卡片/区块
        pill: '999px',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(196, 150, 110, 0.14)',
        'soft-lg': '0 10px 36px rgba(196, 150, 110, 0.20)',
        // 封面专用:静态柔投影 + hover 抬升投影
        book: '0 6px 18px rgba(140, 100, 70, 0.16)',
        'book-hover': '0 16px 40px rgba(140, 100, 70, 0.28)',
        card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
      },
      animation: {
        'gentle-bounce': 'gentle-bounce 2s ease-in-out infinite',
        'soft-pulse': 'soft-pulse 1.6s ease-in-out infinite',
      },
      keyframes: {
        'gentle-bounce': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
