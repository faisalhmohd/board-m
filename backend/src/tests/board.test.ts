import request from 'supertest';
import app from '../index'; // Adjust the path to your Express app
import { Board } from '../services/board/types';

describe('Board API', () => {
  it('should create a new board', async () => {
    const response = await request(app)
      .post('/api/boards')
      .send({
        name: 'Test Board',
        description: 'This is a test board',
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('Test Board');
    expect(response.body.description).toBe('This is a test board');
  });

  it('should get all boards', async () => {
    const mockBoards = [
      {
        name: 'Test Board 1',
        description: 'This is a test board 1',
      },
      {
        name: 'Test Board 2',
        description: 'This is a test board 2',
      },
      {
        name: 'Test Board 3',
        description: 'This is a test board 2',
      },
      {
        name: 'Test Board 4',
        description: 'This is a test board 2',
      },
    ];

    const mockSubBoards = [
      {
        name: 'Test Sub Board 1',
        description: 'This is a test sub board 1',
        parentBoard: 0,
      },
      {
        name: 'Test Sub Board 2',
        description: 'This is a test sub board 2',
        parentBoard: 0
      },
      {
        name: 'Test Sub Board 3',
        description: 'This is a test sub board 3',
        parentBoard: 1
      },
      {
        name: 'Test Sub Board 4',
        description: 'This is a test sub board 4',
        parentBoard: 2
      },
    ];

    const createdBoards = await Promise.all(
      mockBoards.map((board) =>
        request(app)
          .post('/api/boards')
          .send(board)
          .then((response) => response.body)
      )
    );

    const createdSubBoards = await Promise.all(
      mockSubBoards.map((board) => {
        const parentBoardId = createdBoards[board.parentBoard].id;

        return request(app)
          .post('/api/boards')
          .send({ ...board, parentBoardId })
          .then((response) => response.body);
      })
    );

    const response = await request(app)
      .get('/api/boards')
      .expect(200);

    expect(response.body).toHaveLength(4);

    response.body.forEach((board: Board) => {
      const matchingBoardIndex = createdBoards.findIndex((createdBoard) => createdBoard.id === board.id);

      expect(board).toHaveProperty('id');
      expect(board.name).toBe(mockBoards[matchingBoardIndex].name);
      expect(board.description).toBe(mockBoards[matchingBoardIndex].description);
    });

    const subBoardResponse = await request(app)
      .get('/api/boards')
      .query({ parentBoardId: createdBoards[0].id })
      .expect(200);

    expect(subBoardResponse.body).toHaveLength(2);

    subBoardResponse.body.forEach((board: Board) => {
      const matchingBoardIndex = createdSubBoards.findIndex((createdBoard) => createdBoard.id === board.id);

      expect(board).toHaveProperty('id');
      expect(board.name).toBe(mockSubBoards[matchingBoardIndex].name);
      expect(board.description).toBe(mockSubBoards[matchingBoardIndex].description);
    });

    const emptySubBoardResponse = await request(app)
      .get('/api/boards')
      .query({ parentBoardId: createdBoards[3].id })
      .expect(200);

    expect(emptySubBoardResponse.body).toHaveLength(0);

  });

  it('should get a single board by ID', async () => {
    const createdBoardId = await request(app)
      .post('/api/boards')
      .send({
        name: 'Test Board',
        description: 'This is a test board',
      })
      .then((response) => response.body.id
    );

    const response = await request(app)
      .get(`/api/boards/${createdBoardId}`)
      .expect(200);

    expect(response.body).toHaveProperty('id', createdBoardId);
    expect(response.body.name).toBe('Test Board');
    expect(response.body.description).toBe('This is a test board');
  });

  it('should update a board by ID', async () => {
    const createdBoardId = await request(app)
      .post('/api/boards')
      .send({
        name: 'Test Board',
        description: 'This is a test board',
      })
      .then((response) => response.body.id);

    const response = await request(app)
      .put(`/api/boards/${createdBoardId}`)
      .send({
        name: 'Updated Test Board',
        description: 'This is an updated test board',
      })
      .expect(200);

    expect(response.body).toHaveProperty('id', createdBoardId);
    expect(response.body.name).toBe('Updated Test Board');
    expect(response.body.description).toBe('This is an updated test board');
  });

  it('should move a board to a new parent board', async () => {
    const createdBoardId = await request(app)
      .post('/api/boards')
      .send({
        name: 'Test Board',
        description: 'This is a test board',
      })
      .then((response) => response.body.id
    );

    const newParentBoardResponse = await request(app)
      .post('/api/boards')
      .send({
        name: 'New Parent Board',
        description: 'This is a new parent board',
      })
      .expect(201);

    const newParentBoardId = newParentBoardResponse.body.id;

    await request(app)
      .put(`/api/boards/${createdBoardId}/move`)
      .send({ parentBoardId: newParentBoardId })
      .expect(204);

    const movedBoardResponse = await request(app)
      .get(`/api/boards/${createdBoardId}`)
      .expect(200);

    expect(movedBoardResponse.body.parentBoardId).toBe(newParentBoardId);
  });

  it('should delete a board by ID', async () => {
    const createdBoardId = await request(app)
      .post('/api/boards')
      .send({
        name: 'Test Board',
        description: 'This is a test board',
      })
      .then((response) => response.body.id);

    await request(app)
      .delete(`/api/boards/${createdBoardId}`)
      .expect(204);

    await request(app)
      .get(`/api/boards/${createdBoardId}`)
      .expect(404);
  });

  it.only('should check if create board exceeds maximum depth', async () => {
    const mockBoards = [
      {
        name: 'Test Board 1',
        description: 'This is a test board 1',
      },
    ];

    const mockSubBoards = [
      {
        name: 'Test Sub Board 1',
        description: 'This is a test sub board 1',
        parentBoard: 0,
      },
      {
        name: 'Test Sub Board 2',
        description: 'This is a test sub board 2',
        parentBoard: 0
      },
      {
        name: 'Test Sub Board 3',
        description: 'This is a test sub board 3',
        parentBoard: 0
      },
      {
        name: 'Test Sub Board 4',
        description: 'This is a test sub board 4',
        parentBoard: 0
      },
      {
        name: 'Test Sub Board 5',
        description: 'This is a test sub board 4',
        parentBoard: 0
      },
      {
        name: 'Test Sub Board 6',
        description: 'This is a test sub board 4',
        parentBoard: 0
      },
      {
        name: 'Test Sub Board 7',
        description: 'This is a test sub board 4',
        parentBoard: 0
      },
      {
        name: 'Test Sub Board 8',
        description: 'This is a test sub board 4',
        parentBoard: 0
      },
      {
        name: 'Test Sub Board 9',
        description: 'This is a test sub board 4',
        parentBoard: 0
      },
      {
        name: 'Test Sub Board 10',
        description: 'This is a test sub board 4',
        parentBoard: 0
      },
      {
        name: 'Test Sub Board 11',
        description: 'This is a test sub board 4',
        parentBoard: 0
      },
    ];

    const createdBoards = await Promise.all(
      mockBoards.map((board) =>
        request(app)
          .post('/api/boards')
          .send(board)
          .then((response) => response.body)
      )
    );

    let parentBoardId = createdBoards[0].id;

    const createdSubBoards = [];
    for (const board of mockSubBoards) {
      if (createdSubBoards.length >= 9) {
        await request(app)
          .post('/api/boards')
          .send({ ...board, parentBoardId })
          .expect(400);
      } else {
        const createdSubBoard = await request(app)
        .post('/api/boards')
        .send({ ...board, parentBoardId })
        .then((response) => response.body);


      expect(createdSubBoard).toHaveProperty('id');
      expect(createdSubBoard.name).toBe(board.name);

      parentBoardId = createdSubBoard.id as string;
      createdSubBoards.push(createdSubBoard);
      }
    }
  });
});