# Use official Node.js image
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port (default for your api is 4000)
EXPOSE 4000
EXPOSE 3001

# Default command (overridden by docker-compose)
CMD ["npm", "run", "dev"]
