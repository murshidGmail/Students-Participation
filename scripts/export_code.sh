#!/bin/bash

mkdir -p code_export

# Export backend files
echo "Exporting backend files..."
mkdir -p code_export/backend
cp /app/backend/server.py code_export/backend/
cp /app/backend/.env code_export/backend/
cp /app/backend/requirements.txt code_export/backend/

# Export frontend files
echo "Exporting frontend files..."
mkdir -p code_export/frontend/src
cp /app/frontend/package.json code_export/frontend/
cp /app/frontend/.env code_export/frontend/
cp /app/frontend/src/App.js code_export/frontend/src/
cp /app/frontend/src/App.css code_export/frontend/src/
cp /app/frontend/src/index.js code_export/frontend/src/
cp /app/frontend/src/index.css code_export/frontend/src/

# Create a README.md file
cat > code_export/README.md << 'EOL'
# Student Participation Assessment Web App

## Overview
A web application for teachers to track and assess student participation in class. Teachers can create classes, add students, and track their participation with a randomized assessment system.

## Features
- Teacher authentication (register/login)
- Class management
- Student management (manual entry or file upload)
- Randomized student selection for fair participation
- Assessment tracking (Correct/Wrong/Pass)
- Statistics and reporting

## Backend Setup
1. Install dependencies: `pip install -r requirements.txt`
2. Run the server: `uvicorn server:app --reload`

## Frontend Setup
1. Install dependencies: `npm install` or `yarn`
2. Run the development server: `npm start` or `yarn start`

## Environment Variables
- Backend needs MongoDB URL in .env
- Frontend needs backend URL in .env
EOL

echo "Code export complete! Files are in the code_export directory."