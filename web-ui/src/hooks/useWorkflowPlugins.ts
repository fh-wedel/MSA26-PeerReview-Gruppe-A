import { useState, useEffect } from 'react';

export interface WorkflowRules {
  authorAnonymous: boolean;
  reviewerAnonymous: boolean;
  reviewerToReviewerAnonymous: boolean;
  authorReviewerChatAllowed: boolean;
  reviewerToReviewerChatAllowed: boolean;
}

export interface WorkflowPlugin {
  name: string;
  title: string;
  description: string;
  rules: WorkflowRules;
}

export const useWorkflowPlugins = () => {
  const [plugins, setPlugins] = useState<WorkflowPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlugins = async () => {
      try {
        const token = sessionStorage.getItem('access_token');
        const headers: HeadersInit = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('/api/workflow/plugins', {
          headers
        });
        if (!response.ok) {
          throw new Error(`Failed to fetch plugins: ${response.statusText}`);
        }
        const data = await response.json();
        setPlugins(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchPlugins();
  }, []);

  return { plugins, loading, error };
};
