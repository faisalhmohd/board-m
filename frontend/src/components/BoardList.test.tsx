import React from 'react';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BoardList from './BoardList';

const queryClient = new QueryClient();

const renderWithClient = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

test('renders BoardList component', () => {
  renderWithClient(<BoardList />);
  expect(screen.getByText(/Boards/i)).toBeInTheDocument();
});

test('creates a new board', () => {
  renderWithClient(<BoardList />);
  fireEvent.click(screen.getByText(/Add Folder/i));
  fireEvent.change(screen.getByPlaceholderText(/Board Name/i), { target: { value: 'New Board' } });
  fireEvent.change(screen.getByPlaceholderText(/Board Description/i), { target: { value: 'Description' } });
  fireEvent.click(screen.getByText(/Create/i));
  expect(screen.getByText(/New Board/i)).toBeInTheDocument();
});