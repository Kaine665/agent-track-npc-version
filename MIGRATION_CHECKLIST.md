# ============================================
# 手动迁移检查清单 (Migration Checklist)
# ============================================
#
# 【文件职责】
# 记录从当前仓库迁移到 v1 和 v1.5 两个独立仓库的检查清单
#
# @created 2025-01-XX
# @lastModified 2025-01-XX

## 📋 迁移前准备

### 1. 备份当前工作
- [ ] 确认所有代码已提交或暂存
- [ ] 检查是否有未提交的更改：`git status`
- [ ] 备份 `.env` 文件（如果存在）
- [ ] 备份数据库数据（如有需要）

### 2. 记录当前配置
- [ ] 记录 API Keys（OPENROUTER_API_KEY、OPENAI_API_KEY、DEEPSEEK_API_KEY）
- [ ] 记录数据库配置（DB_PASSWORD、DB_NAME、DB_USER、DB_PORT）
- [ ] 记录端口配置（BACKEND_PORT、FRONTEND_PORT）
- [ ] 记录前端 API 地址（FRONTEND_API_URL）

---

## 🚀 迁移步骤

### 步骤 1：推送到新仓库（如果需要）

```bash
# 如果要将当前代码推送到另一个仓库
git remote add backup <新仓库URL>
git push backup main
```

### 步骤 2：创建新文件夹结构

```bash
# 在父目录创建两个新文件夹
cd ..
mkdir agent-track-v1
mkdir agent-track-v1.5
```

### 步骤 3：克隆仓库到新文件夹

```bash
# 克隆 v1 版本（假设有 v1 标签或分支）
cd agent-track-v1
git clone <v1仓库URL> .

# 克隆 v1.5 版本（假设有 v1.5 标签或分支）
cd ../agent-track-v1.5
git clone <v1.5仓库URL> .
```

### 步骤 4：手动迁移本地文件

#### 4.1 环境变量文件
```bash
# 从旧项目复制 .env 文件（如果存在）
# 或者根据 env.example 重新创建
cp <旧项目路径>/.env ./agent-track-v1/.env
cp <旧项目路径>/.env ./agent-track-v1.5/.env
```

#### 4.2 检查并更新配置
- [ ] 检查 `.env` 文件中的配置是否正确
- [ ] 根据 v1 和 v1.5 的不同需求调整配置
- [ ] 确认数据库配置（如果两个版本使用不同数据库）

#### 4.3 安装依赖
```bash
# 在 v1 项目中
cd agent-track-v1
npm install
cd npc-backend && npm install
cd ../npc-frontend && npm install

# 在 v1.5 项目中
cd ../agent-track-v1.5
npm install
cd npc-backend && npm install
cd ../npc-frontend && npm install
```

---

## ✅ 迁移后验证

### v1 项目验证
- [ ] 检查 `.env` 文件是否存在且配置正确
- [ ] 运行 `npm install` 安装依赖
- [ ] 检查数据库连接是否正常
- [ ] 测试后端服务是否启动：`cd npc-backend && npm start`
- [ ] 测试前端服务是否启动：`cd npc-frontend && npm run dev`

### v1.5 项目验证
- [ ] 检查 `.env` 文件是否存在且配置正确
- [ ] 运行 `npm install` 安装依赖
- [ ] 检查数据库连接是否正常
- [ ] 测试后端服务是否启动：`cd npc-backend && npm start`
- [ ] 测试前端服务是否启动：`cd npc-frontend && npm run dev`

---

## 📝 需要手动迁移的文件列表

### 必须迁移
- [ ] `.env` - 环境变量文件（包含敏感信息）
- [ ] 数据库备份文件（如果有）

### 可选迁移（根据需求）
- [ ] `.vscode/` - VS Code 配置（如果使用）
- [ ] `.cursor/` - Cursor 配置（如果使用）
- [ ] 本地日志文件（如果需要保留历史日志）

### 不需要迁移（会自动生成）
- ❌ `node_modules/` - 通过 `npm install` 重新安装
- ❌ `.git/` - 克隆仓库时自动创建
- ❌ `package-lock.json` - 可通过 `npm install` 重新生成（但建议保留）

---

## 🔒 安全注意事项

1. **不要将 `.env` 文件提交到 Git**
   - 确保 `.gitignore` 中包含 `.env`
   - 检查 Git 历史中是否意外提交了敏感信息

2. **API Keys 安全**
   - 迁移后立即验证 API Keys 是否有效
   - 如果怀疑泄露，及时更换 API Keys

3. **数据库密码**
   - 确保数据库密码强度足够
   - 不要在不同环境间共享生产环境密码

---

## 🆘 常见问题

### Q: 如果忘记备份 `.env` 文件怎么办？
A: 可以根据 `env.example` 重新创建，但需要重新配置所有 API Keys 和密码。

### Q: 两个版本可以共用同一个数据库吗？
A: 可以，但建议使用不同的数据库名称，避免数据冲突。在 `.env` 中设置不同的 `DB_NAME`。

### Q: 迁移后如何切换版本？
A: 只需要切换到对应的文件夹，然后启动对应的服务即可。

---

## 📌 迁移完成检查

- [ ] v1 项目可以正常启动
- [ ] v1.5 项目可以正常启动
- [ ] 两个项目的数据库连接正常
- [ ] API Keys 配置正确
- [ ] 旧项目已备份或删除（确认无误后）
- [ ] 文档已更新（如有需要）

---

**迁移日期**: _______________
**迁移人员**: _______________
**备注**: _______________

