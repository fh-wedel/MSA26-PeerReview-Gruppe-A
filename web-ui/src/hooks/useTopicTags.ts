import { useState, useEffect, useCallback } from 'react';
import { configurationApiClient } from '../api/clients';
import type { TopicTagDto } from '../api/generated/configuration';

export const useTopicTags = () => {
  const [topicTags, setTopicTags] = useState<TopicTagDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTopicTags = useCallback(async () => {
    setLoading(true);
    try {
      const response = await configurationApiClient.topicTags.listTopicTags();
      if (response.ok) {
        setTopicTags(response.data);
      } else {
        throw new Error(`Failed to fetch topic tags: ${response.statusText}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch topic tags'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTopicTags();
  }, [fetchTopicTags]);

  const addTag = async (tagName: string) => {
    const response = await configurationApiClient.topicTags.addTopicTag({ tagName });
    if (response.ok) {
      await fetchTopicTags();
    } else {
      throw new Error(`Failed to add tag: ${response.statusText}`);
    }
  };

  const deleteTag = async (tagName: string) => {
    const response = await configurationApiClient.topicTags.deleteTopicTag(tagName);
    if (response.ok) {
      await fetchTopicTags();
    } else {
      throw new Error(`Failed to delete tag: ${response.statusText}`);
    }
  };

  return { topicTags, loading, error, addTag, deleteTag, refresh: fetchTopicTags };
};
