import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 使用 node 环境（避免 jsdom ESM 兼容性问题）
    environment: 'node',
    
    // 全局变量（describe, it, expect 等）
    globals: true,
    
    // 设置文件（在每个测试文件前运行）
    setupFiles: ['./src/test/setup.ts'],
    
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts',
        'src/main.tsx',
        'src-tauri/**',
      ],
      // 覆盖率阈值
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
    
    // 包含的测试文件
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    
    // 排除的文件
    exclude: [
      'node_modules',
      'dist',
      'src-tauri',
    ],
  },
});
