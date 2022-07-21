# ====================== BUILD STAGE ======================
FROM node:alpine as builder
WORKDIR /build

# Environment variables
ENV NODE_ENV development
ENV DOCKER true

# Copy in build config files and install dependencies
COPY tsconfig.json tsconfig.build.json package.json package-lock.json ./
RUN npm install

COPY src src

# Build application
RUN npm run build

# ====================== APP STAGE ======================
FROM node:alpine as app
WORKDIR /app

# Environment variables
ARG NODE_ENV=production
ENV NODE_ENV $NODE_ENV

# Copy static artifacts


# Copy dependencies from previous stage
COPY --from=builder --chown=node:node build/node_modules node_modules
COPY --from=builder --chown=node:node build/package.json build/package-lock.json ./
COPY --from=builder --chown=node:node build/tsconfig.json tsconfig.json
COPY --from=builder --chown=node:node build/tsconfig.build.json tsconfig.build.json

# Copy build artifacts from previous stage
COPY --from=builder --chown=node:node build/dist ./dist/

# ====================== DEV STAGE ======================
FROM app AS dev
WORKDIR /app

ENV NODE_ENV development

EXPOSE 9229

ENTRYPOINT ["npm", "run", "start:debug"]

# ====================== FINAL STAGE ======================
FROM app
RUN npm prune --production

COPY --from=app --chown=node:node app/tsconfig.json tsconfig.json
COPY --from=app --chown=node:node app/tsconfig.build.json tsconfig.build.json

ENTRYPOINT ["npm", "run", "start"]