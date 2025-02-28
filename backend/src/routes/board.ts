import { Router, Request, Response } from "express";
import {
  createBoard,
  getAllBoards,
  getBoardById,
  updateBoard,
  moveBoard,
  deleteBoard,
} from "../services/board";
import { baseBoardSchema } from "../services/board/types";
import { MAX_LIMIT } from "../services/board/constants";

const router = Router();

// Create a new board
router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, description, parentBoardId } = baseBoardSchema.parse(req.body);
    const newBoard = await createBoard(name, description, parentBoardId);
    res.status(201).json(newBoard);
  } catch (e: unknown) {
    if (e instanceof Error) {
      res.status(400).json({ error: e.message });
    } else {
      res.status(400).json({ error: "Unknown error" });
    }
  }
});

// Get all boards
router.get("/", async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
  const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;
  const parentBoardId = req.query.parentBoardId as string | undefined;

  if (isNaN(limit) || isNaN(offset) || limit < 0 || offset < 0) {
    res.status(400).json({ error: "Invalid query parameters" });
    return;
  }

  if (limit > MAX_LIMIT) {
    res.status(400).json({ error: `Limit cannot be greater than ${MAX_LIMIT}` });
    return;
  }

  const boards = await getAllBoards(limit, offset, parentBoardId);
  res.json(boards);
});

// Get a single board by ID
router.get("/:id", async (req: Request, res: Response) => {
  const board = await getBoardById(req.params.id);
  if (board) {
    res.json(board);
  } else {
    res.status(404).json({ message: "Board not found" });
  }
});

// Update a board by ID
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { name, description, parentBoardId } = baseBoardSchema.parse(req.body);
    const board = await updateBoard(req.params.id, name, description, parentBoardId);
    if (board) {
      res.json(board);
    } else {
      res.status(404).json({ message: "Board not found" });
    }
  } catch (e) {
    if (e instanceof Error) {
      res.status(400).json({ error: e.message });
    } else {
      res.status(400).json({ error: "Unknown error" });
    }
  }
});

// Move a board to a new parent board
router.put("/:id/move", async (req: Request, res: Response) => {
  const { parentBoardId } = req.body;
  try {
    await moveBoard(req.params.id, parentBoardId);
    res.status(204).send();
  } catch (e) {
    if (e instanceof Error) {
      res.status(400).json({ error: e.message });
    } else {
      res.status(400).json({ error: "Unknown error" });
    }
  }
});

// Delete a board by ID
router.delete("/:id", async (req: Request, res: Response) => {
  await deleteBoard(req.params.id);
  res.status(204).send();
});

export default router;