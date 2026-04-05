#!/bin/bash

set -e

echo "=== 开始构建项目 ==="

# 同步Capacitor配置
echo "同步Capacitor配置..."
npx cap sync

# 构建Android应用
echo "构建Android应用..."
cd android && ./gradlew assembleDebug

# 检查构建产物
echo "检查构建产物..."
if [ -f "./app/build/outputs/apk/debug/app-debug.apk" ]; then
    echo "构建成功！APK文件已生成：./app/build/outputs/apk/debug/app-debug.apk"
    echo "APK文件大小：$(du -h ./app/build/outputs/apk/debug/app-debug.apk)"
else
    echo "构建失败：APK文件未生成"
    exit 1
fi

# 验证构建过程中是否有错误
if grep -q "ERROR" ./app/build/outputs/logs/build_output.txt 2>/dev/null; then
    echo "构建过程中出现错误，请检查日志"
    exit 1
fi

echo "=== 构建完成 ==="
