import {pool} from "../../db";

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

  // Calculate depth to deepest child
  const calculateDepthToDeepestChild = async (id: string, currentDepth: number) => {
    const [rows] = await pool.query("SELECT id FROM boards WHERE parentBoardId = ?", [id]);
    const childBoards = rows as { id: string }[];

    if (childBoards.length > 0) {
      currentDepth++;
      if (currentDepth > maxDepthToDeepestChild) {
        maxDepthToDeepestChild = currentDepth;
      }
      for (const childBoard of childBoards) {
        await calculateDepthToDeepestChild(childBoard.id, currentDepth);
      }
    }
  };

  await calculateDepthToDeepestChild(boardId, 1);

  return depthFromRoot + maxDepthToDeepestChild - 1;
};

export { getBoardDepth };