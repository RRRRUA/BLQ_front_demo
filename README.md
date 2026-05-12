# BLQ Front GitHub Pages Demo

这是一个 Vite + Vue 纯前端 demo，已经按 GitHub Pages 静态站点发布方式配置。

## 本地运行

```bash
npm install
npm run dev
```

## 本地构建

```bash
npm run build
```

构建产物会生成到 `dist/`，该目录不需要提交到仓库。

## 发布到 GitHub Pages

项目已包含自动部署工作流：`.github/workflows/deploy-pages.yml`。推送到 GitHub 后，GitHub Actions 会执行 `npm ci`、`npm run build`，并把 `dist/` 发布到 GitHub Pages。

如果当前目录还没有 Git 仓库，可以按下面步骤发布：

```bash
git init
git add .
git commit -m "Prepare GitHub Pages demo"
git branch -M main
git remote add origin https://github.com/<your-name>/<repo-name>.git
git push -u origin main
```

然后在 GitHub 仓库中打开：

```text
Settings -> Pages -> Build and deployment -> Source -> GitHub Actions
```

等待 `Deploy GitHub Pages` 工作流执行完成后，公共访问地址通常是：

```text
https://<your-name>.github.io/<repo-name>/
```

例如仓库是 `RRRRUA/BLQ_front` 时，地址通常是：

```text
https://rrrrua.github.io/BLQ_front/
```

## Pages 适配说明

- `vite.config.js` 使用相对资源路径，部署到 GitHub Pages 项目子路径时不会丢失 JS/CSS 资源。
- `src/router/index.js` 使用 hash 路由，刷新页面不会因为 GitHub Pages 缺少后端 fallback 而 404。
- 登录流程当前使用 mock token，基础 demo 浏览不依赖后端服务。
