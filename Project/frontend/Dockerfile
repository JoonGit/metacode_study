FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# Build the Next.js app
ARG BACKEND_URL
ENV BACKEND_URL=${BACKEND_URL:-http://backend-java:8080}
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
