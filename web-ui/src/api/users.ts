import { usersApiClient } from './clients';
import type { UserProfile, UserSummary } from './generated/users';

export const searchUsers = async (query: string): Promise<UserSummary[]> => {
  const response = await usersApiClient.search.searchUsers({ q: query });
  return response.data.users || [];
};

export const fetchGroupMembers = async (groupName: string): Promise<UserProfile[]> => {
  const response = await usersApiClient.groups.listGroupMembers(groupName);
  return response.data.users || [];
};

export const addGroupMember = async (
  groupName: string,
  username: string,
  customAttributes?: Record<string, string>
): Promise<UserProfile> => {
  const response = await usersApiClient.groups.addGroupMember(groupName, {
    username,
    customAttributes,
  });
  return response.data;
};

export const removeGroupMember = async (groupName: string, username: string): Promise<void> => {
  await usersApiClient.groups.removeGroupMember(groupName, username);
};

export const updateUserAttributes = async (
  groupName: string,
  username: string,
  customAttributes: Record<string, string>
): Promise<UserProfile> => {
  const response = await usersApiClient.groups.updateUserAttributes(groupName, username, {
    customAttributes,
  });
  return response.data;
};

import { fetchWithAuth } from './fetchWrapper';

export const fetchUserDetails = async (username: string): Promise<UserProfile> => {
  const response = await fetchWithAuth(`/api/users/details/${username}`, {
    headers: {
      Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
    }
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user details');
  }
  return response.json();
};
