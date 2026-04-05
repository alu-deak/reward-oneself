# Docker 构建指南

## 项目介绍

本项目使用 Docker 容器化打包流程，确保在任何环境中都能一致地构建 Android 应用。

## Docker 镜像构建

### 构建 Docker 镜像

```bash
docker build -t reward-oneself-builder .
```

### 运行构建

```bash
docker run --name reward-oneself-build reward-oneself-builder
docker cp reward-oneself-build:/app/android/app/build/outputs/apk/debug/app-debug.apk .
docker rm reward-oneself-build
```

### 构建产物

构建完成后，APK 文件会被复制到当前目录：
- `app-debug.apk` - 调试版本的 Android 应用

## GitHub Actions 工作流

### 配置

1. **在 GitHub 仓库中设置 secrets**：
   - `DOCKERHUB_USERNAME` - Docker Hub 用户名
   - `DOCKERHUB_TOKEN` - Docker Hub 访问令牌

2. **触发构建**：
   - 推送代码到 `main` 分支
   - 创建新的 release

### 工作流步骤

1. 检出代码
2. 设置 Docker Buildx
3. 构建 Docker 镜像
4. 在 Docker 容器中运行构建
5. 测试构建产物
6. 上传 APK 作为 artifact
7. （仅在 release 时）登录 Docker Hub 并推送镜像
8. 清理临时文件

### 错误处理

工作流包含错误处理机制，在任何步骤失败时会提供清晰的错误报告。

## 依赖项

Docker 镜像包含以下依赖：
- Ubuntu 22.04
- Node.js 20.x
- OpenJDK 17
- Android SDK (API 34)
- Android Build Tools 34.0.0
- 所有项目 npm 依赖

## 构建流程

1. 同步 Capacitor 配置
2. 构建 Android 应用
3. 检查构建产物
4. 验证构建过程中是否有错误

## 常见问题

### 构建失败

- 检查网络连接是否正常
- 确保 Docker 有足够的内存和磁盘空间
- 检查 Android SDK 下载是否成功

### 镜像大小

Docker 镜像包含完整的 Android SDK，因此体积较大（约 2-3GB）。
