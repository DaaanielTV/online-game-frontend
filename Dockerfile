FROM node:18-alpine

WORKDIR /app

ENV TERM xterm

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]