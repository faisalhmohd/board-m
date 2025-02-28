import { randomUUID } from "crypto";
import { pool } from "../../db";
import { Board } from "./types";
import { getAllChildBoards, getBoardDepth, getBoardDepthFromRoot, getBoardDepthToDeepestChild } from "./utils";
import { MAX_DEPTH } from "./constants";

export const createBoard = async (name: string, description: string, parentBoardId?: string): Promise<Board> => {
  if (parentBoardId) {
    const depth = await getBoardDepthFromRoot(parentBoardId);
    if (depth >= MAX_DEPTH) {
      throw new Error(`Cannot create board. Maximum depth of ${MAX_DEPTH} levels exceeded.`);
    }
  }

  const id = randomUUID();
  await pool.query(
    "INSERT INTO boards (id, name, description, parentBoardId) VALUES (?, ?, ?, ?)",
    [id, name, description, parentBoardId]
  );
  return { id, name, description, parentBoardId };
};

export const getAllBoards = async (limit: number, offset: number, parentBoardId?: string): Promise<Board[]> => {
  let query = "SELECT * FROM boards";
  const params: (number | string)[] = [limit, offset];

  if (parentBoardId) {
    query += " WHERE parentBoardId = ?";
    params.unshift(parentBoardId);
  } else {
    query += " WHERE parentBoardId IS NULL";
  }

  query += " LIMIT ? OFFSET ?";

  const [rows] = await pool.query(query, params);
  return rows as Board[];
};

export const getBoardById = async (id: string): Promise<Board | undefined> => {
  const [rows] = await pool.query("SELECT * FROM boards WHERE id = ?", [id]);
  const boards = rows as Board[];
  return boards[0];
};

export const updateBoard = async (id: string, name: string, description: string, parentBoardId?: string): Promise<Board | undefined> => {
  await pool.query(
    "UPDATE boards SET name = ?, description = ?, parentBoardId = ? WHERE id = ?",
    [name, description, parentBoardId, id]
  );
  return getBoardById(id);
};

export const deleteBoard = async (id: string): Promise<void> => {
  const childBoards = await getAllChildBoards(id);
  const boardIdsToDelete = childBoards.map(board => board.id);
  boardIdsToDelete.push(id);

  await pool.query("DELETE FROM boards WHERE id IN (?)", [boardIdsToDelete]);
};

export const moveBoard = async (boardId: string, newParentBoardId?: string): Promise<void> => {
  const board = await getBoardById(boardId);
  if (!board) {
    throw new Error("Board not found");
  }

  const boardDepth = await getBoardDepthToDeepestChild(boardId);
  const newParentDepth = newParentBoardId ? await getBoardDepthFromRoot(newParentBoardId) : 0;

  if (newParentDepth + boardDepth > MAX_DEPTH) {
    throw new Error(`Cannot move board. Maximum depth of ${MAX_DEPTH} levels exceeded.`);
  }

  await pool.query(
    "UPDATE boards SET parentBoardId = ? WHERE id = ?",
    [newParentBoardId, boardId]
  );
};