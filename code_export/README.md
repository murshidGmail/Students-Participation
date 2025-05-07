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
