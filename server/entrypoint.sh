#!/bin/sh

echo "Seeding articles..."
DB_PATH=${DB_PATH:-/app/data/blog.db} SEED_JSON=/app/seed-data/articles.json SEED_HTML_DIR=/app/seed-data/articles /app/seed && echo "Seed completed" || echo "Warning: seed exited with code $?"

echo "Starting server..."
exec /app/blog-server
