# 🚀 Docker 部署快速开始

> **5 分钟快速部署指南** - 适合 Docker 新手

---

## 📋 你需要准备

1. ✅ Ubuntu 云服务器（已安装 Docker）
2. ✅ 域名（可选）
3. ✅ OpenRouter API Key（从 [openrouter.ai](https://openrouter.ai/) 获取）

---

## 🎯 三步部署

### 步骤 1：上传代码到服务器

```bash
# 在服务器上执行
git clone https://github.com/your-username/agent-track-npc-version.git
cd agent-track-npc-version
```

### 步骤 2：配置环境变量

```bash
# 复制配置文件
cp env.example .env

# 编辑配置文件（使用 nano 或 vim）
nano .env
```

**必须修改的配置**：
```env
DB_PASSWORD=你的强密码  # ⚠️ 重要！请修改
OPENROUTER_API_KEY=你的_api_key  # ⚠️ 重要！请填写
FRONTEND_API_URL=http://你的服务器IP:8000  # 或使用域名
```

### 步骤 3：一键部署

```bash
# 给脚本执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

**完成！** 🎉 访问 `http://你的服务器IP` 即可使用。

---

## 🔧 手动部署（如果脚本不工作）

### 1. 启动 MySQL

```bash
docker-compose up -d mysql
```

等待 30 秒让 MySQL 启动完成。

### 2. 初始化数据库

```bash
cd npc-backend
npm install
npm run db:init
cd ..
```

### 3. 启动所有服务

```bash
docker-compose up -d
```

### 4. 查看状态

```bash
docker-compose ps
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

## 📚 更多帮助

- **详细文档**：查看 [DEPLOYMENT.md](./DEPLOYMENT.md)
- **故障排查**：查看部署文档的"故障排查"部分
- **查看日志**：`docker-compose logs -f`

---

## ❓ 常见问题

**Q: 端口被占用怎么办？**  
A: 修改 `.env` 文件中的端口配置。

**Q: 数据库连接失败？**  
A: 检查 `.env` 中的 `DB_PASSWORD` 是否正确。

**Q: 前端无法访问后端？**  
A: 检查 `FRONTEND_API_URL` 配置是否正确。

**Q: 如何更新代码？**  
A: `git pull` → `docker-compose build` → `docker-compose up -d`

---

**需要帮助？** 查看 [DEPLOYMENT.md](./DEPLOYMENT.md) 获取详细说明。

