# 个人主页 · 全站组件复用版

《页面集成、优化部署与复盘》课程项目最终站点。纯静态 HTML + CSS + 原生 JavaScript，
无框架、无构建依赖、无外部网络请求，双击 `index.html` 即可运行。

## 一、快速开始

```bash
# 方式 A：直接双击 index.html（file:// 下功能完整）

# 方式 B：本地静态服务器（推荐，贴近真实部署）
python -m http.server 8000
# 浏览器打开 http://localhost:8000/index.html
```

按 F12 → 设备模式切换 375 / 768 / 1024 / 1440 px 验收响应式。

## 二、目录结构

```
.
├── index.html              首页（五段式：首页 / 关于 / 技能 / 作品 / 联系）
├── about.html              第二页，验证页头页脚跨页一致
├── 404.html                自定义 404
├── css/
│   ├── style.css           带完整中文注释的可读源文件
│   └── style.min.css       部署版压缩产物（页面实际引用）
├── js/
│   ├── script.js           带完整中文注释的可读源文件
│   └── script.min.js       部署版压缩产物（页面实际引用）
├── components/             组件单一数据源
│   ├── header.html         SiteHeader
│   ├── nav.html            MainNav
│   ├── footer.html         SiteFooter
│   └── index.html          防呆引导页（避免误入目录 404）
├── assets/avatar.svg       头像（315 B，可缓存、带 alt）
├── build.py                组件同步脚本
├── build_assets.py         静态资源压缩脚本
├── .nojekyll               GitHub Pages 不过滤下划线目录
├── robots.txt
└── .github/workflows/pages.yml   GitHub Pages 自动部署工作流
```

## 三、组件复用机制

纯静态 HTML 没有原生 include；`fetch` 注入在 `file://` 下会被浏览器拦截。
本项目采用**组件单一数据源 + 构建脚本注入**：

```bash
python build.py          # 把 components/ 同步进所有页面的 AUTO-INJECT 区块
python build_assets.py   # 由带注释的源文件重新生成 .min 压缩产物
```

- 改页头 / 导航 / 页脚：只改 `components/` 对应文件，再运行 `build.py`。
- 新增页面：复制任一页面 → 保留 `<!-- BEGIN AUTO-INJECT: ... -->` 注释块 → 改正文 → 运行 `build.py`。
- 不要手工编辑 AUTO-INJECT 区块之间的内容，会被下次构建覆盖。
- 关闭 JavaScript 时导航退化为可换行列表，内容不丢失（渐进增强）。

## 四、设计与技术约定（承接前两阶段）

| 项 | 约定 |
| --- | --- |
| 主色 | `--primary-color: #5B4BE8` |
| 断点 | 移动优先 `min-width: 768px` / `min-width: 1200px` |
| 锚点 | `#home` / `#about` / `#skills` / `#projects` / `#contact` |
| 命名 | BEM：`site-header__inner`、`site-nav__link` 等 |
| 语义 | `header` / `nav` / `main` / `section` / `footer`，每页唯一 `h1` |
| 无障碍 | WCAG 2.1 AA：skip-link、`:focus-visible`、`aria-expanded`、`aria-current`、`prefers-reduced-motion` |
| 路径 | 全站相对路径，站点根目录即部署根目录 |

## 五、部署

### GitHub Pages（已附工作流）
1. 在 GitHub 新建仓库（例如 `personal-homepage`），**仓库设为 Public**。
2. Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。
3. 本地执行：
   ```bash
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git branch -M main
   git push -u origin main
   ```
4. `.github/workflows/pages.yml` 会自动部署，得到 `https://<用户名>.github.io/<仓库名>/`。

### Gitee Pages
导入仓库 → 服务 → Gitee Pages → 部署目录填 `/`（根目录）→ 启动。
注意 Gitee Pages 免费版需实名认证，更新后要手动点「更新」。

### Vercel / Netlify
导入仓库，框架选 **Other / Static**，构建命令留空，发布目录填 `/`，自动获得 HTTPS 域名。

### 通用静态托管
把本目录全部文件上传到服务器 Web 根目录即可，无需任何后端。

## 六、提交前请替换

- 全局搜索 `陈同学`，替换为本人真实姓名。
- 替换技能、作品、联系方式等示例内容。
- 联系表单目前是前端演示、未接后端，请换成真实邮箱或接口。

## 七、验收清单

- [ ] 四种宽度无横向滚动、无重叠、无裁切
- [ ] 汉堡菜单展开 / 收起 / Esc / 点击外部 / 跨断点状态清理正常
- [ ] 两页页头页脚逐字一致
- [ ] Chrome DevTools Console / Network 无报错、无 404
- [ ] `node --check js/script.min.js` 通过
- [ ] Lighthouse Accessibility 评分与截图留证（需本人完成）
