# ============================================
# NPC Frontend Dockerfile
# ============================================
# 说明：用于构建前端应用的 Docker 镜像（多阶段构建）
# 最后更新：2025-11-22

# ==================== 阶段 1：构建阶段 ====================
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装所有依赖（包括 devDependencies，构建需要）
# 使用 npm install 而不是 npm ci，因为 npm ci 要求 package-lock.json 完全匹配
RUN npm install

# 复制源代码
COPY . .

# 构建参数：API 基础 URL（默认值，可在构建时覆盖）
# 使用 /api 作为相对路径，通过 Nginx 代理
ARG VITE_API_BASE_URL=/api
ARG VITE_API_MODE=http

# 设置环境变量（用于构建时）
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_API_MODE=$VITE_API_MODE

# 构建应用（生成 dist 目录）
RUN npm run build

# ==================== 阶段 2：生产阶段 ====================
FROM nginx:alpine

# 复制构建产物到 Nginx 静态文件目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置文件（支持 SPA 路由）
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]

