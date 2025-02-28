'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import BoardList from "@/components/BoardList";

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
    <main className="min-h-screen bg-gray-100 py-8">
      <BoardList />
    </main>
    </QueryClientProvider>
  );
}
