import {pool} from "../../db";

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

export { getBoardDepth, getBoardDepthFromRoot, getBoardDepthToDeepestChild };