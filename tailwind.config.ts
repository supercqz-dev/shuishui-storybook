import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ━━━ 儿童端(图书馆 + 阅读器):温暖、毛绒、奶油色 ━━━
        cream: {
          50: '#FFF8F0',
          100: '#FFEEDC',
          200: '#FFE3C9',
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
        tool: ['"Inter"', '"PingFang SC"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        sans: ['"Quicksand"', '"Comfortaa"', 'ui-rounded', '"PingFang SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(255, 168, 194, 0.15)',
        'soft-lg': '0 8px 32px rgba(255, 168, 194, 0.18)',
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
