# 蓝绿部署使用指南

## 概述

蓝绿部署（Blue-Green Deployment）是一种零停机部署策略，允许你在生产环境中同时运行两个版本的服务，确认新版本无误后再切换流量。

## 脚本说明

### 1. `deploy-blue-green.sh` - 部署新版本
- **功能**：部署新版本到备用端口（Blue/Green）
- **用法**：`./deploy-blue-green.sh [分支名]`
- **示例**：`./deploy-blue-green.sh v1.5`
- **说明**：
  - 自动检测当前运行的是 Blue 还是 Green 环境
  - 将新版本部署到另一个环境
  - Blue 环境：端口 8000（后端）、3000（前端）
  - Green 环境：端口 8001（后端）、3001（前端）

### 2. `switch-to-green.sh` - 切换流量到 Green
- **功能**：将 Nginx 流量切换到 Green 环境
- **用法**：`./switch-to-green.sh`
- **说明**：更新 Nginx 配置，指向 Green 环境的容器

### 3. `switch-to-blue.sh` - 切换流量到 Blue
- **功能**：将 Nginx 流量切换回 Blue 环境
- **用法**：`./switch-to-blue.sh`
- **说明**：恢复 Nginx 配置，指向 Blue 环境（docker-compose 服务）

### 4. `rollback-to-blue.sh` - 回滚到 Blue
- **功能**：快速回滚到 Blue 环境
- **用法**：`./rollback-to-blue.sh`
- **说明**：切换流量 + 可选停止 Green 环境

### 5. `cleanup-old-version.sh` - 清理旧版本
- **功能**：清理不再使用的旧版本容器和镜像
- **用法**：`./cleanup-old-version.sh`
- **说明**：确认新版本运行正常后，释放资源

## 使用流程

### 第一次部署新版本

```bash
# 1. 部署新版本到 Green 环境
./deploy-blue-green.sh v1.5

# 2. 测试新版本（通过端口 8001 和 3001）
curl http://localhost:8001/api/v1/health
# 浏览器访问: http://your-server-ip:3001

# 3. 确认无误后，切换流量到 Green
./switch-to-green.sh

# 4. 测试生产环境（通过 Nginx，端口 80）
curl http://your-server-ip/api/v1/health

# 5. 确认一切正常后，清理旧版本
./cleanup-old-version.sh
```

### 再次部署新版本（此时 Green 是生产环境）

```bash
# 1. 部署新版本到 Blue 环境（自动检测）
./deploy-blue-green.sh main

# 2. 测试新版本（通过端口 8000 和 3000）
curl http://localhost:8000/api/v1/health

# 3. 切换流量到 Blue
./switch-to-blue.sh

# 4. 清理旧版本（Green）
./cleanup-old-version.sh
```

### 快速回滚

如果新版本有问题，可以快速回滚：

```bash
# 回滚到 Blue 环境
./rollback-to-blue.sh

# 或回滚到 Green 环境（需要手动切换）
./switch-to-green.sh
```

## 环境说明

### Blue 环境
- **后端端口**：8000
- **前端端口**：3000
- **容器名**：`npc-backend`, `npc-frontend`（docker-compose 管理）
- **网络**：通过 docker-compose 网络访问

### Green 环境
- **后端端口**：8001
- **前端端口**：3001
- **容器名**：`npc-backend-green`, `npc-frontend-green`
- **网络**：加入相同的 Docker 网络

## 注意事项

1. **数据库共享**：两个环境共享同一个 MySQL 数据库
2. **端口冲突**：确保端口 8000、8001、3000、3001 未被占用
3. **网络要求**：Green 环境容器需要加入与 Nginx 相同的 Docker 网络
4. **备份配置**：切换流量前会自动备份 Nginx 配置
5. **健康检查**：部署脚本会自动进行健康检查

## 故障排查

### 新版本无法启动
```bash
# 查看日志
docker logs npc-backend-green
docker logs npc-frontend-green
```

### Nginx 配置错误
```bash
# 测试配置
docker exec npc-nginx nginx -t

# 查看备份配置
ls -la nginx/conf.d/default.conf.backup.*
```

### 网络问题
```bash
# 检查容器网络
docker network inspect agent-track-npc-version_npc-network

# 检查容器是否在同一网络
docker inspect npc-backend-green | grep NetworkMode
docker inspect npc-nginx | grep NetworkMode
```

## 权限设置

首次使用前，需要添加执行权限：

```bash
chmod +x deploy-blue-green.sh
chmod +x switch-to-green.sh
chmod +x switch-to-blue.sh
chmod +x rollback-to-blue.sh
chmod +x cleanup-old-version.sh
```

## 与原有脚本的区别

- **`update-production.sh`**：直接更新当前运行的服务（滚动更新）
- **`deploy-blue-green.sh`**：部署新版本到备用环境，可以测试后再切换

建议：
- 重要更新：使用蓝绿部署
- 小更新：使用滚动更新

