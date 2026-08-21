# H5 文档查询系统

一个开箱即用的文档查询与管理系统，基于 **Netlify** 无服务器架构。

## 功能

- **H5 前台**：文档搜索、分类筛选、在线预览（PDF/图片/文本）、文件下载
- **后台管理**：上传文档、删除文档、分类管理、统计面板
- **登录认证**：管理员登录保护后台，可修改密码
- **响应式**：手机 / 平板 / 桌面自适应

## 技术架构

| 层面 | 技术 |
|------|------|
| 前端 | 纯 HTML + CSS + JS（无框架依赖） |
| API | Netlify Functions（Node.js 18 无服务器函数） |
| 数据存储 | GitHub 仓库 JSON 文件（通过 GitHub API 读写，零成本持久化） |
| 文件存储 | base64 编码存储在 JSON 中（最大 5MB/文件） |

## 部署步骤

### 1. 准备 GitHub 仓库

将本仓库 Fork 或克隆到你的 GitHub 账号下。

### 2. 创建 GitHub Token

前往 [GitHub Settings → Tokens](https://github.com/settings/tokens)，创建 Classic Token，勾选 `repo` 权限。

### 3. 连接 Netlify

1. 登录 [Netlify](https://app.netlify.com)
2. 点击 **Add new site** → **Import existing project**
3. 连接 GitHub，选择本仓库
4. 构建配置已自动识别（`netlify.toml`）

### 4. 配置环境变量

在 Netlify 站点 **Settings → Environment variables** 添加：

| 变量名 | 值 | 必填 |
|--------|----|----|
| `GITHUB_TOKEN` | 你的 GitHub Token | ✅ |
| `GITHUB_OWNER` | GitHub 用户名 | 可选（默认 `dyxasx`） |
| `GITHUB_REPO` | 仓库名 | 可选（默认 `doc-query-system`） |
| `GITHUB_BRANCH` | 分支名 | 可选（默认 `main`） |

### 5. 触发部署

设置环境变量后，在 Deploys 页面点击 **Trigger deploy** → **Deploy site** 重新部署。

### 6. 首次使用

访问站点，登录管理后台：
- 默认账号：`admin`
- 默认密码：`admin123`
- **登录后请立即修改密码**

## 目录结构

```
netlify-doc-system/
├── netlify.toml              # Netlify 配置（构建+路由重写）
├── package.json              # 依赖声明（无外部依赖）
├── data/
│   └── store.json            # 数据存储文件（自动创建和更新）
├── public/                   # 静态前端文件
│   ├── index.html            #   H5 文档查询首页
│   ├── view.html             #   文档预览页
│   ├── login.html            #   管理员登录页
│   ├── admin.html            #   后台管理页
│   ├── upload.html           #   文档上传页
│   ├── css/style.css         #   全局样式
│   └── js/app.js             #   API封装+工具函数
└── netlify/
    └── functions/
        └── api.js            # 无服务器API（所有后端逻辑）
```

## API 接口

| 方法 | 路径 | 功能 | 认证 |
|------|------|------|------|
| GET | `/api/documents` | 查询文档列表（支持分页/搜索/分类） | 公开 |
| GET | `/api/documents/:id` | 获取单个文档详情 | 公开 |
| GET | `/api/documents/:id/file` | 下载/预览文件 | 公开 |
| POST | `/api/documents` | 上传文档 | 需登录 |
| DELETE | `/api/documents/:id` | 删除文档 | 需登录 |
| GET | `/api/categories` | 获取分类列表 | 公开 |
| POST | `/api/categories` | 添加分类 | 需登录 |
| DELETE | `/api/categories/:id` | 删除分类 | 需登录 |
| POST | `/api/login` | 管理员登录 | 公开 |
| POST | `/api/password` | 修改密码 | 需登录 |
| GET | `/api/stats` | 统计数据 | 需登录 |
| GET | `/api/health` | 健康检查 | 公开 |

## 使用说明

### 前台（访客）
- 打开首页，搜索框输入关键词搜索文档
- 点击分类标签筛选文档
- 点击文档卡片查看详情和预览
- PDF / 图片 / 文本支持在线预览
- Word / Excel / PPT 等格式可下载查看

### 后台（管理员）
- 访问 `/login.html`，输入账号密码登录
- 管理页可查看统计、管理文档、管理分类
- 点击「上传文档」选择文件并填写信息
- 可添加/删除分类、修改密码

## 限制说明

- **单文件最大 5MB**（base64 编码 + GitHub API + Netlify Functions 限制）
- **免费额度**：Netlify 免费版每月 100GB 流量、125K 函数调用
- **GitHub API**：认证用户每小时 5000 次请求（内存缓存 5 秒可减少调用）
- 如需更大文件支持，建议接入 Cloudflare R2 或 AWS S3

## 常见问题

**Q: 部署后 API 报错怎么办？**
A: 先访问 `/api/health` 检查 GitHub Token 是否配置成功。如果返回 `token: missing`，说明环境变量未设置。

**Q: 忘记密码怎么办？**
A: 在 GitHub 仓库编辑 `data/store.json`，把 `password` 改回 `240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9`（即 `admin123`）。

**Q: 数据存在哪？**
A: 所有数据存在 GitHub 仓库的 `data/store.json` 文件中，可以在 GitHub 上直接查看和编辑。
