const { getStore } = require("@netlify/blobs");

// ========== 工具函数 ==========

// CORS 头
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json", ...CORS_HEADERS },
    body: JSON.stringify(data),
  };
}

// 简单 JWT-like token（非加密，仅用于基本认证）
function makeToken(username) {
  const payload = { username, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function verifyToken(authHeader) {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = JSON.parse(Buffer.from(token, "base64url").toString());
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// 简单密码哈希（Netlify Functions 无需 bcrypt，用内置 crypto）
const crypto = require("crypto");
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// 文件类型图标映射
function getFileIcon(filetype) {
  const map = {
    pdf: "fa-file-pdf", doc: "fa-file-word", docx: "fa-file-word",
    xls: "fa-file-excel", xlsx: "fa-file-excel",
    ppt: "fa-file-powerpoint", pptx: "fa-file-powerpoint",
    txt: "fa-file-lines", md: "fa-file-lines", csv: "fa-file-csv",
    png: "fa-file-image", jpg: "fa-file-image", jpeg: "fa-file-image",
    gif: "fa-file-image", bmp: "fa-file-image", webp: "fa-file-image", svg: "fa-file-image",
    zip: "fa-file-zipper", rar: "fa-file-zipper", "7z": "fa-file-zipper",
    mp4: "fa-file-video", mp3: "fa-file-audio", wav: "fa-file-audio",
  };
  return map[filetype] || "fa-file";
}

function isPreviewable(filetype) {
  return ["pdf", "txt", "md", "csv", "png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"].includes(filetype);
}

function isImage(filetype) {
  return ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"].includes(filetype);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

// ========== 存储 Store 获取 ==========

async function getDocStore() {
  return getStore("documents");
}
async function getCatStore() {
  return getStore("categories");
}
async function getConfigStore() {
  return getStore("config");
}

// ========== 初始化默认数据 ==========

async function ensureInit() {
  const configStore = getConfigStore();
  const initialized = await configStore.get("initialized");
  
  if (!initialized) {
    // 初始化管理员
    await configStore.set("admin", JSON.stringify({
      username: "admin",
      password: hashPassword("admin123"),
    }));
    
    // 初始化默认分类
    const catStore = getCatStore();
    const defaultCats = [
      { id: "cat-1", name: "规章制度", icon: "fa-gavel" },
      { id: "cat-2", name: "技术文档", icon: "fa-code" },
      { id: "cat-3", name: "通知公告", icon: "fa-bullhorn" },
      { id: "cat-4", name: "培训资料", icon: "fa-graduation-cap" },
      { id: "cat-5", name: "其他", icon: "fa-folder" },
    ];
    for (const cat of defaultCats) {
      await catStore.set(cat.id, JSON.stringify(cat));
    }
    
    await configStore.set("initialized", "true");
  }
}

// ========== 主处理函数 ==========

exports.handler = async (event) => {
  // CORS 预检
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  await ensureInit();

  // 兼容两种调用方式：
  // 1. /api/documents（重写后的路径）
  // 2. /.netlify/functions/api/documents（直接调用）
  // 3. /api（无 path 时）
  let rawPath = event.path || "";
  rawPath = rawPath.split("?")[0]; // 去掉 query string
  // 提取 /api/ 之后的部分
  let apiPart = rawPath;
  const apiMatch = rawPath.match(/\/(?:api|\.netlify\/functions\/api)\/?(.*)$/);
  if (apiMatch) {
    apiPart = "/" + apiMatch[1];
  }
  const segments = apiPart.split("/").filter(Boolean);
  const method = event.httpMethod;
  
  // 解析 body
  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, "base64").toString() : event.body);
    } catch {
      // 非JSON body（如文件上传可能用别的格式）
    }
  }

  const authPayload = verifyToken(event.headers.authorization || event.headers.Authorization);

  try {
    // ========== 路由匹配 ==========

    // GET /api/documents - 查询文档列表
    if (method === "GET" && (segments[0] === "documents" || segments.length === 0)) {
      return await handleListDocuments(event);
    }

    // GET /api/documents/:id - 获取单个文档
    if (method === "GET" && segments[0] === "documents" && segments[1]) {
      return await handleGetDocument(segments[1]);
    }

    // GET /api/documents/:id/file - 下载/预览文件
    if (method === "GET" && segments[0] === "documents" && segments[2] === "file") {
      return await handleDownloadFile(segments[1]);
    }

    // POST /api/documents - 上传文档（需登录）
    if (method === "POST" && segments[0] === "documents") {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleUploadDocument(event);
    }

    // DELETE /api/documents/:id - 删除文档（需登录）
    if (method === "DELETE" && segments[0] === "documents" && segments[1]) {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleDeleteDocument(segments[1]);
    }

    // GET /api/categories - 获取分类列表
    if (method === "GET" && segments[0] === "categories") {
      return await handleListCategories();
    }

    // POST /api/categories - 添加分类（需登录）
    if (method === "POST" && segments[0] === "categories") {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleAddCategory(body);
    }

    // DELETE /api/categories/:id - 删除分类（需登录）
    if (method === "DELETE" && segments[0] === "categories" && segments[1]) {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleDeleteCategory(segments[1]);
    }

    // POST /api/login - 登录
    if (method === "POST" && segments[0] === "login") {
      return await handleLogin(body);
    }

    // POST /api/password - 修改密码（需登录）
    if (method === "POST" && segments[0] === "password") {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleChangePassword(body);
    }

    // GET /api/stats - 统计数据（需登录）
    if (method === "GET" && segments[0] === "stats") {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleStats();
    }

    return json({ error: "接口不存在", path }, 404);
  } catch (err) {
    console.error("API Error:", err);
    return json({ error: "服务器错误: " + err.message }, 500);
  }
};

// ========== 处理函数实现 ==========

async function handleLogin(body) {
  const { username, password } = body;
  const configStore = getConfigStore();
  const admin = JSON.parse((await configStore.get("admin")) || "{}");
  
  if (!admin.username || username !== admin.username || admin.password !== hashPassword(password)) {
    return json({ error: "用户名或密码错误" }, 401);
  }
  
  const token = makeToken(username);
  return json({ token, username });
}

async function handleChangePassword(body) {
  const { oldPassword, newPassword } = body;
  const configStore = getConfigStore();
  const admin = JSON.parse((await configStore.get("admin")) || "{}");
  
  if (admin.password !== hashPassword(oldPassword)) {
    return json({ error: "原密码错误" }, 400);
  }
  if (!newPassword || newPassword.length < 6) {
    return json({ error: "新密码至少6位" }, 400);
  }
  
  admin.password = hashPassword(newPassword);
  await configStore.set("admin", JSON.stringify(admin));
  return json({ success: true, message: "密码修改成功" });
}

async function handleListDocuments(event) {
  const queryParams = event.queryStringParameters || {};
  const keyword = (queryParams.q || "").toLowerCase().trim();
  const categoryId = queryParams.category || "";
  const page = parseInt(queryParams.page) || 1;
  const perPage = parseInt(queryParams.perPage) || 12;
  
  const docStore = getDocStore();
  const { blobs } = await docStore.list();
  
  let documents = [];
  for (const { key } of blobs) {
    const doc = JSON.parse(await docStore.get(key));
    if (doc) documents.push(doc);
  }
  
  // 过滤
  if (keyword) {
    documents = documents.filter(d => 
      (d.title || "").toLowerCase().includes(keyword) ||
      (d.description || "").toLowerCase().includes(keyword)
    );
  }
  if (categoryId) {
    documents = documents.filter(d => d.categoryId === categoryId);
  }
  
  // 排序（按上传时间倒序）
  documents.sort((a, b) => (b.uploadTime || 0) - (a.uploadTime || 0));
  
  // 分页
  const total = documents.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const paged = documents.slice(start, start + perPage);
  
  // 获取分类信息
  const catStore = getCatStore();
  const catList = await catStore.list();
  const catMap = {};
  for (const { key } of catList.blobs) {
    const cat = JSON.parse(await catStore.get(key));
    if (cat) catMap[cat.id] = cat;
  }
  
  // 附加分类信息和格式化
  const result = paged.map(d => ({
    ...d,
    category: catMap[d.categoryId] || null,
    fileSizeFormatted: formatSize(d.fileSize || 0),
    fileIcon: getFileIcon(d.filetype),
    isPreviewable: isPreviewable(d.filetype),
    uploadTimeFormatted: new Date(d.uploadTime).toLocaleString("zh-CN"),
  }));
  
  return json({ documents: result, total, page, totalPages, perPage });
}

async function handleGetDocument(id) {
  const docStore = getDocStore();
  const doc = JSON.parse((await docStore.get(id)) || "null");
  
  if (!doc) return json({ error: "文档不存在" }, 404);
  
  // 增加下载次数
  doc.downloadCount = (doc.downloadCount || 0) + 1;
  await docStore.set(id, JSON.stringify(doc));
  
  // 获取分类
  const catStore = getCatStore();
  const cat = doc.categoryId ? JSON.parse((await catStore.get(doc.categoryId)) || "null") : null;
  
  return json({
    ...doc,
    category: cat,
    fileSizeFormatted: formatSize(doc.fileSize || 0),
    fileIcon: getFileIcon(doc.filetype),
    isPreviewable: isPreviewable(doc.filetype),
    isImage: isImage(doc.filetype),
    uploadTimeFormatted: new Date(doc.uploadTime).toLocaleString("zh-CN"),
  });
}

async function handleDownloadFile(id) {
  const docStore = getDocStore();
  const doc = JSON.parse((await docStore.get(id)) || "null");
  
  if (!doc) return json({ error: "文档不存在" }, 404);
  if (!doc.fileData) return json({ error: "文件数据不存在" }, 404);
  
  // doc.fileData 是 base64 编码的文件内容
  const buffer = Buffer.from(doc.fileData, "base64");
  
  return {
    statusCode: 200,
    headers: {
      "Content-Type": doc.mimeType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.filename)}"`,
      ...CORS_HEADERS,
    },
    body: buffer.toString("base64"),
    isBase64Encoded: true,
  };
}

async function handleUploadDocument(event) {
  // 文件上传用 multipart 或 JSON base64
  // 这里用 JSON base64 方式（前端把文件转 base64 发送）
  const rawBody = JSON.parse(event.body || "{}");
  
  const { title, description, categoryId, filename, filetype, mimeType, fileData } = rawBody;
  
  if (!filename || !fileData) {
    return json({ error: "缺少文件信息" }, 400);
  }
  
  // 计算 base64 数据大小
  const buffer = Buffer.from(fileData, "base64");
  const fileSize = buffer.length;
  
  // 限制 10MB（Netlify Functions 限制）
  if (fileSize > 10 * 1024 * 1024) {
    return json({ error: "文件太大，最大支持10MB（Netlify函数限制）" }, 400);
  }
  
  const docId = "doc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  
  const doc = {
    id: docId,
    title: title || filename.replace(/\.[^.]+$/, ""),
    description: description || "",
    categoryId: categoryId || null,
    filename,
    filetype: filetype || filename.split(".").pop().toLowerCase(),
    mimeType: mimeType || "application/octet-stream",
    fileSize,
    fileData, // base64 编码的文件内容
    downloadCount: 0,
    uploadTime: Date.now(),
  };
  
  const docStore = getDocStore();
  await docStore.set(docId, JSON.stringify(doc));
  
  return json({
    success: true,
    message: "上传成功",
    id: docId,
    title: doc.title,
  });
}

async function handleDeleteDocument(id) {
  const docStore = getDocStore();
  const doc = JSON.parse((await docStore.get(id)) || "null");
  
  if (!doc) return json({ error: "文档不存在" }, 404);
  
  await docStore.delete(id);
  return json({ success: true, message: `文档「${doc.title}」已删除` });
}

async function handleListCategories() {
  const catStore = getCatStore();
  const { blobs } = await catStore.list();
  
  const categories = [];
  const docStore = getDocStore();
  const docList = await docStore.list();
  
  // 获取所有文档以统计各分类文档数
  const docCountMap = {};
  for (const { key } of docList.blobs) {
    const doc = JSON.parse(await docStore.get(key));
    if (doc && doc.categoryId) {
      docCountMap[doc.categoryId] = (docCountMap[doc.categoryId] || 0) + 1;
    }
  }
  
  for (const { key } of blobs) {
    const cat = JSON.parse(await catStore.get(key));
    if (cat) {
      categories.push({ ...cat, docCount: docCountMap[cat.id] || 0 });
    }
  }
  
  categories.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return json({ categories });
}

async function handleAddCategory(body) {
  const { name, icon } = body;
  if (!name) return json({ error: "分类名称不能为空" }, 400);
  
  const catStore = getCatStore();
  const { blobs } = await catStore.list();
  
  // 检查重名
  for (const { key } of blobs) {
    const cat = JSON.parse(await catStore.get(key));
    if (cat && cat.name === name) {
      return json({ error: "分类已存在" }, 400);
    }
  }
  
  const catId = "cat-" + Date.now();
  const cat = { id: catId, name, icon: icon || "fa-folder" };
  await catStore.set(catId, JSON.stringify(cat));
  
  return json({ success: true, message: "分类添加成功", category: cat });
}

async function handleDeleteCategory(id) {
  const catStore = getCatStore();
  await catStore.delete(id);
  return json({ success: true, message: "分类已删除" });
}

async function handleStats() {
  const docStore = getDocStore();
  const catStore = getCatStore();
  
  const { blobs: docs } = await docStore.list();
  const { blobs: cats } = await catStore.list();
  
  let totalSize = 0;
  let totalDownloads = 0;
  for (const { key } of docs) {
    const doc = JSON.parse(await docStore.get(key));
    if (doc) {
      totalSize += doc.fileSize || 0;
      totalDownloads += doc.downloadCount || 0;
    }
  }
  
  return json({
    totalDocs: docs.length,
    totalCategories: cats.length,
    totalDownloads,
    totalSize,
    totalSizeFormatted: formatSize(totalSize),
  });
}
