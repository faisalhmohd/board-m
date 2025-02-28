import {pool} from "../../db";
import { Board } from "./types";

const getBoardDepthFromRoot = async (boardId: string): Promise<number> => {
  let depthFromRoot = 1;
  let maxDepthToDeepestChild = 1;
  let currentBoardId = boardId;

  // Calculate depth from root
  while (true) {
    const [rows] = await pool.query("SELECT parentBoardId FROM boards WHERE id = ?", [currentBoardId]);
    const boards = rows as { parentBoardId?: string }[];

    if (boards.length === 0 || !boards[0].parentBoardId) {
      break;
    }

    currentBoardId = boards[0].parentBoardId;
    depthFromRoot++;
  }

  return depthFromRoot + maxDepthToDeepestChild - 1;
};

const getAllChildBoards = async (parentBoardId: string): Promise<Board[]> => {
  const [rows] = await pool.query("SELECT * FROM boards WHERE parentBoardId = ?", [parentBoardId]);
  const childBoards = rows as Board[];
  for (const childBoard of childBoards) {
    const nestedChildBoards = await getAllChildBoards(childBoard.id);
    childBoards.push(...nestedChildBoards);
  }
  return childBoards;
};

const getBoardDepthToDeepestChild = async (boardId: string): Promise<number> => {
  let maxDepthToDeepestChild = 1;
  const [rows] = await pool.query("SELECT id FROM boards WHERE parentBoardId = ?", [boardId]);
  const childBoards = rows as { id: string }[];
  for (const childBoard of childBoards) {
    const depthToDeepestChild = await getBoardDepthToDeepestChild(childBoard.id);
    maxDepthToDeepestChild = Math.max(maxDepthToDeepestChild, depthToDeepestChild + 1);
  }
  return maxDepthToDeepestChild;
};

const getBoardDepth = async (boardId: string): Promise<number> => {
  const depthFromRoot = await getBoardDepthFromRoot(boardId);
  const depthToDeepestChild = await getBoardDepthToDeepestChild(boardId);
  return depthFromRoot + depthToDeepestChild - 1;
};

export { getBoardDepth, getAllChildBoards, getBoardDepthFromRoot, getBoardDepthToDeepestChild };