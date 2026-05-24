export interface MockUser {
  id: string;
  name: string;
  email?: string;
}

export const mockUsers: MockUser[] = [
  { id: 'u1', name: 'Alice Smith', email: 'alice@example.com' },
  { id: 'u2', name: 'Bob Johnson', email: 'bob@example.com' },
  { id: 'u3', name: 'Prof. Dr. Ada Sommer', email: 'ada@example.com' },
  { id: 'u4', name: 'System Admin', email: 'admin@example.com' },
  { id: 'current_user', name: 'John Doe', email: 'john@example.com' },
];