# MD Reader

[![Release](https://img.shields.io/github/v/release/Neilooo/md-reader?include_prereleases&color=blue)](https://github.com/Neilooo/md-reader/releases)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)
[![Downloads](https://img.shields.io/github/downloads/Neilooo/md-reader/total)](https://github.com/Neilooo/md-reader/releases)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey)]()

一个轻量、快速、所见即所得的 Markdown 桌面阅读器，基于 Tauri 2 + Vue 3 构建。

体积小（约 5 MB），启动快，支持公式、图表、代码高亮、文件树、全文搜索、PDF/HTML/DOCX 导出。

📦 **[下载最新版本](https://github.com/Neilooo/md-reader/releases/latest)**

## 主要特性

### 阅读
- CommonMark + GitHub Flavored Markdown
- 代码语法高亮（highlight.js，30+ 语言）
- 数学公式（KaTeX，按需加载）
- 流程图 / 时序图 / 思维导图（Mermaid，按需加载）
- 任务列表 / 脚注 / Emoji / 标题锚点
- 亮 / 暗主题切换，记忆主题偏好

### 导航
- 左侧文件树，递归扫描文件夹
- 右侧 TOC 大纲，滚动同步高亮
- 三栏可拖拽分隔条，独立显隐
- 内部链接 `[文本](./other.md#锚点)` 跳转
- 图片相对路径自动解析

### 查找
- `Ctrl+F` 当前文档查找（高亮、上一/下一）
- `Ctrl+Shift+F` 跨文件全文搜索（Rust 后端高速）

### 导出
- **PDF**（Edge headless，1-3 秒，所见即所得，无 LaTeX）
- **HTML**（自包含单文件，图片/CSS 全部内嵌）
- **DOCX**（pandoc 路线，需安装 pandoc）
- 系统打印对话框

### 体验
- 阅读设置：字号、行高、宽度、字体可调
- 文件变更监听，自动刷新
- 最近文件 + 滚动位置记忆
- 文件关联：`.md / .markdown / .mdx` 双击直接打开
- 单例运行：从资源管理器多次打开会复用窗口
- 拖拽文件到窗口直接打开

## 快捷键

| 键 | 动作 |
|---|---|
| `Ctrl+F` | 当前文档查找 |
| `Ctrl+Shift+F` | 全文搜索 |
| `Ctrl+,` | 阅读设置 |
| `Ctrl+S` | 导出 HTML |
| `Ctrl+P` | 系统打印 / 另存为 PDF |
| `Esc` | 关闭查找 / 设置 |

## 安装

### Windows
下载 `MD Reader_<version>_x64_en-US.msi` 双击安装。
或直接下载 `md-reader.exe` 免安装运行（绿色版）。

## 开发

### 环境要求
- Node.js ≥ 18
- pnpm ≥ 8
- Rust ≥ 1.77（含 cargo）
- Windows: WebView2 Runtime（Win10/11 自带）

### 命令
```bash
pnpm install              # 安装前端依赖
pnpm tauri dev            # 启动开发模式
pnpm tauri build          # 构建生产版本
pnpm lint                 # ESLint 检查
pnpm format               # Prettier 格式化
```

### 目录结构
```
src/                          前端 Vue 3
├── components/               界面组件
├── composables/              逻辑模块
│   ├── useMarkdown.ts        markdown-it 配置
│   ├── useFileTree.ts        文件树
│   ├── useFindInPage.ts      文档查找
│   ├── useExport.ts          导出（HTML/DOCX/PDF）
│   └── ...
├── App.vue                   主界面
└── main.ts                   入口

src-tauri/src/                Rust 后端
├── lib.rs                    Tauri 命令注册
├── pdf_utils.rs              Edge 路径探测
└── pdf_export.rs             PDF 导出（Edge headless）
```

## 技术栈

- **桌面框架**: Tauri 2（Rust + WebView2）
- **前端**: Vue 3 + TypeScript + Vite
- **Markdown**: markdown-it + 多个插件
- **公式**: KaTeX
- **图表**: Mermaid
- **代码高亮**: highlight.js
- **PDF 导出**: 系统 Edge `--headless=new --print-to-pdf`
- **DOCX 导出**: pandoc
- **文件监听**: notify + notify-debouncer-mini
- **全文搜索**: walkdir + 流式逐行扫描

## PDF 导出原理

不依赖 LaTeX 或额外的渲染引擎。

1. 前端把已渲染的 DOM（KaTeX 公式、Mermaid SVG 已就绪）抓取
2. 图片转 base64 内嵌、KaTeX/highlight.js CSS 内嵌
3. Rust 写临时 HTML 到 `%TEMP%`（ASCII 路径）
4. 调用系统 Edge headless 模式：`--headless=new --print-to-pdf=...`
5. Edge 完成后把 PDF 拷贝到用户选择的目标路径

结果：1-3 秒生成，与阅读器视觉完全一致。

## 许可

MIT
