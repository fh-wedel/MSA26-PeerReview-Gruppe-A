import {useEffect, useState} from 'react';
import {workflowApiClient} from '../api/clients';

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
        const response = await workflowApiClient.plugins.listPlugins();
        
        if (!response.ok) {
          throw new Error(`Failed to fetch plugins: ${response.statusText}`);
        }

        // Response format handles the JSON conversion
        setPlugins(response.data);
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
