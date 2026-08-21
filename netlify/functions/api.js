const crypto = require("crypto");

// ========== GitHub API 持久化存储 ==========
// 元数据存 data/store.json（通过 GitHub Contents API）
// 文件二进制存 data/files/{docId}-{filename}（也通过 GitHub Contents API）
// 优点：突破 6MB 请求体限制，单文件最大 100MB

const GH_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const GH_OWNER = process.env.GITHUB_OWNER || "dyxasx";
const GH_REPO = process.env.GITHUB_REPO || "doc-query-system";
const GH_BRANCH = process.env.GITHUB_BRANCH || "main";
const DATA_FILE = "data/store.json";
const FILES_DIR = "data/files";

// 内存缓存（减少 API 调用）
let _cache = null;
let _cacheTime = 0;
const CACHE_TTL = 5000; // 5秒缓存

// ========== 默认数据 ==========

function getDefaultData() {
  return {
    admin: {
      username: "admin",
      password: hashPassword("admin123"),
    },
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

// ========== GitHub API 操作 ==========

async function githubAPI(path, method = "GET", body = null) {
  const url = `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${path}`;
  const headers = {
    "Authorization": `Bearer ${GH_TOKEN}`,
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const opts = { method, headers };
  if (body) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url + `?ref=${GH_BRANCH}`, opts);
  return res;
}

async function githubRaw(path) {
  const url = `https://raw.githubusercontent.com/${GH_OWNER}/${GH_REPO}/${GH_BRANCH}/${path}`;
  const headers = GH_TOKEN ? { "Authorization": `Bearer ${GH_TOKEN}` } : {};
  const res = await fetch(url, { headers });
  return res;
}

async function loadData() {
  // 5秒内用缓存
  if (_cache && Date.now() - _cacheTime < CACHE_TTL) {
    return _cache;
  }

  try {
    const res = await githubRaw(DATA_FILE);
    if (res.status === 200) {
      const text = await res.text();
      _cache = JSON.parse(text);
      _cacheTime = Date.now();
      return _cache;
    }
  } catch (e) {
    console.log("[store] loadData error:", e.message);
  }

  // 文件不存在，初始化默认数据
  _cache = getDefaultData();
  _cacheTime = Date.now();
  await saveData(_cache);
  return _cache;
}

async function saveData(data) {
  _cache = data;
  _cacheTime = Date.now();

  if (!GH_TOKEN) {
    console.log("[store] No GH_TOKEN, skip save");
    return;
  }

  try {
    let sha = null;
    const getRes = await githubAPI(DATA_FILE);
    if (getRes.status === 200) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    const content = Buffer.from(JSON.stringify(data, null, 2)).toString("base64");
    const body = {
      message: "update store data",
      content,
      branch: GH_BRANCH,
    };
    if (sha) body.sha = sha;

    const putRes = await githubAPI(DATA_FILE, "PUT", body);
    if (putRes.status === 200 || putRes.status === 201) {
      console.log("[store] saveData success");
    } else {
      const errText = await putRes.text();
      console.log("[store] saveData failed:", putRes.status, errText);
    }
  } catch (e) {
    console.log("[store] saveData error:", e.message);
  }
}

// 上传文件二进制到 GitHub（单独路径）
async function uploadFileToGitHub(filePath, base64Content) {
  if (!GH_TOKEN) {
    throw new Error("GITHUB_TOKEN not set");
  }

  // 检查文件是否已存在
  let sha = null;
  const getRes = await githubAPI(filePath);
  if (getRes.status === 200) {
    const fileData = await getRes.json();
    sha = fileData.sha;
  }

  const body = {
    message: `upload file ${filePath}`,
    content: base64Content,
    branch: GH_BRANCH,
  };
  if (sha) body.sha = sha;

  const putRes = await githubAPI(filePath, "PUT", body);
  if (putRes.status !== 200 && putRes.status !== 201) {
    const errText = await putRes.text();
    throw new Error(`GitHub upload failed: ${putRes.status} ${errText}`);
  }
}

// 删除文件
async function deleteFileFromGitHub(filePath) {
  if (!GH_TOKEN) return;

  try {
    const getRes = await githubAPI(filePath);
    if (getRes.status === 200) {
      const fileData = await getRes.json();
      const delRes = await fetch(
        `https://api.github.com/repos/${GH_OWNER}/${GH_REPO}/contents/${filePath}`,
        {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${GH_TOKEN}`,
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
          body: JSON.stringify({
            message: `delete file ${filePath}`,
            sha: fileData.sha,
            branch: GH_BRANCH,
          }),
        }
      );
      if (delRes.status !== 200 && delRes.status !== 204) {
        console.log("[store] delete file failed:", delRes.status);
      }
    }
  } catch (e) {
    console.log("[store] deleteFile error:", e.message);
  }
}

// ========== 工具函数 ==========

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

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
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
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function safeFilename(filename) {
  // 防止路径穿越和特殊字符
  return filename.replace(/[^a-zA-Z0-9._\u4e00-\u9fa5\-]/g, "_").slice(-100);
}

// ========== 主处理函数 ==========

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers: CORS_HEADERS, body: "" };
  }

  let rawPath = event.path || "";
  rawPath = rawPath.split("?")[0];
  let apiPart = rawPath;
  const apiMatch = rawPath.match(/\/(?:api|\.netlify\/functions\/api)\/?(.*)$/);
  if (apiMatch) {
    apiPart = "/" + apiMatch[1];
  }
  const segments = apiPart.split("/").filter(Boolean);
  const method = event.httpMethod;

  let body = {};
  if (event.body) {
    try {
      body = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, "base64").toString() : event.body);
    } catch {
      // 非 JSON body
    }
  }

  const authPayload = verifyToken(event.headers.authorization || event.headers.Authorization);

  try {
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

    // POST /api/documents - 上传文档
    if (method === "POST" && segments[0] === "documents") {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleUploadDocument(event);
    }

    // DELETE /api/documents/:id - 删除文档
    if (method === "DELETE" && segments[0] === "documents" && segments[1]) {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleDeleteDocument(segments[1]);
    }

    // GET /api/categories
    if (method === "GET" && segments[0] === "categories") {
      return await handleListCategories();
    }

    // POST /api/categories
    if (method === "POST" && segments[0] === "categories") {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleAddCategory(body);
    }

    // DELETE /api/categories/:id
    if (method === "DELETE" && segments[0] === "categories" && segments[1]) {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleDeleteCategory(segments[1]);
    }

    // POST /api/login
    if (method === "POST" && segments[0] === "login") {
      return await handleLogin(body);
    }

    // POST /api/password
    if (method === "POST" && segments[0] === "password") {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleChangePassword(body);
    }

    // GET /api/stats
    if (method === "GET" && segments[0] === "stats") {
      if (!authPayload) return json({ error: "未登录" }, 401);
      return await handleStats();
    }

    // GET /api/health
    if (method === "GET" && segments[0] === "health") {
      return json({
        ok: true,
        token: GH_TOKEN ? "set" : "missing",
        repo: `${GH_OWNER}/${GH_REPO}`,
        branch: GH_BRANCH,
      });
    }

    return json({ error: "接口不存在", path: apiPart }, 404);
  } catch (err) {
    console.error("API Error:", err);
    return json({ error: "服务器错误: " + err.message }, 500);
  }
};

// ========== 处理函数实现 ==========

async function handleLogin(body) {
  const { username, password } = body;
  const data = await loadData();
  const admin = data.admin || {};

  if (!admin.username || username !== admin.username || admin.password !== hashPassword(password)) {
    return json({ error: "用户名或密码错误" }, 401);
  }

  const token = makeToken(username);
  return json({ token, username });
}

async function handleChangePassword(body) {
  const { oldPassword, newPassword } = body;
  const data = await loadData();
  const admin = data.admin || {};

  if (admin.password !== hashPassword(oldPassword)) {
    return json({ error: "原密码错误" }, 400);
  }
  if (!newPassword || newPassword.length < 6) {
    return json({ error: "新密码至少6位" }, 400);
  }

  data.admin = { ...admin, password: hashPassword(newPassword) };
  await saveData(data);
  return json({ success: true, message: "密码修改成功" });
}

async function handleListDocuments(event) {
  const queryParams = event.queryStringParameters || {};
  const keyword = (queryParams.q || "").toLowerCase().trim();
  const categoryId = queryParams.category || "";
  const page = parseInt(queryParams.page) || 1;
  const perPage = parseInt(queryParams.perPage) || 12;

  const data = await loadData();
  let documents = data.documents || [];

  if (keyword) {
    documents = documents.filter(d =>
      (d.title || "").toLowerCase().includes(keyword) ||
      (d.description || "").toLowerCase().includes(keyword)
    );
  }
  if (categoryId) {
    documents = documents.filter(d => d.categoryId === categoryId);
  }

  documents.sort((a, b) => (b.uploadTime || 0) - (a.uploadTime || 0));

  const total = documents.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const start = (page - 1) * perPage;
  const paged = documents.slice(start, start + perPage);

  const catMap = {};
  for (const cat of (data.categories || [])) {
    catMap[cat.id] = cat;
  }

  // 列表里只返回元数据，filePath 用于下载
  const result = paged.map(d => ({
    id: d.id,
    title: d.title,
    description: d.description,
    categoryId: d.categoryId,
    filename: d.filename,
    filetype: d.filetype,
    mimeType: d.mimeType,
    fileSize: d.fileSize,
    downloadCount: d.downloadCount,
    uploadTime: d.uploadTime,
    hasFile: !!d.filePath,
    category: catMap[d.categoryId] || null,
    fileSizeFormatted: formatSize(d.fileSize || 0),
    fileIcon: getFileIcon(d.filetype),
    isPreviewable: isPreviewable(d.filetype),
    uploadTimeFormatted: new Date(d.uploadTime).toLocaleString("zh-CN"),
  }));

  return json({ documents: result, total, page, totalPages, perPage });
}

async function handleGetDocument(id) {
  const data = await loadData();
  const doc = (data.documents || []).find(d => d.id === id);

  if (!doc) return json({ error: "文档不存在" }, 404);

  doc.downloadCount = (doc.downloadCount || 0) + 1;
  await saveData(data);

  const cat = doc.categoryId ? (data.categories || []).find(c => c.id === doc.categoryId) : null;

  return json({
    id: doc.id,
    title: doc.title,
    description: doc.description,
    categoryId: doc.categoryId,
    filename: doc.filename,
    filetype: doc.filetype,
    mimeType: doc.mimeType,
    fileSize: doc.fileSize,
    downloadCount: doc.downloadCount,
    uploadTime: doc.uploadTime,
    hasFile: !!doc.filePath,
    category: cat,
    fileSizeFormatted: formatSize(doc.fileSize || 0),
    fileIcon: getFileIcon(doc.filetype),
    isPreviewable: isPreviewable(doc.filetype),
    isImage: isImage(doc.filetype),
    uploadTimeFormatted: new Date(doc.uploadTime).toLocaleString("zh-CN"),
  });
}

async function handleDownloadFile(id) {
  const data = await loadData();
  const doc = (data.documents || []).find(d => d.id === id);

  if (!doc) return json({ error: "文档不存在" }, 404);
  if (!doc.filePath) return json({ error: "文件数据不存在" }, 404);

  // 从 GitHub Raw 获取文件
  try {
    const res = await githubRaw(doc.filePath);
    if (res.status !== 200) {
      return json({ error: "文件下载失败: " + res.status }, 500);
    }

    const buffer = Buffer.from(await res.arrayBuffer());

    return {
      statusCode: 200,
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.filename)}"`,
        "Content-Length": String(buffer.length),
        ...CORS_HEADERS,
      },
      body: buffer.toString("base64"),
      isBase64Encoded: true,
    };
  } catch (e) {
    return json({ error: "文件下载失败: " + e.message }, 500);
  }
}

async function handleUploadDocument(event) {
  const rawBody = JSON.parse(event.body || "{}");
  const { title, description, categoryId, filename, filetype, mimeType, fileData } = rawBody;

  if (!filename || !fileData) {
    return json({ error: "缺少文件信息" }, 400);
  }

  const buffer = Buffer.from(fileData, "base64");
  const fileSize = buffer.length;

  // 单文件最大 4MB（base64 后约5.3MB，受 Netlify Functions 6MB 请求体限制）
  if (fileSize > 4 * 1024 * 1024) {
    return json({ error: "文件太大，最大支持4MB（base64编码后约5.3MB，受Netlify函数限制）。请先用PDF/Word压缩工具压缩后再上传" }, 400);
  }

  const docId = "doc-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
  const safeName = safeFilename(filename);
  const filePath = `${FILES_DIR}/${docId}-${safeName}`;

  // 1. 先上传文件二进制到 GitHub
  await uploadFileToGitHub(filePath, fileData);

  // 2. 再保存元数据
  const doc = {
    id: docId,
    title: title || filename.replace(/\.[^.]+$/, ""),
    description: description || "",
    categoryId: categoryId || null,
    filename,
    filetype: filetype || filename.split(".").pop().toLowerCase(),
    mimeType: mimeType || "application/octet-stream",
    fileSize,
    filePath, // 文件在仓库中的路径
    downloadCount: 0,
    uploadTime: Date.now(),
  };

  const data = await loadData();
  data.documents = data.documents || [];
  data.documents.push(doc);
  await saveData(data);

  return json({
    success: true,
    message: "上传成功",
    id: docId,
    title: doc.title,
  });
}

async function handleDeleteDocument(id) {
  const data = await loadData();
  const idx = (data.documents || []).findIndex(d => d.id === id);

  if (idx === -1) return json({ error: "文档不存在" }, 404);

  const doc = data.documents[idx];

  // 删除文件
  if (doc.filePath) {
    await deleteFileFromGitHub(doc.filePath);
  }

  data.documents.splice(idx, 1);
  await saveData(data);

  return json({ success: true, message: `文档「${doc.title}」已删除` });
}

async function handleListCategories() {
  const data = await loadData();
  const categories = data.categories || [];

  const docCountMap = {};
  for (const doc of (data.documents || [])) {
    if (doc.categoryId) {
      docCountMap[doc.categoryId] = (docCountMap[doc.categoryId] || 0) + 1;
    }
  }

  const result = categories.map(cat => ({
    ...cat,
    docCount: docCountMap[cat.id] || 0,
  }));

  result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  return json({ categories: result });
}

async function handleAddCategory(body) {
  const { name, icon } = body;
  if (!name) return json({ error: "分类名称不能为空" }, 400);

  const data = await loadData();
  const categories = data.categories || [];

  if (categories.some(c => c.name === name)) {
    return json({ error: "分类已存在" }, 400);
  }

  const catId = "cat-" + Date.now();
  const cat = { id: catId, name, icon: icon || "fa-folder" };
  data.categories = [...categories, cat];
  await saveData(data);

  return json({ success: true, message: "分类添加成功", category: cat });
}

async function handleDeleteCategory(id) {
  const data = await loadData();
  data.categories = (data.categories || []).filter(c => c.id !== id);
  await saveData(data);

  return json({ success: true, message: "分类已删除" });
}

async function handleStats() {
  const data = await loadData();
  const documents = data.documents || [];
  const categories = data.categories || [];

  let totalSize = 0;
  let totalDownloads = 0;
  for (const doc of documents) {
    totalSize += doc.fileSize || 0;
    totalDownloads += doc.downloadCount || 0;
  }

  return json({
    totalDocs: documents.length,
    totalCategories: categories.length,
    totalDownloads,
    totalSize,
    totalSizeFormatted: formatSize(totalSize),
  });
}