# BLQ Front Demo

基于 **Vue 3 + Vite + Element Plus** 的企业管理前端演示，包含组织、人事、考勤、薪资、积分和移动端页面，支持静态构建与 GitHub Pages 部署。

当前登录采用前端模拟逻辑，部分业务页面使用演示数据。它适合界面展示和学习；真实认证、权限与业务数据需要另外对接后端。

## 功能与范围

| 模块 | 页面或能力 |
| --- | --- |
| 首页与个人中心 | 仪表盘、资料、设置 |
| 组织与人事 | 部门、职位、员工信息、入职、离职 |
| 考勤 | 班次、排班、排班详情与操作 |
| 薪资 | 工资列表、发放、个人工资 |
| 积分 | 积分、礼品、抽奖等页面；部分页面仍为占位 |
| 资源管理 | 宿舍、车辆 |
| 移动端 | 签到、通知、通讯录、员工详情 |
| 工具 | Excel 导出、二维码、设备检测 |

页面存在并不代表业务接口已实现。移动端设计说明见 [DEVICE_ADAPTATION_GUIDE.md](DEVICE_ADAPTATION_GUIDE.md)。

## 技术栈

- Vue 3、Vue Router（hash 路由）、Pinia
- Vite 5、`@vitejs/plugin-vue` 6
- Element Plus、Axios
- `xlsx`、`xlsx-js-style`、`pinyin-pro`、`qrcode`

## 快速开始

需要 Git、npm，以及与依赖兼容的 Node.js。`@vitejs/plugin-vue` 6 声明 Node.js `^20.19.0 || >=22.12.0`，不能只按 Vite 5 的最低要求选择环境。

```bash
git clone https://github.com/RRRRUA/BLQ_front_demo.git
cd BLQ_front_demo
npm ci
npm run dev
```

开发地址默认为 `http://localhost:5173/#/login`；端口占用时以终端输出为准。登录页填入非空用户名和密码即可触发模拟登录，体验时使用虚构信息。

常用命令：

| 命令 | 作用 |
| --- | --- |
| `npm ci` | 根据 `package-lock.json` 安装依赖 |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建到 `dist/` |
| `npm run preview` | 本地预览构建产物 |

## 后端与认证配置

- [src/utils/request.js](src/utils/request.js) 创建 Axios 客户端，`baseURL` 为 `/api`，并从 `localStorage.token` 读取 Bearer token。
- [vite.config.js](vite.config.js) 的开发代理把 `/api` 转发到 `http://localhost:8080`，并去掉 `/api` 前缀。例如 `/api/login` 转发为 `http://localhost:8080/login`。
- [src/api/](src/api/) 保留了接口封装；[登录页面](src/views/login/index.vue) 当前执行模拟登录，真实登录调用处于注释状态。

对接真实服务时需要同时替换模拟登录、对齐接口响应结构和实现后端权限校验。项目目前没有读取 `VITE_API_BASE_URL`；仅新增 `.env` 不会自动修改请求地址。

## 项目结构

```text
.github/workflows/deploy-pages.yml  GitHub Pages 自动部署
src/
├── api/                           接口封装
├── assets/                        图片与静态资源
├── layout/                        后台布局与公共组件
├── router/                        hash 路由与登录检查
├── stores/                        Pinia 状态与演示数据
├── utils/                         请求、设备检测、Excel 导出
└── views/                         业务页面与移动端页面
vite.config.js                     开发代理和构建配置
```

## 静态部署

```bash
npm ci
npm run build
npm run preview
```

发布 `dist/` 中的文件即可部署静态站点。项目构建使用相对资源路径 `./` 和 hash 路由。

仓库已有 [GitHub Pages 工作流](.github/workflows/deploy-pages.yml)，在指定分支推送后执行 `npm ci`、`npm run build` 并上传 `dist/`。仓库设置中的 **Pages → Source** 需选择 **GitHub Actions**，最终 URL 以部署结果为准。

Vite 开发代理不会包含在静态产物或预览服务中。生产环境访问真实 API 时，需要单独配置反向代理，或修改客户端请求地址并处理 CORS。GitHub Pages 只托管静态文件。

## 已知限制与验证

- 前端模拟 token 和路由检查不能作为真实权限控制。
- 部分页面是原型或占位，项目没有独立的测试脚本。
- 静态构建通过不代表真实后端登录和业务操作已经验证。
- 大图片和较大的 JavaScript 包可能影响首屏加载。

本次文档核对使用 Node.js 24.12.0，完成 `npm ci --ignore-scripts` 和 `npm run build`；未验证后端集成或线上部署。

## 参与开发

从主分支创建功能分支，小步提交；提交前至少运行 `npm run build`。改动涉及路由、设备适配或接口时，同步更新相关说明，并在 PR 中写明验证方式。

## 许可证

仓库当前未提供根目录许可证文件。第三方依赖沿用各自许可证；复用本项目代码前请与维护者确认授权范围。
