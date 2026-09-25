FROM node:20-slim

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy full source
COPY . .

# Build production frontend (Vite -> dist/)
RUN npm run build

# Expose port (default 5000 or process.env.PORT)
EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

# Start unified production server (serves Express API and built React frontend)
CMD ["npm", "start"]
