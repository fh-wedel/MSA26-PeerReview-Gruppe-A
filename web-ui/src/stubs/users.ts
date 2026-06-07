export interface MockUser {
  id: string;
  username: string;
  email?: string;
}

export const mockUsers: MockUser[] = [
  { id: 'u1', username: 'Alice Smith', email: 'alice@example.com' },
  { id: 'u2', username: 'Bob Johnson', email: 'bob@example.com' },
  { id: 'u3', username: 'Prof. Dr. Ada Sommer', email: 'ada@example.com' },
  { id: 'u4', username: 'System Admin', email: 'admin@example.com' },
  { id: 'current_user', username: 'John Doe', email: 'john@example.com' },
];