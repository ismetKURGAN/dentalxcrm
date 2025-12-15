FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# ENV dosyasını build-time'da içeri al
ARG CRM_URL
ARG CRM_API_KEY
ARG CRM_ENTITY

ENV CRM_URL=$CRM_URL
ENV CRM_API_KEY=$CRM_API_KEY
ENV CRM_ENTITY=$CRM_ENTITY
EXPOSE 3000

# Development mode
CMD ["npm", "run", "dev"]

