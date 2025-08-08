# Attendance System Backend

A Dockerized PHP backend for an attendance tracking system.

## Features

- Mark attendance with UserID, ClassID, and Timestamp
- Delete old attendance records
- Get attendance records by UserID and ClassID
- Get all attendance records for a ClassID

## API Endpoints

- `POST /`: Mark attendance
    - Requires JSON body with `user_id` and `class_id`
    - curl -X POST -H "Content-Type: application/json" -d '{"user_id":"user1","class_id":"class1"}' http://localhost:8000

- `DELETE /?days=30`: Delete records older than specified days (default: 30)
    - curl -X DELETE "http://localhost:8000?days=60"
  
- `GET /?user_id=USERID&class_id=CLASSID`: Get attendance for specific user in class
    - curl "http://localhost:8000?user_id=user1&class_id=class1"
    
- `GET /?class_id=CLASSID`: Get all attendance for a class
    - curl "http://localhost:8000?class_id=class1"




## Setup

1. Clone this repository
2. Run `docker-compose up -d`
3. The API will be available at `http://localhost:8000`

## Environment Variables

You can customize these in `docker-compose.yml`:

- `DB_HOST`: Database host (default: db)
- `DB_NAME`: Database name (default: attendance)
- `DB_USER`: Database user (default: root)
- `DB_PASSWORD`: Database password (default: secret)