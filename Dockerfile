FROM node:20-alpine

# 设置国内镜像源
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

# 安装基本依赖
RUN apk add --no-cache \
    git \
    python3 \
    make \
    g++

# 创建工作目录
WORKDIR /app

# 复制项目文件
COPY . .

# 设置npm国内镜像源
RUN npm config set registry https://registry.npmmirror.com

# 安装项目依赖
RUN npm install

# 构建脚本
RUN chmod +x build.sh && ls -la

# 构建命令
CMD ["sh", "-c", "ls -la && ./build.sh"]