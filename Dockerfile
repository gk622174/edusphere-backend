# Base image
FROM node:18-alpine

# Create app directory
WORKDIR /app

# Copy package files first for layer caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app
COPY . .

# Expose port (same as your Express app)
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
