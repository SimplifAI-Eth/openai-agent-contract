# Install dependencies only when needed
FROM node:18-alpine AS build
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json ./

RUN npm install

COPY . .

# Copy .env.example to .env
RUN cp .env.example .env

# Build the project
RUN npm run build

# Run tests
RUN npm run test

# Publish agent
RUN npm run publish-agent

# Set secrets
RUN npm run set-secrets