# 部署指南

> **v1.0.0** | 最后更新：2025-11-22

---

## 📋 快速开始（5 分钟）

### 1. 准备服务器

- Ubuntu 云服务器（推荐腾讯云）
- 开放端口：22（SSH）、80（HTTP）、443（HTTPS，可选）

### 2. 安装 Docker

```bash
# 更新系统
sudo apt update

# 安装 Docker（使用腾讯云镜像源）
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release
curl -fsSL https://mirrors.cloud.tencent.com/docker-ce/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://mirrors.cloud.tencent.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 启动 Docker
sudo systemctl start docker
sudo systemctl enable docker
```

### 3. 上传代码

```bash
# 方法 1：Git Clone
git clone https://github.com/your-username/agent-track-npc-version.git
cd agent-track-npc-version

# 方法 2：使用 WinSCP 上传项目文件夹
```

### 4. 配置环境变量

```bash
# 复制配置文件
cp env.example .env

# 编辑配置（必须修改）
nano .env
```

**必须修改的配置**：
```env
DB_PASSWORD=你的强密码          # ⚠️ 重要！
OPENROUTER_API_KEY=你的_api_key  # ⚠️ 重要！
```

### 5. 一键部署

```bash
# 给脚本权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

**完成！** 访问 `http://你的服务器IP` 即可使用。

---

## 🔧 手动部署（如果脚本不工作）

```bash
# 1. 启动 MySQL
docker-compose up -d mysql
sleep 30

# 2. 初始化数据库
cd npc-backend
npm install
npm run db:init
cd ..

# 3. 启动所有服务
docker-compose up -d

# 4. 查看状态
docker-compose ps
```

---

## ❓ 常见问题

### 问题 1：刷新页面后出现 404 错误

**症状**：刷新任何页面（如 `/chat/agent_xxx`）都出现 404

**解决方案**：
```bash
# 重新加载 Nginx 配置
sudo docker exec npc-nginx nginx -s reload
sudo docker exec npc-frontend nginx -s reload
```

### 问题 2：AI 没有响应

**排查步骤**：
1. 检查后端日志：`sudo docker logs npc-backend`
2. 检查 API Key 配置：`sudo docker exec npc-backend env | grep API_KEY`
3. 查看错误信息：
   - `API_KEY_MISSING`：未配置 API Key
   - `401`：API Key 无效或过期
   - `429`：达到速率限制

### 问题 3：数据库连接失败

**解决方案**：
1. 检查 `.env` 中的 `DB_PASSWORD` 是否正确
2. 检查 MySQL 容器是否运行：`docker-compose ps mysql`
3. 查看 MySQL 日志：`docker-compose logs mysql`

### 问题 4：端口被占用

**解决方案**：
修改 `.env` 文件中的端口配置：
```env
BACKEND_PORT=8001    # 修改后端端口
FRONTEND_PORT=3001   # 修改前端端口
NGINX_HTTP_PORT=8080 # 修改 Nginx 端口
```

---

## 📚 常用命令

```bash
# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f              # 所有服务
docker-compose logs -f backend      # 后端日志
docker-compose logs -f frontend     # 前端日志
docker-compose logs -f nginx        # Nginx 日志

# 重启服务
docker-compose restart              # 所有服务
docker-compose restart backend      # 只重启后端

# 停止服务
docker-compose stop

# 启动服务
docker-compose start

# 重新构建镜像
docker-compose build --no-cache frontend
docker-compose restart frontend
```

---

## 🌐 配置域名（可选）

### 1. 修改 Nginx 配置

编辑 `nginx/conf.d/default.conf`：
```nginx
server_name yourdomain.com www.yourdomain.com;  # 替换为你的域名
```

### 2. 重启 Nginx

```bash
docker-compose restart nginx
```

### 3. 配置 DNS

在你的域名服务商添加 A 记录：
- 主机：@
- 值：你的服务器 IP

---

## 🔄 更新代码

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建镜像（如果需要）
docker-compose build --no-cache

# 3. 重启服务
docker-compose restart
```

---

**需要更多帮助？** 查看项目根目录的 `README.md` 或提交 Issue。
