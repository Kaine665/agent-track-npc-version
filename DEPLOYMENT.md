# Docker 部署指南

**文档版本**：v1.0  
**最后更新**：2025-11-22  
**适用环境**：Ubuntu + Docker 云服务器

---

## 📋 前置条件

- ✅ Ubuntu 云服务器（已安装 Docker 和 Docker Compose）
- ✅ 域名（可选，但推荐）
- ✅ 基本的 Linux 命令行知识

---

## 🚀 快速开始（5 步部署）

### 步骤 1：准备服务器

**1.1 连接到服务器**

```bash
ssh root@your-server-ip
# 或使用你的用户名
ssh username@your-server-ip
```

**1.2 安装 Docker 和 Docker Compose（如果还没安装）**

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

---

### 步骤 2：上传项目代码

**方式一：使用 Git（推荐）**

```bash
# 安装 Git（如果还没安装）
sudo apt install git -y

# 克隆项目（替换为你的仓库地址）
git clone https://github.com/your-username/agent-track-npc-version.git
cd agent-track-npc-version
```

**方式二：使用 SCP 上传**

在本地电脑执行：

```bash
# Windows PowerShell
scp -r . username@your-server-ip:/home/username/npc-app

# Linux/Mac
scp -r . username@your-server-ip:/home/username/npc-app
```

然后在服务器上：

```bash
cd /home/username/npc-app
```

---

### 步骤 3：配置环境变量

**3.1 创建 .env 文件**

```bash
# 复制示例文件
cp .env.example .env

# 编辑配置文件
nano .env
# 或使用 vim
vim .env
```

**3.2 填写配置信息**

```env
# 数据库配置（重要！）
DB_PASSWORD=你的强密码  # ⚠️ 请修改为强密码
DB_NAME=npc_db
DB_USER=root
DB_PORT=3306

# 服务端口配置
BACKEND_PORT=8000
FRONTEND_PORT=3000
NGINX_HTTP_PORT=80
NGINX_HTTPS_PORT=443

# LLM API 配置
OPENROUTER_API_KEY=你的_openrouter_api_key

# 前端 API 配置（如果使用域名，替换为域名）
# 例如：https://api.example.com
FRONTEND_API_URL=http://your-server-ip:8000
```

**重要提示**：
- `DB_PASSWORD`：请使用强密码（至少 16 位，包含大小写字母、数字、特殊字符）
- `OPENROUTER_API_KEY`：从 [OpenRouter](https://openrouter.ai/) 获取
- `FRONTEND_API_URL`：如果使用域名，替换为 `https://api.yourdomain.com`

---

### 步骤 4：初始化数据库

**4.1 启动 MySQL 服务（仅启动数据库）**

```bash
docker-compose up -d mysql
```

**4.2 等待 MySQL 启动完成（约 30 秒）**

```bash
# 查看日志
docker-compose logs -f mysql

# 看到 "ready for connections" 表示启动成功
# 按 Ctrl+C 退出日志查看
```

**4.3 初始化数据库表结构**

```bash
# 进入后端容器
docker-compose exec backend sh

# 在容器内执行初始化脚本
node scripts/init-database.js

# 退出容器
exit
```

**或者，直接在服务器上执行（如果服务器有 Node.js）：**

```bash
cd npc-backend
npm install
npm run db:init
```

---

### 步骤 5：启动所有服务

**5.1 构建并启动所有服务**

```bash
# 回到项目根目录
cd /path/to/agent-track-npc-version

# 构建并启动所有服务（首次启动会构建镜像，需要几分钟）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

**5.2 验证服务运行**

```bash
# 检查所有容器是否运行
docker-compose ps

# 应该看到 4 个服务都在运行：
# - npc-mysql
# - npc-backend
# - npc-frontend
# - npc-nginx

# 测试后端健康检查
curl http://localhost:8000/api/v1/health

# 测试前端
curl http://localhost:3000
```

---

## 🌐 配置域名和 Nginx（可选但推荐）

### 步骤 1：配置域名 DNS

在你的域名服务商（如 Cloudflare、阿里云等）添加 DNS 记录：

```
类型：A 记录
主机：@ 或 www
值：你的服务器 IP 地址
TTL：自动
```

### 步骤 2：修改 Nginx 配置

**2.1 编辑 Nginx 配置文件**

```bash
nano nginx/conf.d/default.conf
```

**2.2 修改 server_name**

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;  # 替换为你的域名
    # ... 其他配置保持不变
}
```

**2.3 重启 Nginx**

```bash
docker-compose restart nginx
```

### 步骤 3：配置 SSL 证书（HTTPS）

**方式一：使用 Let's Encrypt（免费，推荐）**

```bash
# 安装 Certbot
sudo apt install certbot -y

# 获取证书（替换为你的域名和邮箱）
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com --email your-email@example.com

# 证书会保存在：/etc/letsencrypt/live/yourdomain.com/
```

**方式二：使用 Cloudflare（如果使用 Cloudflare DNS）**

1. 登录 Cloudflare
2. 选择你的域名
3. SSL/TLS → 加密模式选择 "完全（严格）"
4. 自动生成 SSL 证书

**2.4 更新 Nginx 配置启用 HTTPS**

编辑 `nginx/conf.d/default.conf`，取消注释 HTTPS 配置：

```nginx
# HTTPS 服务器配置
server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL 证书配置（Let's Encrypt）
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # ... 其他配置
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

**2.5 挂载 SSL 证书到容器**

修改 `docker-compose.yml`，在 nginx 服务中添加 volumes：

```yaml
nginx:
  # ... 其他配置
  volumes:
    - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    - ./nginx/conf.d:/etc/nginx/conf.d:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro  # 添加这行
```

**2.6 重启服务**

```bash
docker-compose restart nginx
```

---

## 🔧 常用操作

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
docker-compose logs -f nginx
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启特定服务
docker-compose restart backend
docker-compose restart frontend
```

### 停止服务

```bash
# 停止所有服务（不删除容器）
docker-compose stop

# 停止并删除容器
docker-compose down

# 停止并删除容器和数据卷（⚠️ 会删除数据库数据）
docker-compose down -v
```

### 更新代码

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建镜像
docker-compose build

# 3. 重启服务
docker-compose up -d
```

### 备份数据库

```bash
# 创建备份
docker-compose exec mysql mysqldump -u root -p${DB_PASSWORD} npc_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 恢复备份
docker-compose exec -T mysql mysql -u root -p${DB_PASSWORD} npc_db < backup_20251122_120000.sql
```

---

## 🐛 故障排查

### 问题 1：容器无法启动

**检查日志**：
```bash
docker-compose logs service-name
```

**常见原因**：
- 端口被占用：检查端口是否被其他服务占用
- 环境变量配置错误：检查 `.env` 文件
- 数据库连接失败：检查 MySQL 是否启动

### 问题 2：数据库连接失败

**检查 MySQL 日志**：
```bash
docker-compose logs mysql
```

**常见原因**：
- 密码错误：检查 `.env` 中的 `DB_PASSWORD`
- MySQL 未启动：`docker-compose ps` 查看状态
- 网络问题：检查 `docker-compose.yml` 中的网络配置

### 问题 3：前端无法访问后端 API

**检查配置**：
- 检查 `FRONTEND_API_URL` 是否正确
- 检查 Nginx 配置中的 `proxy_pass` 是否正确
- 检查后端服务是否正常运行：`curl http://localhost:8000/api/v1/health`

### 问题 4：Nginx 502 Bad Gateway

**检查**：
```bash
# 检查后端服务是否运行
docker-compose ps backend

# 检查后端日志
docker-compose logs backend

# 检查 Nginx 配置
docker-compose exec nginx nginx -t
```

---

## 📚 参考资源

- [Docker 官方文档](https://docs.docker.com/)
- [Docker Compose 文档](https://docs.docker.com/compose/)
- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Let's Encrypt 文档](https://letsencrypt.org/docs/)

---

## 💡 安全建议

1. **使用强密码**：数据库密码至少 16 位
2. **启用 HTTPS**：使用 Let's Encrypt 免费证书
3. **防火墙配置**：只开放必要端口（80, 443）
4. **定期备份**：设置数据库自动备份
5. **更新系统**：定期更新 Docker 和系统包
6. **限制访问**：使用防火墙限制数据库端口访问

---

## 🎉 完成！

部署完成后，访问：
- **HTTP**：`http://your-server-ip` 或 `http://yourdomain.com`
- **HTTPS**：`https://yourdomain.com`（如果配置了 SSL）

如有问题，请查看日志或参考故障排查部分。

