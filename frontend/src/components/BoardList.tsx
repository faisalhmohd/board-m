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
  try {
    await axios.put(`/api/boards/${id}/move`, { parentBoardId });
  } catch (error) {
    if (error.response && error.response.status === 400 && (error.response.data.error as string).indexOf('Maximum depth') > -1) {
      alert(error.response.data.error);
    } else {
      alert('An error occurred while moving the board.');
    }
  }
};

const BoardItem: React.FC<{ board: Board; onMove: (id: string, parentBoardId: string) => void; onExpand: (id: string) => void; isExpanded: boolean; onCreateNestedBoard: (parentBoardId: string) => void; onHover: (id: string, parentBoardId?: string) => void; onLeave: () => void; isHovered: boolean; onDelete: (id: string) => void }> = ({ board, onMove, onExpand, isExpanded, onCreateNestedBoard, onHover, onLeave, isHovered, onDelete }) => {
  const [isOver, setIsOver] = useState(false);

  const [, ref] = useDrag({
    type: 'BOARD',
    item: { id: board.id },
  });

  const [, drop] = useDrop({
    accept: 'BOARD',
    drop: (item: { id: string }) => {
      onMove(item.id, board.id);
    },
    hover: () => {
      setIsOver(true);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={(node) => ref(drop(node))}
      className={`rounded flex items-center hover:bg-gray-100 cursor-pointer ${isHovered ? 'text-gray-700' : 'text-gray-400'} ${isOver ? 'bg-gray-200' : ''}`}
      onMouseEnter={() => onHover(board.id, board.parentBoardId)}
      onMouseLeave={() => {
        onLeave();
        setIsOver(false);
      }}
    >
      <div onClick={() => onExpand(board.id)} className="mr-2">
        {isExpanded ? <FaCaretDown size={10} /> : <FaCaretRight size={10} />}
      </div>
      <FaFolder className="mr-2 text-yellow-500" />
      <p>{board.name}</p>
      {isHovered && (
        <button onClick={() => onDelete(board.id)} className="ml-2 bg-red-500 text-white p-1 rounded">
          <FaTrash size={10} />
        </button>
      )}
    </div>
  );
};

const BoardList: React.FC<{ parentBoardId?: string; depth?: number }> = ({ parentBoardId, depth = 0 }) => {
  const queryClient = useQueryClient();
  const { data: boards, isLoading, error } = useQuery({
    queryKey: ['boards', parentBoardId],
    queryFn: () => fetchBoards(parentBoardId),
  });
  const [newBoardName, setNewBoardName] = useState('');
  const [newBoardDescription, setNewBoardDescription] = useState('');
  const [expandedBoards, setExpandedBoards] = useState<string[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [nestedParentBoardId, setNestedParentBoardId] = useState<string | undefined>(undefined);
  const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null);
  const [hoveredParentBoardId, setHoveredParentBoardId] = useState<string | null>(null);

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
      setIsConfirmModalOpen(false);
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
    setBoardToDelete(id);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (boardToDelete) {
      deleteBoardMutation.mutate(boardToDelete);
    }
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

  const handleHover = (id: string, parentBoardId?: string) => {
    setHoveredBoardId(id);
    setHoveredParentBoardId(parentBoardId || null);
  };

  const handleLeave = () => {
    setHoveredBoardId(null);
    setHoveredParentBoardId(null);
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading boards</div>;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="container mx-auto text-gray-400">
        {!parentBoardId && <h1 className="text-2xl font-bold mb-4">Boards</h1>}
        <ul>
          {isLoading && <li className="text-sm ml-7">Loading...</li>}
          {boards?.length === 0 && <li className="text-sm ml-7">Empty Board</li>}
          {boards?.map(board => (
            <li key={board.id} className="flex flex-col">
              <div className="flex items-center">
                <BoardItem
                  board={board}
                  onMove={handleMoveBoard}
                  onExpand={handleExpandBoard}
                  isExpanded={expandedBoards.includes(board.id)}
                  onCreateNestedBoard={handleOpenNestedModal}
                  onHover={handleHover}
                  onLeave={handleLeave}
                  isHovered={hoveredBoardId === board.id}
                  onDelete={handleDeleteBoard}
                />
              </div>
              {expandedBoards.includes(board.id) && (
                <div className="ml-4">
                  <BoardList parentBoardId={board.id} depth={depth + 1} />
                </div>
              )}
            </li>
          ))}
          {depth < 9 && (
            <li className="flex items-center">
              <button onClick={() => setIsModalOpen(true)} className={`text-sm p-1 rounded flex items-center ${hoveredParentBoardId === parentBoardId ? 'text-green-800' : 'text-green-600 '}`}>
                <FaPlus size={10} className="mr-1" /> Add Board
              </button>
            </li>
          )}
        </ul>
        <Modal
          isOpen={isModalOpen}
          onRequestClose={() => setIsModalOpen(false)}
          contentLabel="Create Board"
          className="bg-white p-4 rounded shadow-lg max-w-md mx-auto mt-20"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
          <h2 className="text-xl font-bold mb-4 text-gray-600">Create Board</h2>
          <input
            type="text"
            placeholder="Board Name"
            value={newBoardName}
            onChange={(e) => setNewBoardName(e.target.value)}
            className="border p-2 rounded mb-2 w-full text-black"
          />
          <input
            type="text"
            placeholder="Board Description"
            value={newBoardDescription}
            onChange={(e) => setNewBoardDescription(e.target.value)}
            className="border p-2 rounded mb-2 w-full text-black"
          />
          <button onClick={nestedParentBoardId ? handleCreateNestedBoard : handleCreateBoard} className="bg-blue-500 text-white p-2 rounded w-full">Create</button>
        </Modal>
        <Modal
          isOpen={isConfirmModalOpen}
          onRequestClose={() => setIsConfirmModalOpen(false)}
          contentLabel="Confirm Delete"
          className="bg-white p-4 rounded shadow-lg max-w-md mx-auto mt-20 text-gray-600"
          overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
        >
          <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
          <p>Are you sure you want to delete this board? All of its nested boards will also be deleted.</p>
          <div className="flex justify-end mt-4">
            <button onClick={() => setIsConfirmModalOpen(false)} className="bg-gray-500 text-white p-2 rounded mr-2">Cancel</button>
            <button onClick={handleConfirmDelete} className="bg-red-500 text-white p-2 rounded">Delete</button>
          </div>
        </Modal>
      </div>
    </DndProvider>
  );
};

export default BoardList;