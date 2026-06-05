#!/bin/sh

echo "Seeding articles..."
SEED_JSON=/app/seed-data/articles.json SEED_HTML_DIR=/app/seed-data/articles /app/seed || echo "Seed skipped (no data or already seeded)"

echo "Starting server..."
exec /app/blog-server
