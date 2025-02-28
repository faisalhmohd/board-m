# Board Management

This is a basic board management system that allows users to create, read, move, and delete boards

![Demo](https://github.com/faisalhmohd/board-m/blob/main/recording.gif?raw=true)

## Overview

This application uses the provided boilerplate but has been modified to include the following features:
- MySQL database to store board data
- CRUD and additional endpoints for board management
- Frontend UI to interact with the board
- Jest and Supertest for backend testing
- Jest and React Testing Library for frontend testing
- Docker Compose for development and deployment
- Make file for development commands

The above features were implemented with the following decisions:
- MySQL was chosen as the database because it is a popular relational database that is easy to use and has good performance. Provides type safety, allows cascading deletes, and has good support for transactions
- Boards have a parentBoardId field to allow for a hierarchical structure. This field is nullable to allow for top-level boards.
- Boards can have a limit of 10 levels as instructed.

A lot of improvements could've been made, but due to time constraints, had to be limited. Here are some of the improvements that could've been made:
- More tests could've been written to cover more edge cases
- MySQL transactions could've been used to ensure data integrity and consistency
- To avoid race conditions and deadlocks, a lock could've been used to prevent multiple users from updating the same board at the same time
- Error handling could've been improved to provide more detailed error messages
- More validation could've been added to ensure data integrity
- Caching could've been used to improve performance and reduce the number of database queries

## Features
- Create a board
- List boards
- View Hierarchical board
- Move board
- Delete board

## Running the Application

You can run both the frontend and backend services using Docker Compose:

```bash
docker-compose up --build
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend: http://localhost:3001

## Development

### Development with Docker

```bash
# Start the development environment
make up

# Stop the development environment
make down

# More instructions
make help
```

The development environment includes:

- Hot reloading for both frontend and backend
- Volume mounts for real-time code changes
- Development-specific configurations
- Isolated node_modules for each service

**Note about Package Management:** When adding new packages to either frontend or backend, you'll need to rebuild the Docker containers:

```bash
# 1. Stop the containers
make down

# 2. Rebuild and start the containers
make up --build
```
