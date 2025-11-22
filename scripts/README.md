# 日志和监控脚本使用指南

> 这些脚本帮助你快速查看日志、检查服务状态、排查问题

## 📋 脚本列表

### 1. 快速检查脚本

**功能**：一键检查所有服务的状态和常见问题

**使用方法**：

**Linux/Mac（在服务器上）**：
```bash
./scripts/quick-check.sh
```

**Windows（本地开发）**：
```powershell
.\scripts\quick-check.ps1
```

**检查内容**：
- ✅ 容器运行状态
- ✅ API Key 配置
- ✅ 后端/前端健康状态
- ✅ 最近的错误日志
- ✅ 数据库连接状态

---

### 2. 日志查看脚本

**功能**：实时查看各个服务的日志

**使用方法**：

**Linux/Mac（在服务器上）**：
```bash
# 查看后端日志
./scripts/view-logs.sh backend

# 查看前端日志
./scripts/view-logs.sh frontend

# 查看 Nginx 日志
./scripts/view-logs.sh nginx

# 查看数据库日志
./scripts/view-logs.sh mysql

# 查看所有服务日志
./scripts/view-logs.sh all
```

**Windows（本地开发）**：
```powershell
# 查看后端日志
.\scripts\view-logs.ps1 backend

# 查看前端日志
.\scripts\view-logs.ps1 frontend

# 查看所有服务日志
.\scripts\view-logs.ps1 all
```

**提示**：按 `Ctrl+C` 退出日志查看

---

### 3. 健康检查脚本

**功能**：详细检查所有服务的健康状态

**使用方法**：

**Linux/Mac（在服务器上）**：
```bash
./scripts/check-health.sh
```

**检查内容**：
- 容器状态
- 后端健康检查
- 前端健康检查
- 数据库连接
- 环境变量配置
- 最近的错误日志

---

### 4. 实时监控脚本

**功能**：实时监控所有服务的状态和日志

**使用方法**：

**Linux/Mac（在服务器上）**：
```bash
./scripts/monitor.sh
```

**显示内容**：
- 容器状态（每 5 秒更新）
- 后端/前端健康状态
- 最近的日志（自动刷新）

**提示**：按 `Ctrl+C` 退出监控

---

## 🚀 快速开始

### 场景 1：检查服务是否正常

```bash
# 快速检查
./scripts/quick-check.sh
```

### 场景 2：查看 AI 响应问题

```bash
# 1. 先快速检查
./scripts/quick-check.sh

# 2. 查看后端日志（实时）
./scripts/view-logs.sh backend

# 3. 在浏览器发送消息，观察日志输出
```

### 场景 3：排查 404 问题

```bash
# 1. 查看前端日志
./scripts/view-logs.sh frontend

# 2. 查看 Nginx 日志
./scripts/view-logs.sh nginx

# 3. 检查健康状态
./scripts/check-health.sh
```

---

## 📊 日志级别说明

### 后端日志

- `[MessageService]` - 消息服务相关日志
- `[LLMService]` - LLM API 调用日志
- `✅` - 成功操作
- `❌` - 错误操作
- `⚠️` - 警告信息

### 常见错误日志

- `API_KEY_MISSING` - API Key 未配置
- `401 Unauthorized` - API Key 无效
- `429 Too Many Requests` - API Key 达到速率限制
- `LLM_API_TIMEOUT` - LLM API 调用超时
- `ECONNREFUSED` - 连接被拒绝（通常是数据库连接问题）

---

## 💡 使用技巧

### 1. 过滤日志

```bash
# 只看错误日志
docker logs npc-backend 2>&1 | grep -i error

# 只看 LLM 相关日志
docker logs npc-backend 2>&1 | grep -i llm

# 只看最近 50 行
docker logs --tail 50 npc-backend
```

### 2. 保存日志到文件

```bash
# 保存后端日志
docker logs npc-backend > backend.log 2>&1

# 保存所有服务日志
docker-compose logs > all-logs.log
```

### 3. 实时监控特定错误

```bash
# 监控 API Key 错误
docker logs -f npc-backend 2>&1 | grep -i "API_KEY"

# 监控 LLM 调用
docker logs -f npc-backend 2>&1 | grep -i "LLM"
```

---

## 🔧 故障排查流程

### 步骤 1：快速检查

```bash
./scripts/quick-check.sh
```

### 步骤 2：查看详细日志

```bash
# 根据问题类型选择
./scripts/view-logs.sh backend   # AI 响应问题
./scripts/view-logs.sh frontend # 前端问题
./scripts/view-logs.sh nginx    # 404 问题
```

### 步骤 3：根据错误信息处理

参考 `DEPLOYMENT_TROUBLESHOOTING.md` 中的解决方案

---

## 📝 注意事项

1. **在服务器上使用**：这些脚本需要在 Linux/Mac 服务器上运行
2. **Windows 本地开发**：可以使用 PowerShell 版本的脚本（`.ps1`）
3. **权限问题**：如果脚本无法执行，使用 `chmod +x scripts/*.sh` 添加执行权限
4. **Docker 命令**：确保 Docker 和 Docker Compose 已安装并可用

---

## 🆘 需要帮助？

如果脚本无法运行或遇到问题：

1. 检查 Docker 是否运行：`docker ps`
2. 检查脚本权限：`ls -l scripts/`
3. 手动运行 Docker 命令：
   ```bash
   docker logs npc-backend
   docker ps
   curl http://localhost:8000/api/v1/health
   ```

