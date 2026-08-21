// ========== API 封装 ==========

const API_BASE = "/.netlify/functions/api";

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
  var d = new Date(ts);
  return d.toLocaleString("zh-CN", { 
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit"
  });
}

// 导航栏 HTML
function renderNavbar(active) {
  active = active || "";
  var loggedIn = Auth.isLoggedIn();
  var navItems = [];
  
  navItems.push('<a href="/index.html" class="' + (active === "home" ? "active" : "") + '"><i class="fa-solid fa-house"></i><span>首页</span></a>');
  
  if (loggedIn) {
    navItems.push('<a href="/admin.html" class="' + (active === "admin" ? "active" : "") + '"><i class="fa-solid fa-gauge"></i><span>管理</span></a>');
    navItems.push('<a href="javascript:Auth.logout()"><i class="fa-solid fa-right-from-bracket"></i><span>退出</span></a>');
  } else {
    navItems.push('<a href="/login.html"><i class="fa-solid fa-right-to-bracket"></i><span>登录</span></a>');
  }
  
  var html = '<nav class="navbar">' +
    '<a href="/index.html" class="navbar-brand"><i class="fa-solid fa-folder-tree"></i>文档中心</a>' +
    '<div class="navbar-nav">' + navItems.join("") + "</div>" +
    "</nav>";
  return html;
}
