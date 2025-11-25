# Git 认证问题解决方案

## 🔐 问题描述

在云服务器上遇到以下问题：
1. **GitHub 认证失败**：`fatal: Authentication failed`
2. **分支分歧**：`fatal: Need to specify how to reconcile divergent branches`
3. **无法推送代码**：只能被动拉取，无法主动推送

---

## ✅ 解决方案

### 方案一：使用 SSH 密钥（推荐）⭐

**优点：**
- ✅ 安全，不需要密码
- ✅ 一次配置，永久使用
- ✅ 支持推送和拉取

**步骤：**

1. **在云服务器生成 SSH 密钥**
```bash
# 生成 SSH 密钥（如果还没有）
ssh-keygen -t ed25519 -C "your_email@example.com"

# 按回车使用默认路径
# 可以设置密码（可选，推荐设置）

# 查看公钥
cat ~/.ssh/id_ed25519.pub
```

2. **将公钥添加到 GitHub**
   - 复制公钥内容（`cat ~/.ssh/id_ed25519.pub` 的输出）
   - 登录 GitHub → Settings → SSH and GPG keys → New SSH key
   - 粘贴公钥，保存

3. **修改 Git 远程地址为 SSH**
```bash
cd ~/agent-track-npc-version

# 查看当前远程地址
git remote -v

# 如果使用的是 HTTPS，改为 SSH
git remote set-url origin git@github.com:Kaine665/agent-track-npc-version.git

# 验证
git remote -v
```

4. **测试连接**
```bash
ssh -T git@github.com
# 应该看到：Hi Kaine665! You've successfully authenticated...
```

5. **解决分支分歧问题**
```bash
# 查看当前状态
git status

# 设置默认合并策略（推荐使用 merge）
git config pull.rebase false

# 或者使用 rebase（保持历史线性）
git config pull.rebase true

# 拉取代码
git pull origin main
```

---

### 方案二：使用 Personal Access Token（PAT）

**适用场景：**
- 不想使用 SSH
- 需要临时访问权限

**步骤：**

1. **在 GitHub 创建 Personal Access Token**
   - GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token (classic)
   - 选择权限：`repo`（完整仓库访问权限）
   - 复制生成的 token（只显示一次，务必保存）

2. **使用 Token 作为密码**
```bash
# 拉取代码时，用户名输入你的 GitHub 用户名，密码输入 Token
git pull origin main
# Username: Kaine665
# Password: <粘贴你的 token>
```

3. **配置 Git 记住凭据（可选）**
```bash
# 使用 Git Credential Helper
git config --global credential.helper store

# 下次输入用户名和 token 后会自动保存
```

---

### 方案三：使用 GitHub CLI（gh）

**步骤：**

1. **安装 GitHub CLI**
```bash
# Ubuntu/Debian
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# 登录
gh auth login
```

2. **使用 gh 管理仓库**
```bash
# 拉取代码
gh repo sync Kaine665/agent-track-npc-version
```

---

## 🔧 解决分支分歧问题

### 方法一：合并（Merge）- 推荐

```bash
# 设置默认策略
git config pull.rebase false

# 拉取并合并
git pull origin main
```

### 方法二：变基（Rebase）- 保持历史线性

```bash
# 设置默认策略
git config pull.rebase true

# 拉取并变基
git pull origin main
```

### 方法三：仅快进（Fast-forward only）- 最安全

```bash
# 设置默认策略
git config pull.ff only

# 拉取（如果有分歧会失败，需要手动处理）
git pull origin main
```

---

## 📝 完整操作流程（推荐：SSH 方式）

### 在云服务器上执行：

```bash
# 1. 生成 SSH 密钥（如果还没有）
ssh-keygen -t ed25519 -C "your_email@example.com"
# 按回车使用默认路径
# 可以设置密码保护（推荐）

# 2. 查看公钥
cat ~/.ssh/id_ed25519.pub
# 复制输出的内容

# 3. 将公钥添加到 GitHub（在本地电脑操作）
# - 登录 GitHub → Settings → SSH and GPG keys → New SSH key
# - 粘贴公钥，保存

# 4. 测试 SSH 连接
ssh -T git@github.com
# 应该看到：Hi Kaine665! You've successfully authenticated...

# 5. 修改 Git 远程地址为 SSH
cd ~/agent-track-npc-version
git remote set-url origin git@github.com:Kaine665/agent-track-npc-version.git

# 6. 设置 Git 配置
git config pull.rebase false  # 使用 merge 策略
git config user.name "Kaine665"  # 设置用户名
git config user.email "your_email@example.com"  # 设置邮箱

# 7. 拉取代码
git pull origin main

# 8. 测试推送（创建一个测试提交）
echo "# Test" >> README.md
git add README.md
git commit -m "Test commit"
git push origin main
```

---

## 🚨 常见问题

### Q: SSH 连接失败怎么办？

```bash
# 检查 SSH 配置
cat ~/.ssh/config

# 如果没有配置，创建配置
cat >> ~/.ssh/config << EOF
Host github.com
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
EOF

# 测试连接
ssh -T git@github.com
```

### Q: 分支分歧怎么处理？

```bash
# 查看分歧情况
git log --oneline --graph --all

# 方法1：合并（保留所有历史）
git config pull.rebase false
git pull origin main

# 方法2：变基（线性历史）
git config pull.rebase true
git pull origin main

# 方法3：强制使用远程版本（⚠️ 会丢失本地更改）
git fetch origin
git reset --hard origin/main
```

### Q: 忘记 GitHub 密码怎么办？

- 使用 SSH 密钥（推荐，不需要密码）
- 使用 Personal Access Token（替代密码）
- 重置 GitHub 密码

---

## 💡 推荐配置

**最佳实践：**
1. ✅ 使用 SSH 密钥（最安全、最方便）
2. ✅ 设置 `git config pull.rebase false`（使用 merge）
3. ✅ 配置用户名和邮箱
4. ✅ 定期备份重要代码

**快速配置脚本：**

```bash
#!/bin/bash
# 一键配置 Git SSH

# 1. 生成 SSH 密钥
if [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "生成 SSH 密钥..."
    ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_ed25519 -N ""
fi

# 2. 显示公钥
echo "=========================================="
echo "请将以下公钥添加到 GitHub："
echo "=========================================="
cat ~/.ssh/id_ed25519.pub
echo "=========================================="
echo ""
read -p "按回车继续（确保已添加公钥到 GitHub）..."

# 3. 测试连接
echo "测试 SSH 连接..."
ssh -T git@github.com

# 4. 修改远程地址
cd ~/agent-track-npc-version
git remote set-url origin git@github.com:Kaine665/agent-track-npc-version.git

# 5. 配置 Git
git config pull.rebase false
git config user.name "Kaine665"
git config user.email "your_email@example.com"

echo "✅ 配置完成！"
```

---

## 📚 相关资源

- [GitHub SSH 密钥设置指南](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [GitHub Personal Access Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Git 分支合并策略](https://git-scm.com/book/zh/v2/Git-%E5%88%86%E6%94%AF-%E5%88%86%E6%94%AF%E7%9A%84%E6%96%B0%E5%BB%BA%E4%B8%8E%E5%90%88%E5%B9%B6)

