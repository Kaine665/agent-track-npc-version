# CORS 配置说明

## 📋 概述

后端现在支持基于环境变量的 CORS（跨域资源共享）配置，可以精确控制允许访问的来源，提高安全性。

---

## 🔧 配置方式

### 方式一：使用环境变量自动生成（推荐）

在 `.env` 文件中设置：

```bash
# 设置服务器 IP
SERVER_IP=123.456.789.0

# 系统会自动允许：
# - http://123.456.789.0 (生产环境，通过 Nginx)
# - http://123.456.789.0:80 (生产环境)
# - http://123.456.789.0:3001 (Green 测试环境)
# - http://123.456.789.0:3000 (Blue 测试环境)
```

### 方式二：手动指定允许的来源（完全控制）

```bash
# 手动指定允许的来源（用逗号分隔）
CORS_ORIGINS=http://123.456.789.0,http://123.456.789.0:3001,https://yourdomain.com
```

### 方式三：混合使用（环境变量 + 手动指定）

```bash
SERVER_IP=123.456.789.0
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# 系统会合并两者：
# - 自动生成的来源（基于 SERVER_IP）
# - 手动指定的来源
```

---

## 🌍 环境变量说明

| 变量名 | 说明 | 示例 | 必填 |
|--------|------|------|------|
| `CORS_ORIGINS` | 允许的来源列表（逗号分隔） | `http://localhost:3000,http://localhost:3001` | 否 |
| `SERVER_IP` | 服务器 IP（用于自动生成） | `123.456.789.0` | 否 |
| `FRONTEND_DOMAIN` | 前端域名（生产环境） | `yourdomain.com` | 否 |
| `DEBUG_CORS` | 是否输出调试信息 | `true` / `false` | 否 |

---

## 🎯 自动生成的允许来源

系统会根据环境自动添加以下来源：

### 生产环境（NODE_ENV=production）

- `http://${SERVER_IP}` - 通过 Nginx 访问
- `http://${SERVER_IP}:80` - 直接访问端口 80
- `http://${FRONTEND_DOMAIN}` - 如果有域名配置
- `https://${FRONTEND_DOMAIN}` - HTTPS 域名

### 测试环境

- `http://${SERVER_IP}:3001` - Green 环境测试
- `http://${SERVER_IP}:3000` - Blue 环境测试

### 开发环境

- `http://localhost:3000` - 本地开发服务器
- `http://localhost:5173` - Vite 默认端口
- `http://127.0.0.1:3000` - 本地回环地址

---

## 🚀 使用示例

### 示例 1：基本配置（自动生成）

```bash
# .env 文件
SERVER_IP=123.456.789.0
```

**结果：**
- ✅ `http://123.456.789.0` (生产环境)
- ✅ `http://123.456.789.0:3001` (Green 测试)
- ✅ `http://123.456.789.0:3000` (Blue 测试)

### 示例 2：使用域名

```bash
# .env 文件
SERVER_IP=123.456.789.0
FRONTEND_DOMAIN=yourdomain.com
```

**结果：**
- ✅ `http://123.456.789.0` (生产环境)
- ✅ `https://yourdomain.com` (HTTPS 域名)
- ✅ `http://yourdomain.com` (HTTP 域名)
- ✅ `http://123.456.789.0:3001` (Green 测试)

### 示例 3：完全自定义

```bash
# .env 文件
CORS_ORIGINS=http://localhost:3000,https://app.example.com,https://admin.example.com
```

**结果：**
- ✅ 只允许指定的来源
- ❌ 不会自动添加其他来源

---

## 🔍 调试

### 查看允许的来源列表

启动时设置 `DEBUG_CORS=true`：

```bash
# .env 文件
DEBUG_CORS=true
```

启动后端后，会输出：

```
🔒 CORS 允许的来源:
   - http://123.456.789.0
   - http://123.456.789.0:80
   - http://123.456.789.0:3001
   - http://123.456.789.0:3000
```

### 测试 CORS 配置

```bash
# 测试允许的来源
curl -H "Origin: http://your-server-ip:3001" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     http://localhost:8001/api/v1/health

# 应该返回 CORS 头：
# Access-Control-Allow-Origin: http://your-server-ip:3001
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
```

---

## 🛡️ 安全说明

### 优先级

1. **CORS_ORIGINS 环境变量**（最高优先级）
   - 如果设置了，会使用这个列表
   - 仍然会合并自动生成的来源

2. **自动生成**（基于 SERVER_IP）
   - 如果没有设置 CORS_ORIGINS，完全使用自动生成
   - 如果设置了 CORS_ORIGINS，会合并两者

### 拒绝的来源

如果请求的来源不在允许列表中，会：
- 返回错误：`不允许的 CORS 来源`
- 记录警告日志（包含拒绝的来源和允许的列表）

---

## 📝 蓝绿部署中的使用

### Green 环境部署

部署脚本会自动配置：

```bash
# 自动设置 CORS_ORIGINS
CORS_ORIGINS="http://${SERVER_IP},http://${SERVER_IP}:80,http://${SERVER_IP}:3001"
```

**允许的来源：**
- ✅ `http://server-ip` (生产环境，通过 Nginx)
- ✅ `http://server-ip:3001` (Green 前端直接访问)

### Blue 环境部署

```bash
# 自动设置 CORS_ORIGINS
CORS_ORIGINS="http://${SERVER_IP},http://${SERVER_IP}:80,http://${SERVER_IP}:3000"
```

**允许的来源：**
- ✅ `http://server-ip` (生产环境，通过 Nginx)
- ✅ `http://server-ip:3000` (Blue 前端直接访问)

---

## ⚠️ 注意事项

1. **开发环境**：默认允许 localhost，方便本地开发
2. **生产环境**：只允许配置的来源，提高安全性
3. **服务器端请求**：没有 Origin 头的请求（如 curl、Postman）会自动允许
4. **域名配置**：如果使用域名，记得配置 `FRONTEND_DOMAIN`

---

## 🔗 相关文件

- 后端配置：`npc-backend/server.js`
- 环境变量示例：`env.example`
- 部署脚本：`deploy-blue-green.sh`
- Docker Compose：`docker-compose.yml`

