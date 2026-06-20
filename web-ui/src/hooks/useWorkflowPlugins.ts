import {useEffect, useState} from 'react';
import {configurationApiClient} from '../api/clients';
import type {ReviewTemplateDto, ReviewTypeDto} from '../api/generated/configuration';

export const useWorkflowPlugins = () => {
  const [types, setTypes] = useState<ReviewTypeDto[]>([]);
  const [templates, setTemplates] = useState<ReviewTemplateDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchPlugins = async () => {
      try {
        const [typesRes, templatesRes] = await Promise.all([
          configurationApiClient.reviewTypes.listReviewTypes(),
          configurationApiClient.reviewTemplates.listReviewTemplates()
        ]);
        
        if (!typesRes.ok || !templatesRes.ok) {
          throw new Error(`Failed to fetch plugins`);
        }

        setTypes(typesRes.data);
        setTemplates(templatesRes.data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchPlugins();
  }, []);

  return { types, templates, loading, error };
};
