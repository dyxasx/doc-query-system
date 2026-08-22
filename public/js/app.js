// ========== 多语言 (i18n) ==========

const I18N = {
  lang: "zh",
  locales: { zh: "zh-CN", en: "en", de: "de" },
  translations: {
    zh: {
      app_title: "文档中心",
      nav_home: "首页",
      nav_admin: "管理",
      nav_logout: "退出",
      nav_login: "登录",

      // 首页
      search_ph: "搜索文档标题或描述...",
      search_btn: "搜索",
      all_categories: "全部分类",
      no_docs: "暂无文档",
      no_docs_hint: "文档上传后将在这里展示",
      no_desc: "暂无描述",
      load_failed: "加载失败",
      total_docs_only: "共 {n} 篇文档",
      page_info: "第 {p} / {t} 页（共 {n} 篇）",

      // 登录页
      login_title: "管理员登录",
      username: "用户名",
      password: "密码",
      username_ph: "请输入用户名",
      password_ph: "请输入密码",
      login_btn: "登录",
      default_account: "默认账号: admin / admin123",
      login_success: "登录成功",

      // 管理页
      page_title_admin: "后台管理",
      stat_docs: "文档总数",
      stat_cats: "分类数量",
      stat_downloads: "下载次数",
      stat_storage: "存储空间",
      upload_doc: "上传文档",
      add_cat: "添加分类",
      change_pw: "修改密码",
      search_doc_ph: "搜索文档...",
      th_doc_name: "文档名称",
      th_category: "分类",
      th_size: "大小",
      th_downloads: "下载次数",
      th_upload_time: "上传时间",
      th_actions: "操作",
      cat_manage: "分类管理",
      th_cat_name: "分类名称",
      th_doc_count: "文档数",
      cat_modal: "添加分类",
      cat_name_ph: "输入分类名称",
      icon_label: "图标（Font Awesome 类名）",
      icon_ph: "如 fa-folder",
      btn_add: "添加",
      btn_cancel: "取消",
      pw_modal: "修改密码",
      old_pw: "原密码",
      old_pw_ph: "输入原密码",
      new_pw: "新密码（至少6位）",
      new_pw_ph: "输入新密码",
      confirm_pw: "确认新密码",
      confirm_pw_ph: "再次输入新密码",
      btn_confirm: "确认修改",
      confirm_del_doc: "确定要删除文档「{t}」吗？",
      delete_success: "删除成功",
      confirm_del_cat: "确定删除分类「{n}」吗？该分类下的文档不会被删除。",
      cat_deleted: "分类已删除",
      cat_added: "分类添加成功",
      enter_cat_name: "请输入分类名称",
      pw_changed: "密码修改成功",
      pw_mismatch: "两次密码不一致",
      total_short: "共 {n} 篇",

      // 上传页
      page_title_upload: "上传文档",
      drop_hint: "点击选择文件 或拖拽到此处",
      file_type_hint: "支持 PDF / Word / Excel / PPT / 图片 / TXT / 压缩包等（最大 25MB，超过自动压缩图片）",
      btn_remove: "移除",
      doc_title_label: "文档标题",
      title_ph: "留空则使用文件名",
      doc_desc_label: "文档描述",
      desc_ph: "简要描述文档内容（可选）",
      doc_cat_label: "所属分类",
      no_cat: "-- 不选择分类 --",
      btn_start_upload: "开始上传",
      progress_uploading: "正在上传...",
      progress_preparing: "准备上传...",
      progress_compressing: "正在压缩图片...",
      progress_reading: "读取文件...",
      upload_success: "上传成功！",
      select_file_first: "请选择文件",
      img_over_25: "图片超过25MB，上传时会自动压缩",
      file_too_large: "文件太大（{s}），最大支持25MB。",
      tip_pdf: "推荐用 iLovePDF（ilovepdf.com/zh-cn/compress_pdf）在线免费压缩后重试",
      tip_doc: "建议删除文档中的大图片/视频，或另存为压缩版",
      tip_zip: "建议分卷压缩或拆分文件",
      tip_generic: "请压缩后重试",
      img_still_large: "图片压缩后仍超过25MB，请换更小的图片",
      img_compressed: "图片已自动压缩: {a} → {b}",

      // 查看页
      page_title_view: "文档详情",
      no_preview: "此文件类型不支持在线预览",
      btn_download_file: "下载文件",
      btn_download: "下载",
      btn_back: "返回",
      times_unit: "次",
      btn_back_home: "返回首页",
      param_error: "参数错误",
    },
    en: {
      app_title: "Document Center",
      nav_home: "Home",
      nav_admin: "Admin",
      nav_logout: "Logout",
      nav_login: "Login",

      search_ph: "Search documents by title or description...",
      search_btn: "Search",
      all_categories: "All Categories",
      no_docs: "No Documents",
      no_docs_hint: "Uploaded documents will appear here",
      no_desc: "No description",
      load_failed: "Failed to load",
      total_docs_only: "{n} document(s) in total",
      page_info: "Page {p} of {t} ({n} total)",

      login_title: "Admin Login",
      username: "Username",
      password: "Password",
      username_ph: "Enter username",
      password_ph: "Enter password",
      login_btn: "Log in",
      default_account: "Default: admin / admin123",
      login_success: "Logged in successfully",

      page_title_admin: "Admin Panel",
      stat_docs: "Documents",
      stat_cats: "Categories",
      stat_downloads: "Downloads",
      stat_storage: "Storage",
      upload_doc: "Upload Document",
      add_cat: "Add Category",
      change_pw: "Change Password",
      search_doc_ph: "Search documents...",
      th_doc_name: "Document Name",
      th_category: "Category",
      th_size: "Size",
      th_downloads: "Downloads",
      th_upload_time: "Uploaded At",
      th_actions: "Actions",
      cat_manage: "Category Management",
      th_cat_name: "Category Name",
      th_doc_count: "Documents",
      cat_modal: "Add Category",
      cat_name_ph: "Enter category name",
      icon_label: "Icon (Font Awesome class)",
      icon_ph: "e.g. fa-folder",
      btn_add: "Add",
      btn_cancel: "Cancel",
      pw_modal: "Change Password",
      old_pw: "Current Password",
      old_pw_ph: "Enter current password",
      new_pw: "New Password (at least 6 characters)",
      new_pw_ph: "Enter new password",
      confirm_pw: "Confirm New Password",
      confirm_pw_ph: "Re-enter new password",
      btn_confirm: "Confirm",
      confirm_del_doc: "Delete document \"{t}\"?",
      delete_success: "Deleted successfully",
      confirm_del_cat: "Delete category \"{n}\"? Documents in this category will NOT be deleted.",
      cat_deleted: "Category deleted",
      cat_added: "Category added",
      enter_cat_name: "Please enter a category name",
      pw_changed: "Password changed",
      pw_mismatch: "Passwords do not match",
      total_short: "{n} total",

      page_title_upload: "Upload Document",
      drop_hint: "Click to select a file or drag it here",
      file_type_hint: "Supports PDF / Word / Excel / PPT / images / TXT / archives (max 25MB; larger images are compressed automatically)",
      btn_remove: "Remove",
      doc_title_label: "Document Title",
      title_ph: "Leave empty to use the file name",
      doc_desc_label: "Description",
      desc_ph: "Briefly describe the document (optional)",
      doc_cat_label: "Category",
      no_cat: "-- No category --",
      btn_start_upload: "Start Upload",
      progress_uploading: "Uploading...",
      progress_preparing: "Preparing...",
      progress_compressing: "Compressing image...",
      progress_reading: "Reading file...",
      upload_success: "Upload successful!",
      select_file_first: "Please select a file first",
      img_over_25: "Image exceeds 25MB and will be compressed automatically",
      file_too_large: "File too large ({s}). Maximum is 25MB.",
      tip_pdf: "Tip: compress it for free at ilovepdf.com and try again",
      tip_doc: "Tip: remove large images/videos or save a compressed copy",
      tip_zip: "Tip: split the archive into smaller parts",
      tip_generic: "Please compress it and try again",
      img_still_large: "Image still exceeds 25MB after compression. Please use a smaller one",
      img_compressed: "Image compressed automatically: {a} → {b}",

      page_title_view: "Document Detail",
      no_preview: "This file type does not support online preview",
      btn_download_file: "Download File",
      btn_download: "Download",
      btn_back: "Back",
      times_unit: "times",
      btn_back_home: "Back to Home",
      param_error: "Invalid parameter",
    },
    de: {
      app_title: "Dokumentenzentrum",
      nav_home: "Startseite",
      nav_admin: "Verwaltung",
      nav_logout: "Abmelden",
      nav_login: "Anmelden",

      search_ph: "Dokumente nach Titel oder Beschreibung durchsuchen...",
      search_btn: "Suchen",
      all_categories: "Alle Kategorien",
      no_docs: "Keine Dokumente",
      no_docs_hint: "Hochgeladene Dokumente werden hier angezeigt",
      no_desc: "Keine Beschreibung",
      load_failed: "Laden fehlgeschlagen",
      total_docs_only: "{n} Dokument(e) insgesamt",
      page_info: "Seite {p} von {t} ({n} gesamt)",

      login_title: "Admin-Anmeldung",
      username: "Benutzername",
      password: "Passwort",
      username_ph: "Benutzername eingeben",
      password_ph: "Passwort eingeben",
      login_btn: "Anmelden",
      default_account: "Standard: admin / admin123",
      login_success: "Anmeldung erfolgreich",

      page_title_admin: "Verwaltung",
      stat_docs: "Dokumente",
      stat_cats: "Kategorien",
      stat_downloads: "Downloads",
      stat_storage: "Speicher",
      upload_doc: "Dokument hochladen",
      add_cat: "Kategorie hinzufügen",
      change_pw: "Passwort ändern",
      search_doc_ph: "Dokumente suchen...",
      th_doc_name: "Dokumentname",
      th_category: "Kategorie",
      th_size: "Größe",
      th_downloads: "Downloads",
      th_upload_time: "Hochgeladen am",
      th_actions: "Aktionen",
      cat_manage: "Kategorienverwaltung",
      th_cat_name: "Kategoriename",
      th_doc_count: "Dokumente",
      cat_modal: "Kategorie hinzufügen",
      cat_name_ph: "Kategoriename eingeben",
      icon_label: "Symbol (Font Awesome-Klasse)",
      icon_ph: "z. B. fa-folder",
      btn_add: "Hinzufügen",
      btn_cancel: "Abbrechen",
      pw_modal: "Passwort ändern",
      old_pw: "Aktuelles Passwort",
      old_pw_ph: "Aktuelles Passwort eingeben",
      new_pw: "Neues Passwort (mind. 6 Zeichen)",
      new_pw_ph: "Neues Passwort eingeben",
      confirm_pw: "Neues Passwort bestätigen",
      confirm_pw_ph: "Neues Passwort erneut eingeben",
      btn_confirm: "Bestätigen",
      confirm_del_doc: "Dokument „{t}“ wirklich löschen?",
      delete_success: "Erfolgreich gelöscht",
      confirm_del_cat: "Kategorie „{n}“ löschen? Dokumente darin werden NICHT gelöscht.",
      cat_deleted: "Kategorie gelöscht",
      cat_added: "Kategorie hinzugefügt",
      enter_cat_name: "Bitte Kategoriename eingeben",
      pw_changed: "Passwort geändert",
      pw_mismatch: "Passwörter stimmen nicht überein",
      total_short: "{n} gesamt",

      page_title_upload: "Dokument hochladen",
      drop_hint: "Klicken oder Datei hierher ziehen",
      file_type_hint: "Unterstützt PDF / Word / Excel / PPT / Bilder / TXT / Archive (max. 25 MB; größere Bilder werden automatisch komprimiert)",
      btn_remove: "Entfernen",
      doc_title_label: "Dokumenttitel",
      title_ph: "Leer lassen, um den Dateinamen zu verwenden",
      doc_desc_label: "Beschreibung",
      desc_ph: "Kurze Beschreibung (optional)",
      doc_cat_label: "Kategorie",
      no_cat: "-- Keine Kategorie --",
      btn_start_upload: "Hochladen beginnen",
      progress_uploading: "Wird hochgeladen ...",
      progress_preparing: "Vorbereitung ...",
      progress_compressing: "Bild wird komprimiert ...",
      progress_reading: "Datei wird gelesen ...",
      upload_success: "Upload erfolgreich!",
      select_file_first: "Bitte zuerst eine Datei auswählen",
      img_over_25: "Bild über 25 MB wird automatisch komprimiert",
      file_too_large: "Datei zu groß ({s}). Maximum: 25 MB.",
      tip_pdf: "Tipp: kostenlos auf ilovepdf.com komprimieren und erneut versuchen",
      tip_doc: "Tipp: große Bilder/Videos entfernen oder komprimierte Kopie speichern",
      tip_zip: "Tipp: Archiv in kleinere Teile aufteilen",
      tip_generic: "Bitte komprimieren und erneut versuchen",
      img_still_large: "Bild nach Komprimierung noch über 25 MB. Bitte kleineres Bild verwenden",
      img_compressed: "Bild automatisch komprimiert: {a} → {b}",

      page_title_view: "Dokumentdetails",
      no_preview: "Dieser Dateityp kann nicht online angezeigt werden",
      btn_download_file: "Datei herunterladen",
      btn_download: "Herunterladen",
      btn_back: "Zurück",
      times_unit: "mal",
      btn_back_home: "Zur Startseite",
      param_error: "Ungültiger Parameter",
    },
  },

  init() {
    const saved = localStorage.getItem("doc_lang");
    if (saved && this.translations[saved]) {
      this.lang = saved;
    } else {
      // 首次访问根据浏览器语言猜测（德语/英语），否则中文
      const nav = (navigator.language || "zh").toLowerCase();
      if (nav.indexOf("de") === 0) this.lang = "de";
      else if (nav.indexOf("en") === 0) this.lang = "en";
    }
    document.documentElement.lang = this.locales[this.lang];
  },

  getLang() { return this.lang; },

  setLang(lang) {
    if (!this.translations[lang]) return;
    this.lang = lang;
    localStorage.setItem("doc_lang", lang);
    document.documentElement.lang = this.locales[lang];
  },
};

function t(key, vars) {
  const dict = I18N.translations[I18N.lang] || {};
  let text = dict[key] !== undefined ? dict[key]
    : (I18N.translations.zh[key] !== undefined ? I18N.translations.zh[key] : key);
  if (vars) {
    Object.keys(vars).forEach(function(k) {
      text = text.split("{" + k + "}").join(String(vars[k]));
    });
  }
  return text;
}

// 应用静态文本翻译（HTML 中标注 data-i18n / data-i18n-ph 的元素）
function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach(function(el) {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-ph]").forEach(function(el) {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
  });
}

// 切换语言：重渲染导航栏 + 应用静态文本 + 通知页面刷新动态内容
function switchLang(lang) {
  if (lang === I18N.lang) return;
  I18N.setLang(lang);
  refreshNavbar();
  applyI18n();
  if (typeof window.onLangChange === "function") {
    try { window.onLangChange(); } catch (e) { console.error(e); }
  }
}

// ========== API 封装 ==========

const API_BASE = "/api";

// Token 管理
const Auth = {
  getToken() { return localStorage.getItem("doc_token"); },
  setToken(token) { localStorage.setItem("doc_token", token); },
  getUsername() { return localStorage.getItem("doc_username"); },
  setUsername(name) { localStorage.setItem("doc_username", name); },
  isLoggedIn() { return !!this.getToken(); },
  logout() {
    localStorage.removeItem("doc_token");
    localStorage.removeItem("doc_username");
    window.location.href = "/login.html";
  },
};

// API 请求
async function api(path, options = {}) {
  const token = Auth.getToken();
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Request failed (" + res.status + ")");
  }
  return data;
}

// ========== UI 工具 ==========

function showToast(message, type) {
  type = type || "success";
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(function() {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

function formatDate(ts) {
  if (!ts) return "-";
  const localeMap = { zh: "zh-CN", en: "en-GB", de: "de-DE" };
  var d = new Date(ts);
  return d.toLocaleString(localeMap[I18N.lang] || "zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

// ========== 导航栏 ==========

let __navActive = "";

function renderNavbar(active) {
  __navActive = active || __navActive || "";
  var cur = I18N.getLang();
  var loggedIn = Auth.isLoggedIn();
  var navItems = [];

  navItems.push('<a href="/index.html" class="' + (__navActive === "home" ? "active" : "") + '"><i class="fa-solid fa-house"></i><span>' + t("nav_home") + '</span></a>');

  if (loggedIn) {
    navItems.push('<a href="/admin.html" class="' + (__navActive === "admin" ? "active" : "") + '"><i class="fa-solid fa-gauge"></i><span>' + t("nav_admin") + '</span></a>');
    navItems.push('<a href="javascript:Auth.logout()"><i class="fa-solid fa-right-from-bracket"></i><span>' + t("nav_logout") + '</span></a>');
  } else {
    navItems.push('<a href="/login.html"><i class="fa-solid fa-right-to-bracket"></i><span>' + t("nav_login") + '</span></a>');
  }

  // 语言切换按钮（中文 / English / Deutsch）
  var langSwitch = '<div class="lang-switch" id="langSwitch">' +
    '<button class="lang-btn' + (cur === "zh" ? " active" : "") + '" onclick="switchLang(\'zh\')" title="中文" aria-label="中文">中</button>' +
    '<button class="lang-btn' + (cur === "en" ? " active" : "") + '" onclick="switchLang(\'en\')" title="English" aria-label="English">EN</button>' +
    '<button class="lang-btn' + (cur === "de" ? " active" : "") + '" onclick="switchLang(\'de\')" title="Deutsch" aria-label="Deutsch">DE</button>' +
    '</div>';

  var html = '<nav class="navbar">' +
    '<a href="/index.html" class="navbar-brand"><i class="fa-solid fa-folder-tree"></i>' + t("app_title") + '</a>' +
    '<div class="navbar-nav">' + navItems.join("") + langSwitch + "</div>" +
    "</nav>";
  return html;
}

function refreshNavbar() {
  var el = document.getElementById("navbar");
  if (el) el.innerHTML = renderNavbar(__navActive);
}

// 初始化语言（必须在各页面 renderNavbar 之前执行）
I18N.init();
