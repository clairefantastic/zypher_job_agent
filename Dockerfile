FROM denoland/deno:1.40.0

WORKDIR /app

# Copy dependency files
COPY deno.json .
COPY package.json .

# Cache dependencies
RUN deno cache --reload viewer/server.ts

# Copy application
COPY . .

# Expose port
EXPOSE 3000

# Run server
CMD ["deno", "run", "-A", "--env", "viewer/server.ts"]