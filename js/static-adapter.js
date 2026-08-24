// ========== 静态部署适配器（仅 GitHub Pages 静态版加载）==========
// 覆盖 api() 与 docFileUrl()：从 data/store.json 读取数据，文件直链 data/files/
// 本文件由 Pages 部署工作流自动注入，Cloudflare Pages 在线版不会加载

(function () {
  "use strict";

  var STORE = null;
  var STORE_READY = fetch("data/store.json", { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("store.json 加载失败 (" + r.status + ")");
      return r.json();
    })
    .then(function (s) { STORE = s; })
    .catch(function (e) {
      console.error("[static-adapter] 数据加载失败:", e);
      throw e;
    });

  // ---------- 派生逻辑（与在线 API 保持一致） ----------
  function formatSize(bytes) {
    if (!bytes) return "0 B";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  var ICON_MAP = {
    pdf: "fa-file-pdf", doc: "fa-file-word", docx: "fa-file-word",
    xls: "fa-file-excel", xlsx: "fa-file-excel",
    ppt: "fa-file-powerpoint", pptx: "fa-file-powerpoint",
    txt: "fa-file-lines", md: "fa-file-lines", csv: "fa-file-csv",
    png: "fa-file-image", jpg: "fa-file-image", jpeg: "fa-file-image",
    gif: "fa-file-image", bmp: "fa-file-image", webp: "fa-file-image", svg: "fa-file-image",
    zip: "fa-file-zipper", rar: "fa-file-zipper", "7z": "fa-file-zipper",
    mp4: "fa-file-video", mp3: "fa-file-audio", wav: "fa-file-audio",
  };
  var PREVIEWABLE = ["pdf", "txt", "md", "csv", "png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"];
  var IMAGE_TYPES = ["png", "jpg", "jpeg", "gif", "bmp", "webp", "svg"];

  function getFileIcon(ft) { return ICON_MAP[ft] || "fa-file"; }
  function isPreviewable(ft) { return PREVIEWABLE.indexOf(ft) >= 0; }
  function isImage(ft) { return IMAGE_TYPES.indexOf(ft) >= 0; }

  function decorate(doc, catMap) {
    var cat = doc.categoryId && catMap ? catMap[doc.categoryId] : null;
    return {
      id: doc.id, title: doc.title, description: doc.description,
      categoryId: doc.categoryId, filename: doc.filename, filetype: doc.filetype,
      fileSize: doc.fileSize, downloadCount: doc.downloadCount || 0,
      uploadTime: doc.uploadTime,
      category: cat || null,
      fileSizeFormatted: formatSize(doc.fileSize),
      fileIcon: getFileIcon(doc.filetype),
      isPreviewable: isPreviewable(doc.filetype),
      isImage: isImage(doc.filetype),
      uploadTimeFormatted: new Date(doc.uploadTime).toLocaleString("zh-CN"),
    };
  }

  // ---------- 覆盖 api() ----------
  window.api = function (path, options) {
    options = options || {};
    var method = (options.method || "GET").toUpperCase();
    if (method !== "GET") {
      return Promise.reject(new Error("当前为静态浏览版，此操作不可用。完整功能请访问在线系统。"));
    }

    return STORE_READY.then(function () {
      // 去掉查询串解析路径
      var qIdx = path.indexOf("?");
      var query = {};
      if (qIdx >= 0) {
        var qs = path.slice(qIdx + 1);
        path = path.slice(0, qIdx);
        qs.split("&").forEach(function (kv) {
          var p = kv.split("=");
          query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || "");
        });
      }

      var docs = (STORE.documents || []).slice();
      var cats = STORE.categories || [];
      var catMap = {};
      cats.forEach(function (c) { catMap[c.id] = c; });

      // GET /categories
      if (path === "/categories") {
        var countMap = {};
        docs.forEach(function (d) {
          if (d.categoryId) countMap[d.categoryId] = (countMap[d.categoryId] || 0) + 1;
        });
        var result = cats.map(function (c) {
          var copy = {};
          for (var k in c) copy[k] = c[k];
          copy.docCount = countMap[c.id] || 0;
          return copy;
        });
        result.sort(function (a, b) { return (a.name || "").localeCompare(b.name || ""); });
        return { categories: result };
      }

      // GET /documents/:id
      var m = path.match(/^\/documents\/([^\/]+)$/);
      if (m) {
        var id = m[1];
        var found = docs.find(function (d) { return d.id === id; });
        if (!found) throw new Error("文档不存在");
        return decorate(found, catMap);
      }

      // GET /documents?page=&q=&category=
      if (path === "/documents" || path === "/documents/") {
        var keyword = (query.q || "").toLowerCase().trim();
        var categoryId = query.category || "";
        var page = parseInt(query.page) || 1;
        var perPage = parseInt(query.perPage) || 12;

        if (keyword) {
          docs = docs.filter(function (d) {
            return ((d.title || "") + " " + (d.description || "")).toLowerCase().indexOf(keyword) >= 0;
          });
        }
        if (categoryId) docs = docs.filter(function (d) { return d.categoryId === categoryId; });

        docs.sort(function (a, b) { return (b.uploadTime || 0) - (a.uploadTime || 0); });

        var total = docs.length;
        var totalPages = Math.max(1, Math.ceil(total / perPage));
        if (page < 1) page = 1;
        if (page > totalPages) page = totalPages;
        var paged = docs.slice((page - 1) * perPage, page * perPage);

        return {
          documents: paged.map(function (d) { return decorate(d, catMap); }),
          total: total, page: page, totalPages: totalPages, perPage: perPage,
        };
      }

      throw new Error("静态浏览版不支持该接口: " + path);
    });
  };

  // ---------- 覆盖 docFileUrl()：直链静态文件 ----------
  window.docFileUrl = function (docId) {
    var doc = STORE && STORE.documents ? STORE.documents.find(function (d) { return d.id === docId; }) : null;
    if (doc && doc.filePath) return doc.filePath; // 如 "data/files/xxx.pdf"（相对路径）
    return "data/files/" + docId; // 兜底
  };

  // 登录页提示：静态版无需登录
  if (/login\.html$/.test(location.pathname)) {
    STORE_READY.then(function () {
      try {
        var tip = document.createElement("div");
        tip.style.cssText = "max-width:420px;margin:16px auto 0;padding:10px 16px;background:#fff8e1;border:1px solid #ffe082;border-radius:8px;font-size:13px;color:#8d6e00;text-align:center;";
        tip.innerHTML = '<i class="fa-solid fa-circle-info"></i> 当前为静态浏览版，无需登录即可查看文档。';
        var form = document.querySelector(".login-box, form, .container");
        (form || document.body).appendChild(tip);
      } catch (e) { /* 忽略 */ }
    }).catch(function () {});
  }
})();
