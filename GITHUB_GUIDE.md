# 上传到 GitHub 并开启 GitHub Pages 指南

## 方案一：一键脚本（推荐，Windows）

在项目目录下打开 PowerShell，运行：

```powershell
.\upload-to-github.ps1
```

脚本会自动：
1. 下载并安装 GitHub CLI
2. 引导你登录 GitHub（浏览器弹窗）
3. 创建公开仓库
4. 推送代码
5. 开启 GitHub Pages

## 方案二：手动上传

### 步骤 1：在 GitHub 创建仓库

1. 打开 https://github.com/new
2. 仓库名填：`linear-algebra-viz`
3. 选择 **Public**（公开）
4. 不要勾选 "Add a README file"
5. 点击 **Create repository**

### 步骤 2：推送本地代码

在项目目录（`linear-algebra-viz` 文件夹）打开终端，执行：

```bash
# 配置 git（如未配置）
git config user.name "你的名字"
git config user.email "你的邮箱"

# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/linear-algebra-viz.git

# 推送到 GitHub
git branch -M main
git push -u origin main
```

### 步骤 3：开启 GitHub Pages

1. 打开仓库页面：`https://github.com/YOUR_USERNAME/linear-algebra-viz`
2. 点击 **Settings**（设置）标签
3. 左侧菜单点击 **Pages**
4. **Source** 选择 **Deploy from a branch**
5. **Branch** 选择 `main`，文件夹选 `/(root)`
6. 点击 **Save**

### 步骤 4：访问你的网站

等待 1-5 分钟后，访问：

```
https://YOUR_USERNAME.github.io/linear-algebra-viz/
```

---

## 常见问题

**Q: 推送时提示需要用户名密码？**
A: GitHub 已不再支持密码验证。请使用 Personal Access Token：
   - 打开 https://github.com/settings/tokens
   - 点击 **Generate new token (classic)**
   - 勾选 `repo` 权限
   - 生成后复制 token，在密码提示时粘贴 token 代替密码

**Q: Pages 显示 404？**
A: 首次部署可能需要几分钟。确认仓库是 Public，且 Pages 设置中的分支正确。

**Q: 如何更新网站？**
A: 修改代码后执行：
```bash
git add -A
git commit -m "update"
git push
```
GitHub Pages 会自动重新部署。
