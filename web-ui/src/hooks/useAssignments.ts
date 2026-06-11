import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export interface Assignment {
  submissionId: string;
  assignedAt: string;
}

export const useAssignments = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.username) {
        setLoading(false);
        return;
      }

      try {
        const token = sessionStorage.getItem('access_token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`/api/matching/matches/examiners/${user.username}`, {
          headers
        });
        
        if (response.status === 404) {
          // No assignments found
          setAssignments([]);
          return;
        }
        
        if (!response.ok) {
          throw new Error(`Failed to fetch assignments: ${response.statusText}`);
        }
        
        const data = await response.json();
        setAssignments(data.assignments || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user?.username]);

  return { assignments, loading, error };
};
