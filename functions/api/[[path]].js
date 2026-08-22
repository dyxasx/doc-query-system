// Cloudflare Pages Functions - 处理所有 /api/* 请求
// 部署：Cloudflare Pages，functions 目录自动识别
// 环境：wrangler 原生 runtime（无 Buffer，用 atob/btoa；无 Node crypto，用 Web Crypto）

// ========== 配置 ==========

function getEnv(env) {
  return {
    GH_TOKEN: env.GITHUB_TOKEN || "",
    GH_OWNER: env.GITHUB_OWNER || "dyxasx",
    GH_REPO: env.GITHUB_REPO || "doc-query-system",
    GH_BRANCH: env.GITHUB_BRANCH || "main",
  };
}

const DATA_FILE = "data/store.json";
const FILES_DIR = "data/files";

// 内存缓存（同一 isolate 内复用，减少 GitHub API 调用）
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 5000;

// ========== 默认数据 ==========

function getDefaultData(adminHash) {
  return {
    admin: { username: "admin", password: adminHash },
    categories: [
      { id: "cat-1", name: "规章制度", icon: "fa-gavel" },
      { id: "cat-2", name: "技术文档", icon: "fa-code" },
      { id: "cat-3", name: "通知公告", icon: "fa-bullhorn" },
      { id: "cat-4", name: "培训资料", icon: "fa-graduation-cap" },
      { id: "cat-5", name: "其他", icon: "fa-folder" },
    ],
    documents: [],
    initialized: true,
  };
}

// ========== 编解码工具（替代 Buffer） ==========

function b64ToBytes(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function bytesToB64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function strToB64(str) {
  return bytesToB64(new TextEncoder().encode(str));
}

// ========== 加密工具（Web Crypto） ==========

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

function makeToken(username) {
  const payload = JSON.stringify({ username, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 });
  return btoa(payload).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function verifyToken(authHeader) {
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  try {
    const payload = JSON.parse(atob(token.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// ========== GitHub API ==========

function ghHeaders(cfg) {
  return {
    "Authorization": `Bearer ${cfg.GH_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "doc-query-system",
  };
}

async function githubRaw(cfg, path) {
  const url = `https://raw.githubusercontent.com/${cfg.GH_OWNER}/${cfg.GH_REPO}/${cfg.GH_BRANCH}/${path}`;
  const headers = cfg.GH_TOKEN ? { "Authorization": `Bearer ${cfg.GH_TOKEN}` } : {};
  return fetch(url, { headers });
}

async function loadData(cfg) {
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) return _cache;
  try {
    const res = await githubRaw(cfg, DATA_FILE);
    if (res.status === 200) {
      _cache = JSON.parse(await res.text());
      _cacheTime = Date.now();
      return _cache;
    }
  } catch (e) {
    console.log("[store] loadData error:", e.message);
  }
  // 初始化
  const adminHash = await hashPassword("admin123");
  _cache = getDefaultData(adminHash);
  _cacheTime = Date.now();
  await saveData(cfg, _cache);
  return _cache;
}

async function saveData(cfg, data) {
  _cache = data;
  _cacheTime = Date.now();
  if (!cfg.GH_TOKEN) return;

  try {
    let sha = null;
    const getUrl = `https://api.github.com/repos/${cfg.GH_OWNER}/${cfg.GH_REPO}/contents/${DATA_FILE}?ref=${cfg.GH_BRANCH}`;
    const getRes = await fetch(getUrl, { headers: ghHeaders(cfg) });
    if (getRes.status === 200) {
      sha = (await getRes.json()).sha;
    }

    const body = {
      message: "update store data",
      content: strToB64(JSON.stringify(data, null, 2)),
      branch: cfg.GH_BRANCH,
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(getUrl, {
      method: "PUT",
      headers: ghHeaders(cfg),
      body: JSON.stringify(body),
    });
    if (putRes.status === 200 || putRes.status === 201) {
      console.log("[store] saveData success");
    } else {
      console.log("[store] saveData failed:", putRes.status, await putRes.text());
    }
  } catch (e) {
    console.log("[store] saveData error:", e.message);
  }
}

async function uploadFileToGitHub(cfg, filePath, base64Content) {
  if (!cfg.GH_TOKEN) throw new Error("GITHUB_TOKEN 未配置");
  const url = `https://api.github.com/repos/${cfg.GH_OWNER}/${cfg.GH_REPO}/contents/${filePath}?ref=${cfg.GH_BRANCH}`;
  let sha = null;
  const getRes = await fetch(url, { headers: ghHeaders(cfg) });
  if (getRes.status === 200) sha = (await getRes.json()).sha;

  const body = { message: `upload file ${filePath}`, content: base64Content, branch: cfg.GH_BRANCH };
  if (sha) body.sha = sha;

  const putRes = await fetch(url, {
    method: "PUT",
    headers: ghHeaders(cfg),
    body: JSON.stringify(body),
  });
  if (putRes.status !== 200 && putRes.status !== 201) {
    throw new Error(`GitHub 上传失败: ${putRes.status}`);
  }
}

async function deleteFileFromGitHub(cfg, filePath) {
  if (!cfg.GH_TOKEN) return;
  try {
    const url = `https://api.github.com/repos/${cfg.GH_OWNER}/${cfg.GH_REPO}/contents/${filePath}?ref=${cfg.GH_BRANCH}`;
    const getRes = await fetch(url, { headers: ghHeaders(cfg) });
    if (getRes.status === 200) {
      const sha = (await getRes.json()).sha;
      await fetch(url, {
        method: "DELETE",
        headers: ghHeaders(cfg),
        body: JSON.stringify({ message: `delete file ${filePath}`, sha, branch: cfg.GH_BRANCH }),
      });
    }
  } catch (e) {
    console.log("[store] deleteFile error:", e.message);
  }
}

// ========== 响应工具 ==========

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS },
  });
}

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
  if (!bytes) return "0 B";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function safeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._\u4e00-\u9fa5\-]/g, "_").slice(-100);
}

// ========== 入口 ==========

export async function onRequest(context) {
  const { request, env } = context;
  const cfg = getEnv(env);

  if (request.method === "OPTIONS") {
    return new Response("", { status: 200, headers: CORS_HEADERS });
  }

  const url = new URL(request.url);
  const rawPath = url.pathname;
  const segments = rawPath.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  const method = request.method;

  // 解析 body
  let body = {};
  if (method === "POST") {
    try { body = await request.json(); } catch { /* 非 JSON */ }
  }

  const authPayload = verifyToken(request.headers.get("Authorization"));

  try {
    // GET /api/documents 或 /api
    if (method === "GET" && (segments.length === 0 || (segments[0] === "documents" && !segments[1]))) {
      return await handleListDocuments(cfg, url);
    }
    // GET /api/documents/:id
    if (method === "GET" && segments[0] === "documents" && segments[1] && !segments[2]) {
      return await handleGetDocument(cfg, segments[1]);
    }
    // GET /api/documents/:id/file
    if (method === "GET" && segments[0] === "documents" && segments[2] === "file") {
      return await handleDownloadFile(cfg, segments[1]);
    }
    // POST /api/documents
    if (method === "POST" && segments[0] === "documents") {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleUploadDocument(cfg, body);
    }
    // DELETE /api/documents/:id
    if (method === "DELETE" && segments[0] === "documents" && segments[1]) {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleDeleteDocument(cfg, segments[1]);
    }
    // GET /api/categories
    if (method === "GET" && segments[0] === "categories") {
      return await handleListCategories(cfg);
    }
    // POST /api/categories
    if (method === "POST" && segments[0] === "categories") {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleAddCategory(cfg, body);
    }
    // DELETE /api/categories/:id
    if (method === "DELETE" && segments[0] === "categories" && segments[1]) {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleDeleteCategory(cfg, segments[1]);
    }
    // POST /api/login
    if (method === "POST" && segments[0] === "login") {
      return await handleLogin(cfg, body);
    }
    // POST /api/password
    if (method === "POST" && segments[0] === "password") {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleChangePassword(cfg, body);
    }
    // GET /api/stats
    if (method === "GET" && segments[0] === "stats") {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleStats(cfg);
    }
    // GET /api/health
    if (method === "GET" && segments[0] === "health") {
      return json({
        ok: true,
        platform: "cloudflare",
        token: cfg.GH_TOKEN ? "set" : "missing",
        repo: `${cfg.GH_OWNER}/${cfg.GH_REPO}`,
        branch: cfg.GH_BRANCH,
      });
    }

    return json({ error: "接口不存在", path: rawPath }, 404);
  } catch (err) {
    console.error("API Error:", err);
    return json({ error: "服务器错误: " + (err.message || "unknown") }, 500);
  }
}

// ========== 处理函数 ==========

async function handleLogin(cfg, body) {
  const { username, password } = body || {};
  const data = await loadData(cfg);
  const admin = data.admin || {};
  const hash = await hashPassword(password || "");

  if (!admin.username || username !== admin.username || admin.password !== hash) {
    return json({ error: "用户名或密码错误" }, 401);
  }
  return json({ token: makeToken(username), username });
}

async function handleChangePassword(cfg, body) {
  const { oldPassword, newPassword } = body || {};
  const data = await loadData(cfg);
  const admin = data.admin || {};

  const oldHash = await hashPassword(oldPassword || "");
  if (admin.password !== oldHash) return json({ error: "原密码错误" }, 400);
  if (!newPassword || newPassword.length < 6) return json({ error: "新密码至少6位" }, 400);

  data.admin = { ...admin, password: await hashPassword(newPassword) };
  await saveData(cfg, data);
  return json({ success: true, message: "密码修改成功" });
}

async function handleListDocuments(cfg, url) {
  const keyword = (url.searchParams.get("q") || "").toLowerCase().trim();
  const categoryId = url.searchParams.get("category") || "";
  const page = parseInt(url.searchParams.get("page")) || 1;
  const perPage = parseInt(url.searchParams.get("perPage")) || 12;

  const data = await loadData(cfg);
  let documents = (data.documents || []).slice();

  if (keyword) {
    documents = documents.filter(d =>
      (d.title || "").toLowerCase().includes(keyword) ||
      (d.description || "").toLowerCase().includes(keyword)
    );
  }
  if (categoryId) documents = documents.filter(d => d.categoryId === categoryId);

  documents.sort((a, b) => (b.uploadTime || 0) - (a.uploadTime || 0));

  const total = documents.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const paged = documents.slice((page - 1) * perPage, page * perPage);

  const catMap = {};
  for (const c of (data.categories || [])) catMap[c.id] = c;

  const result = paged.map(d => ({
    id: d.id, title: d.title, description: d.description,
    categoryId: d.categoryId, filename: d.filename, filetype: d.filetype,
    fileSize: d.fileSize, downloadCount: d.downloadCount || 0,
    uploadTime: d.uploadTime,
    category: catMap[d.categoryId] || null,
    fileSizeFormatted: formatSize(d.fileSize),
    fileIcon: getFileIcon(d.filetype),
    isPreviewable: isPreviewable(d.filetype),
    uploadTimeFormatted: new Date(d.uploadTime).toLocaleString("zh-CN"),
  }));

  return json({ documents: result, total, page, totalPages, perPage });
}

async function handleGetDocument(cfg, id) {
  const data = await loadData(cfg);
  const doc = (data.documents || []).find(d => d.id === id);
  if (!doc) return json({ error: "文档不存在" }, 404);

  // 浏览计数只更新内存，不写回（避免每次浏览都触发 GitHub 提交）
  doc.downloadCount = (doc.downloadCount || 0) + 1;

  const cat = doc.categoryId ? (data.categories || []).find(c => c.id === doc.categoryId) : null;

  return json({
    id: doc.id, title: doc.title, description: doc.description,
    categoryId: doc.categoryId, filename: doc.filename, filetype: doc.filetype,
    mimeType: doc.mimeType, fileSize: doc.fileSize,
    downloadCount: doc.downloadCount, uploadTime: doc.uploadTime,
    hasFile: !!(doc.filePath || doc.fileData),
    category: cat,
    fileSizeFormatted: formatSize(doc.fileSize),
    fileIcon: getFileIcon(doc.filetype),
    isPreviewable: isPreviewable(doc.filetype),
    isImage: isImage(doc.filetype),
    uploadTimeFormatted: new Date(doc.uploadTime).toLocaleString("zh-CN"),
  });
}

async function handleDownloadFile(cfg, id) {
  const data = await loadData(cfg);
  const doc = (data.documents || []).find(d => d.id === id);
  if (!doc) return json({ error: "文档不存在" }, 404);

  const headers = {
    "Content-Type": doc.mimeType || "application/octet-stream",
    "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(doc.filename)}`,
    ...CORS_HEADERS,
  };

  // 新版：文件存在 GitHub 仓库 data/files/ 目录
  if (doc.filePath) {
    const res = await githubRaw(cfg, doc.filePath);
    if (res.status === 200) {
      return new Response(res.body, { status: 200, headers });
    }
  }

  // 旧版兼容：fileData 内嵌 base64
  if (doc.fileData) {
    const bytes = b64ToBytes(doc.fileData);
    return new Response(bytes, { status: 200, headers });
  }

  return json({ error: "文件数据不存在" }, 404);
}

async function handleUploadDocument(cfg, body) {
  const { title, description, categoryId, filename, filetype, mimeType, fileData } = body || {};

  if (!filename || !fileData) return json({ error: "缺少文件信息" }, 400);

  const bytes = b64ToBytes(fileData);
  const fileSize = bytes.length;

  // 单文件最大 25MB（与前端一致；GitHub Contents API 单文件稳妥上限）
  if (fileSize > 25 * 1024 * 1024) {
    return json({ error: "文件太大，最大支持25MB" }, 400);
  }

  const docId = "doc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  const safeName = safeFilename(filename);
  const filePath = `${FILES_DIR}/${docId}-${safeName}`;

  // 1. 文件本体上传到 GitHub 仓库
  await uploadFileToGitHub(cfg, filePath, fileData);

  // 2. 元数据写入 store.json（不再内嵌 base64）
  const doc = {
    id: docId,
    title: title || filename.replace(/\.[^.]+$/, ""),
    description: description || "",
    categoryId: categoryId || null,
    filename,
    filetype: filetype || filename.split(".").pop().toLowerCase(),
    mimeType: mimeType || "application/octet-stream",
    fileSize,
    filePath,
    downloadCount: 0,
    uploadTime: Date.now(),
  };

  const data = await loadData(cfg);
  data.documents = data.documents || [];
  data.documents.push(doc);
  await saveData(cfg, data);

  return json({ success: true, message: "上传成功", id: docId, title: doc.title });
}

async function handleDeleteDocument(cfg, id) {
  const data = await loadData(cfg);
  const idx = (data.documents || []).findIndex(d => d.id === id);
  if (idx === -1) return json({ error: "文档不存在" }, 404);

  const doc = data.documents[idx];
  if (doc.filePath) await deleteFileFromGitHub(cfg, doc.filePath);

  data.documents.splice(idx, 1);
  await saveData(cfg, data);
  return json({ success: true, message: `文档「${doc.title}」已删除` });
}

async function handleListCategories(cfg) {
  const data = await loadData(cfg);
  const docCountMap = {};
  for (const doc of (data.documents || [])) {
    if (doc.categoryId) docCountMap[doc.categoryId] = (docCountMap[doc.categoryId] || 0) + 1;
  }
  const result = (data.categories || []).map(c => ({ ...c, docCount: docCountMap[c.id] || 0 }));
  result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return json({ categories: result });
}

async function handleAddCategory(cfg, body) {
  const { name, icon } = body || {};
  if (!name) return json({ error: "分类名称不能为空" }, 400);

  const data = await loadData(cfg);
  const categories = data.categories || [];
  if (categories.some(c => c.name === name)) return json({ error: "分类已存在" }, 400);

  const cat = { id: "cat-" + Date.now(), name, icon: icon || "fa-folder" };
  data.categories = [...categories, cat];
  await saveData(cfg, data);
  return json({ success: true, message: "分类添加成功", category: cat });
}

async function handleDeleteCategory(cfg, id) {
  const data = await loadData(cfg);
  data.categories = (data.categories || []).filter(c => c.id !== id);
  await saveData(cfg, data);
  return json({ success: true, message: "分类已删除" });
}

async function handleStats(cfg) {
  const data = await loadData(cfg);
  const documents = data.documents || [];
  let totalSize = 0, totalDownloads = 0;
  for (const doc of documents) {
    totalSize += doc.fileSize || 0;
    totalDownloads += doc.downloadCount || 0;
  }
  return json({
    totalDocs: documents.length,
    totalCategories: (data.categories || []).length,
    totalDownloads,
    totalSize,
    totalSizeFormatted: formatSize(totalSize),
  });
}