import {useEffect, useState} from 'react';

export interface WorkflowRules {
  authorAnonymous: boolean;
  reviewerAnonymous: boolean;
  authorReviewerChatAllowed: boolean;
}

export interface WorkflowPlugin {
  name: string;
  title: string;
  description: string;
  rules: WorkflowRules;
  submissionDeadlineDuration: string;
  reviewDeadlineDuration: string;
  evaluationCriteriaVisibleToAuthors: boolean;
  numberOfReviewers: number;
  numberOfAuthors: number;
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
          let errMsg = `Failed to fetch plugins: ${response.statusText}`;
          try {
            const errData = await response.json();
            if (errData.message) errMsg = errData.message;
            else if (errData.error) errMsg = errData.error;
            else if (typeof errData === 'string') errMsg = errData;
          } catch (e) {}
          throw new Error(errMsg);
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
