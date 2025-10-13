-- Auto-generated SQL to update diagrams
-- Run with: PGPASSWORD=postgres psql -U postgres -h localhost -d ayansh_math_prep -f update-diagrams.sql

-- Update 2A (2022)
UPDATE questions SET
  "hasImage" = true,
  "imageUrl" = '/images/questions/moems-2022-2A.png'
WHERE "examName" = 'MOEMS Division E'
  AND "examYear" = '2022'
  AND "questionNumber" = '2A';

-- Update 2D (2022)
UPDATE questions SET
  "hasImage" = true,
  "imageUrl" = '/images/questions/moems-2022-2D.png'
WHERE "examName" = 'MOEMS Division E'
  AND "examYear" = '2022'
  AND "questionNumber" = '2D';

