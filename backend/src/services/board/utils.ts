import {pool} from "../../db";
import { Board } from "./types";

const getBoardDepth = async (boardId: string): Promise<number> => {
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

export { getBoardDepth, getAllChildBoards };