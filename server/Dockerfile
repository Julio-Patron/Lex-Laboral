# Use Node.js 18 slim image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files from the current directory (server/)
COPY package*.json ./

# Install production dependencies
RUN npm install --only=production

# Copy server source code
COPY . .

# Expose the port (Cloud Run sets PORT env var)
EXPOSE 8080

# Start the server
CMD ["node", "index.js"]
