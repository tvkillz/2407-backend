FROM node:20-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./

RUN npm install && \
    npm cache clean --force && \
    chown -R node:node .

ENV WATCHPACK_POLLING=true
ENV CHOKIDAR_USEPOLLING=true

USER node

EXPOSE 3000

CMD ["npm", "run", "dev"]
