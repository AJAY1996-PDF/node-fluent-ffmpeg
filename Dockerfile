# 帶有 ffmpeg 的基底映像
FROM jrottenberg/ffmpeg:6.1-ubuntu as ffmpeg

# Node.js 執行環境
FROM node:20-bullseye
COPY --from=ffmpeg /usr/local /usr/local
ENV PATH="/usr/local/bin:${PATH}"

WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .

EXPOSE 8080
CMD ["node", "server.js"]
