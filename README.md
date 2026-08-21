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
| API | Netlify Functions（Node.js 无服务器函数） |
| 数据存储 | Netlify Blobs（键值存储，免配置数据库） |
| 文件存储 | Netlify Blobs（Base64 编码，最大 10MB/文件） |

## 快速开始

### 方法一：本地测试

```bash
npm install
npx netlify-cli dev
```

访问 `http://localhost:8888`

### 方法二：部署到 Netlify

1. **注册 Netlify 账号**：https://netlify.com（免费额度足够个人使用）

2. **上传代码**：
   - 方式A：连接 GitHub 仓库（推荐）
   - 方式B：直接拖拽文件夹到 Netlify 控制台

3. **部署完成**，Netlify 会自动：
   - 提供 `xxx.netlify.app` 域名
   - 启用 HTTPS
   - 部署 Functions API
   - 启用 Blobs 存储

4. **首次使用**：默认管理员账号 `admin` / `admin123`，请登录后立即修改密码

## 目录结构

```
netlify-doc-system/
├── netlify.toml              # Netlify 配置（构建+路由重写）
├── package.json              # 依赖声明
├── README.md                 # 本文件
├── public/                   # 静态前端文件（部署到 Netlify CDN）
│   ├── index.html            #   H5 文档查询首页
│   ├── view.html             #   文档预览页
│   ├── login.html            #   管理员登录页
│   ├── admin.html            #   后台管理页
│   ├── upload.html           #   文档上传页
│   ├── css/
│   │   └── style.css         #   全局样式（响应式）
│   └── js/
│       └── app.js            #   API封装+工具函数
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

- **单文件最大 10MB**（Netlify Functions 请求体限制）
- **免费额度**：Netlify 免费版每月 100GB 流量、125K 函数调用
- **存储**：使用 Netlify Blobs 存储，免费版有 1GB 存储 + 1000 写入/天限制
- 如需更大文件支持，建议接入 Cloudflare R2 或 AWS S3

## 常见问题

**Q: 部署后 API 报错怎么办？**
A: 检查 Netlify 后台 Functions 日志，确保 `@netlify/blobs` 依赖已安装。

**Q: 忘记密码怎么办？**
A: 在 Netlify 后台找到站点 → Functions → Blobs → 删除 `config` store 中的 `initialized` 键，系统会重新初始化默认账号。

**Q: 如何支持更大文件？**
A: 可接入 Cloudflare R2（免费 10GB）替代 Blobs 存储文件，修改 `api.js` 中的存储逻辑。
