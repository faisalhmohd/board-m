import React, { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FaFolder, FaTrash, FaCaretRight, FaCaretDown, FaPlus } from 'react-icons/fa';
import Modal from 'react-modal';

interface Board {
  id: string;
  name: string;
  description: string;
  parentBoardId?: string;
}

const fetchBoards = async (parentBoardId?: string) => {
  const { data } = await axios.get('/api/boards', {
    params: { parentBoardId },
  });
  return data;
};

const createBoard = async (newBoard: { name: string; description: string; parentBoardId?: string }) => {
  const { data } = await axios.post('/api/boards', newBoard);
  return data;
};

const deleteBoard = async (id: string) => {
  await axios.delete(`/api/boards/${id}`);
};

const moveBoard = async ({ id, parentBoardId }: { id: string; parentBoardId: string }) => {
  await axios.put(`/api/boards/${id}/move`, { parentBoardId });
};

const BoardItem: React.FC<{ board: Board; onMove: (id: string, parentBoardId: string) => void; onExpand: (id: string) => void; isExpanded: boolean; onCreateNestedBoard: (parentBoardId: string) => void }> = ({ board, onMove, onExpand, isExpanded, onCreateNestedBoard }) => {
  const [, ref] = useDrag({
    type: 'BOARD',
    item: { id: board.id },
  });

  const [, drop] = useDrop({
    accept: 'BOARD',
    drop: (item: { id: string }) => {
      onMove(item.id, board.id);
    },
  });

  return (
    <div ref={(node) => ref(drop(node))} className="rounded flex items-center hover:bg-gray-100 cursor-pointer">
      <div onClick={() => onExpand(board.id)} className="mr-2">
        {isExpanded ? <FaCaretDown size={10} /> : <FaCaretRight size={10} />}
      </div>
      <FaFolder className="mr-2 text-yellow-500" />
      <p>{board.name}</p>
      <button onClick={() => onCreateNestedBoard(board.id)} className="ml-2 bg-green-500 text-white p-1 rounded">
        <FaPlus size={10} />
      </button>
    </div>
  );
};

const BoardList: React.FC<{ parentBoardId?: string }> = ({ parentBoardId }) => {
  const queryClient = useQueryClient();
  const { data: boards, isLoading, error } = useQuery({
    queryKey: ['boards', parentBoardId],
    queryFn: () => fetchBoards(parentBoardId),
  });
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [expandedBoards, setExpandedBoards] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nestedParentBoardId, setNestedParentBoardId] = useState<string | undefined>(undefined);

  const createBoardMutation = useMutation({
    mutationFn: createBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
      setIsModalOpen(false);
    },
  });

  const deleteBoardMutation = useMutation({
    mutationFn: deleteBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  const moveBoardMutation = useMutation({
    mutationFn: moveBoard,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boards'] });
    },
  });

  const handleCreateBoard = () => {
    createBoardMutation.mutate({ name: newBoardName, description: newBoardDescription, parentBoardId });
    setNewBoardName('');
    setNewBoardDescription('');
  };

  const handleCreateNestedBoard = () => {
    createBoardMutation.mutate({ name: newBoardName, description: newBoardDescription, parentBoardId: nestedParentBoardId });
    setNewBoardName('');
    setNewBoardDescription('');
    setNestedParentBoardId(undefined);
  };

  const handleDeleteBoard = (id: string) => {
    deleteBoardMutation.mutate(id);
  };

  const handleMoveBoard = (id: string, newParentBoardId: string) => {
    moveBoardMutation.mutate({ id, parentBoardId: newParentBoardId });
  };

  const handleExpandBoard = (id: string) => {
    setExpandedBoards((prev) =>
      prev.includes(id) ? prev.filter((boardId) => boardId !== id) : [...prev, id]
    );
  };

  const handleOpenNestedModal = (parentBoardId: string) => {
    setNestedParentBoardId(parentBoardId);
    setIsModalOpen(true);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading boards</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto text-gray-400">
        {!parentBoardId && <h1 className="text-2xl font-bold mb-4">Boards</h1>}
        <ul>
          {boards?.map(board => (
            <li key={board.id} className="flex flex-col">
              <div className="flex items-center">
                <BoardItem board={board} onMove={handleMoveBoard} onExpand={handleExpandBoard} isExpanded={expandedBoards.includes(board.id)} onCreateNestedBoard={handleOpenNestedModal} />
                <button onClick={() => handleDeleteBoard(board.id)} className="ml-2 bg-red-500 text-white p-1 rounded">
                  <FaTrash size={10} />
                </button>
              </div>
              {expandedBoards.includes(board.id) && (
                <div className="ml-6">
                  <BoardList parentBoardId={board.id} />
                </div>
              )}
            </li>
          ))}
        </ul>
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          contentLabel="Create Board"
          className="bg-white p-4 rounded shadow-lg max-w-md mx-auto mt-20"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
          <h2 className="text-xl font-bold mb-4">Create Board</h2>
          <input
            type="text"
            placeholder="Board Name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            className="border p-2 rounded mb-2 w-full"
          />
          <input
            type="text"
            placeholder="Board Description"
            value={newBoardDescription}
            onChange={(e) => setNewBoardDescription(e.target.value)}
            className="border p-2 rounded mb-2 w-full"
          />
          <button onClick={nestedParentBoardId ? handleCreateNestedBoard : handleCreateBoard} className="bg-blue-500 text-white p-2 rounded w-full">Create</button>
        </Modal>
      </div>
    </DndProvider>
  );
};

export default BoardList;