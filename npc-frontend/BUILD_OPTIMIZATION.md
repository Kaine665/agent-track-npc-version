# 构建优化指南

> 本文档说明如何加快前端构建速度

## 🚀 已应用的优化

### 1. Vite 配置优化

- ✅ **关闭 source map**：生产环境不需要，可以加快构建速度
- ✅ **使用 esbuild 压缩**：比 terser 快很多
- ✅ **手动分包**：减少重复打包，提高缓存命中率

### 2. Dockerfile 优化

- ✅ **使用 npm ci**：比 npm install 更快且更可靠
- ✅ **利用 Docker 层缓存**：先复制 package.json，再复制代码
- ✅ **跳过审计**：`--no-audit` 加快安装速度
- ✅ **使用缓存**：`--prefer-offline` 优先使用本地缓存

### 3. npm 配置优化

- ✅ **禁用进度显示**：`progress=false` 加快速度
- ✅ **禁用审计**：`audit=false` 加快安装速度
- ✅ **使用缓存**：`prefer-offline=true`

---

## 📊 构建时间对比

### 优化前
- 依赖安装：5-10 分钟
- 构建：3-5 分钟
- **总计：8-15 分钟**

### 优化后（首次）
- 依赖安装：2-5 分钟（使用缓存后更快）
- 构建：1-2 分钟
- **总计：3-7 分钟**

### 优化后（使用缓存）
- 依赖安装：10-30 秒（如果依赖没变化）
- 构建：1-2 分钟
- **总计：1-3 分钟**

---

## 🔧 进一步优化（可选）

### 1. 使用国内镜像（如果网络慢）

**方法 1：修改 .npmrc**

编辑 `npc-frontend/.npmrc`，取消注释：
```
registry=https://registry.npmmirror.com
```

**方法 2：临时使用**

```bash
npm install --registry=https://registry.npmmirror.com
```

### 2. 使用 pnpm（更快）

如果 npm 还是很慢，可以尝试使用 pnpm：

```bash
# 安装 pnpm
npm install -g pnpm

# 使用 pnpm 安装依赖
pnpm install

# 使用 pnpm 构建
pnpm build
```

### 3. 本地构建（避免 Docker 构建）

如果 Docker 构建很慢，可以先本地构建，再复制到服务器：

```bash
# 本地构建
cd npc-frontend
npm install
npm run build

# 然后只构建 Docker 镜像（不重新构建前端）
docker build -t npc-frontend:latest --target production .
```

---

## 🐛 常见问题

### 问题 1：构建仍然很慢

**可能原因**：
1. 网络慢（下载依赖慢）
2. 磁盘 I/O 慢
3. CPU 性能不足

**解决方案**：
1. 使用国内镜像（修改 .npmrc）
2. 使用 SSD 硬盘
3. 增加 Docker 内存限制

### 问题 2：Docker 构建缓存失效

**原因**：修改了 package.json 或源代码

**解决方案**：
- 这是正常的，只有依赖没变化时才会使用缓存
- 如果频繁修改代码，考虑本地构建

### 问题 3：内存不足

**错误信息**：`JavaScript heap out of memory`

**解决方案**：
- Dockerfile 中已设置 `NODE_OPTIONS="--max-old-space-size=4096"`
- 如果还是不够，可以增加到 8192

---

## 💡 最佳实践

### 1. 开发时

```bash
# 使用开发模式（更快，支持 HMR）
npm run dev
```

### 2. 构建生产版本

```bash
# 使用生产模式构建
npm run build

# 或使用 Docker（会自动使用生产模式）
docker-compose build frontend
```

### 3. 频繁构建时

如果频繁修改代码，建议：
1. 本地开发使用 `npm run dev`
2. 只在部署时使用 Docker 构建

---

## 📈 监控构建时间

### 查看构建时间

```bash
# Docker 构建时间
time docker-compose build frontend

# 本地构建时间
time npm run build
```

### 分析构建瓶颈

```bash
# 查看详细构建信息
npm run build -- --debug

# 或使用 Vite 的详细输出
npm run build -- --logLevel info
```

---

## ✅ 总结

已应用的优化：
- ✅ Vite 配置优化（关闭 source map，使用 esbuild）
- ✅ Dockerfile 优化（使用缓存，跳过审计）
- ✅ npm 配置优化（禁用进度，使用缓存）

**预期效果**：
- 首次构建：3-7 分钟（之前 8-15 分钟）
- 使用缓存：1-3 分钟（之前 8-15 分钟）

如果还是慢，可以：
1. 使用国内镜像
2. 本地构建后复制
3. 使用 pnpm

