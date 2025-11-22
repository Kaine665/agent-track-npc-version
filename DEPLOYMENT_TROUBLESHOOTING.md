# 部署问题排查指南

> 本文档用于排查云服务器部署后的常见问题

## 问题 1：前端刷新后出现 404 错误

### 症状
- 刷新任何页面（如 `/chat/agent_xxx`）都出现 404 错误
- 直接访问首页正常，但刷新其他页面就 404

### 原因
前端 Nginx 配置没有正确处理 SPA 路由

### 解决方案

1. **重新构建前端镜像**：
```bash
cd /path/to/your/project
sudo docker-compose build --no-cache frontend
sudo docker-compose restart frontend
```

2. **验证配置**：
```bash
# 进入前端容器
sudo docker exec -it npc-frontend sh

# 检查 Nginx 配置
cat /etc/nginx/conf.d/default.conf

# 应该看到 try_files $uri $uri/ /index.html; 这一行
```

3. **检查主 Nginx 日志**：
```bash
sudo docker logs npc-nginx
```

### 验证
刷新页面后应该能正常显示，不再出现 404

---

## 问题 2：AI 没有响应

### 症状
- 发送消息后，用户消息显示正常
- 但 AI 没有回复
- 轮询一直运行但没有结果

### 排查步骤

#### 1. 检查后端日志

```bash
# 查看后端日志
sudo docker logs -f npc-backend

# 应该看到类似这样的日志：
# [MessageService] Starting LLM processing for session: xxx
# [MessageService] Calling LLM API for session: xxx
```

#### 2. 检查 LLM API Key 配置

```bash
# 检查环境变量
sudo docker exec npc-backend env | grep API_KEY

# 应该看到：
# OPENROUTER_API_KEY=xxx
# OPENAI_API_KEY=xxx
# DEEPSEEK_API_KEY=xxx
```

#### 3. 检查 API Key 是否有效

查看后端日志中的错误信息：

- **`API_KEY_MISSING`**：API Key 未配置
  - 解决：在 `.env` 文件中添加 API Key
  - 重新启动：`sudo docker-compose restart backend`

- **`LLM_API_ERROR` + `401`**：API Key 无效或过期
  - 解决：更新 API Key，确保有效
  - 支持多 API Key：`OPENROUTER_API_KEY=key1,key2,key3`

- **`LLM_API_ERROR` + `429`**：API Key 达到速率限制
  - 解决：等待一段时间或使用其他 API Key
  - 支持多 API Key 自动切换

- **`LLM_API_TIMEOUT`**：LLM API 调用超时（30秒）
  - 解决：检查网络连接，或增加超时时间

#### 4. 检查 Agent 配置

```bash
# 检查 Agent 使用的模型和提供商
# 在后端日志中查找：
# [MessageService] Starting LLM processing for session: xxx
# 应该看到 model 和 provider 信息
```

#### 5. 测试 LLM API 连接

```bash
# 进入后端容器
sudo docker exec -it npc-backend sh

# 运行测试脚本（如果有）
node test-llm.js
```

### 常见错误和解决方案

#### 错误 1：`API_KEY_MISSING`

**日志示例**：
```
[LLMService] 缺少 openrouter API Key，请设置环境变量 OPENROUTER_API_KEY
```

**解决方案**：
1. 检查 `.env` 文件是否包含 API Key
2. 检查 `docker-compose.yml` 是否正确传递环境变量
3. 重新启动后端：`sudo docker-compose restart backend`

#### 错误 2：`LLM_API_ERROR` + `401 Unauthorized`

**日志示例**：
```
[LLMService] API Key 1/1 failed (401): User not found., trying next...
```

**解决方案**：
1. API Key 无效或过期，需要更新
2. 如果配置了多个 API Key，系统会自动切换到下一个
3. 更新 `.env` 文件中的 API Key
4. 重新启动后端：`sudo docker-compose restart backend`

#### 错误 3：`LLM_API_ERROR` + `429 Too Many Requests`

**日志示例**：
```
[LLMService] API Key 1/1 failed (429): Rate limit exceeded, trying next...
```

**解决方案**：
1. API Key 达到速率限制
2. 等待一段时间后重试
3. 或配置多个 API Key 自动切换

#### 错误 4：`LLM_API_TIMEOUT`

**日志示例**：
```
[LLMService] LLM API 调用超时（30秒）
```

**解决方案**：
1. 检查网络连接
2. LLM API 服务可能响应慢
3. 可以增加超时时间（修改 `MessageService.js` 中的 `timeout` 参数）

### 验证

1. **发送测试消息**：
   - 在前端发送一条消息
   - 查看后端日志，应该看到：
     - `[MessageService] Starting LLM processing`
     - `[MessageService] Calling LLM API`
     - `[MessageService] LLM API returned reply`
     - `[MessageService] ✅ Agent reply created successfully`

2. **检查前端轮询**：
   - 前端应该每 5 秒轮询一次新消息
   - 收到 AI 回复后应该自动停止轮询

---

## 问题 3：多个 API Key 配置后只读取第一个

### 症状
- 在 `.env` 文件中配置了多个 API Key（用逗号分隔）
- 但容器内只读取到第一个 key
- 多 API Key 故障转移功能无法正常工作

### 原因
Docker Compose 在处理包含特殊字符（如逗号）的环境变量值时，需要用引号包裹。

### 解决方案

1. **修改 docker-compose.yml**：
   ```yaml
   # 修改前
   OPENROUTER_API_KEY: ${OPENROUTER_API_KEY:-}
   
   # 修改后
   OPENROUTER_API_KEY: "${OPENROUTER_API_KEY:-}"
   ```

2. **确保 .env 文件格式正确**：
   ```env
   # 正确格式（一行，逗号分隔，无空格）
   OPENROUTER_API_KEY=key1,key2,key3
   ```

3. **重启后端服务**：
   ```bash
   sudo docker-compose stop backend
   sudo docker-compose up -d backend
   ```

4. **验证配置**：
   ```bash
   # 检查环境变量（应该显示 3 个 key）
   sudo docker exec npc-backend sh -c 'echo "$OPENROUTER_API_KEY"'
   
   # 检查逗号数量（应该输出 2）
   sudo docker exec npc-backend sh -c 'echo "$OPENROUTER_API_KEY"' | grep -o "," | wc -l
   ```

### 验证
配置正确后，发送测试消息应该能看到多 API Key 故障转移的日志：
```
[LLMService] API Key 1/3 failed (401): User not found., trying next...
[LLMService] API Key 2/3 succeeded
```

---

## 问题 4：其他常见问题

### 数据库连接错误

**症状**：登录、注册功能无法使用

**排查**：
```bash
# 检查数据库连接
sudo docker logs npc-backend | grep -i "database\|mysql\|connection"

# 检查数据库容器状态
sudo docker ps | grep mysql

# 检查环境变量
sudo docker exec npc-backend env | grep DB_
```

**解决方案**：
1. 确保数据库容器正常运行
2. 检查 `DB_HOST` 环境变量（应该是 `mysql`，不是 `localhost`）
3. 检查数据库密码是否正确

### 前端无法连接后端

**症状**：前端显示"backend not connected"

**排查**：
```bash
# 检查后端健康检查
curl http://localhost:8000/api/v1/health

# 检查主 Nginx 配置
sudo docker exec npc-nginx cat /etc/nginx/conf.d/default.conf
```

**解决方案**：
1. 确保后端容器正常运行
2. 检查主 Nginx 配置是否正确代理 `/api` 请求
3. 检查前端 API 配置（应该是相对路径 `/api`）

---

## 快速诊断命令

```bash
# 1. 检查所有容器状态
sudo docker ps

# 2. 检查后端日志（实时）
sudo docker logs -f npc-backend

# 3. 检查前端日志
sudo docker logs -f npc-frontend

# 4. 检查主 Nginx 日志
sudo docker logs -f npc-nginx

# 5. 检查数据库日志
sudo docker logs -f npc-mysql

# 6. 检查环境变量
sudo docker exec npc-backend env | grep -E "API_KEY|DB_|PORT"

# 7. 测试后端健康检查
curl http://localhost:8000/api/v1/health

# 8. 测试前端健康检查
curl http://localhost:3000/health
```

---

## 重新部署步骤

如果以上方法都无法解决，可以尝试重新部署：

```bash
# 1. 停止所有容器
sudo docker-compose down

# 2. 清理旧镜像（可选）
sudo docker-compose build --no-cache

# 3. 重新启动
sudo docker-compose up -d

# 4. 查看日志
sudo docker-compose logs -f
```

---

## 联系支持

如果问题仍然存在，请提供以下信息：

1. 后端日志（`sudo docker logs npc-backend`）
2. 前端日志（`sudo docker logs npc-frontend`）
3. 主 Nginx 日志（`sudo docker logs npc-nginx`）
4. 错误截图
5. 复现步骤

