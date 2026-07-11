import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleAddSubmitLogic, handleEditSubmitLogic } from './userManagementHelpers';

describe('userManagementHelpers', () => {
  const addGroupMember = vi.fn();
  const updateUserAttributes = vi.fn();
  const setMembers = vi.fn();
  const setAddDialogOpen = vi.fn();
  const setSelectedUser = vi.fn();
  const setIsActive = vi.fn();
  const setSelectedTags = vi.fn();
  const setEditDialogOpen = vi.fn();
  const setEditingUsername = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('handleAddSubmitLogic', () => {
    it('returns early if no selected user', async () => {
      await handleAddSubmitLogic(null, 'Reviewer', true, [], addGroupMember, setMembers, setAddDialogOpen, setSelectedUser, setIsActive, setSelectedTags);
      expect(addGroupMember).not.toHaveBeenCalled();
    });

    it('adds Reviewer with custom attributes', async () => {
      addGroupMember.mockResolvedValue({ username: 'bob' });
      const selectedUser = { username: 'bob' };
      await handleAddSubmitLogic(selectedUser, 'Reviewer', true, ['tag1'], addGroupMember, setMembers, setAddDialogOpen, setSelectedUser, setIsActive, setSelectedTags);
      expect(addGroupMember).toHaveBeenCalledWith('Reviewer', 'bob', { isActive: 'true', topicTags: 'tag1' });
      expect(setAddDialogOpen).toHaveBeenCalledWith(false);
    });

    it('adds generic user without custom attributes', async () => {
      addGroupMember.mockResolvedValue({ username: 'alice' });
      const selectedUser = { username: 'alice' };
      await handleAddSubmitLogic(selectedUser, 'Admin', true, ['tag1'], addGroupMember, setMembers, setAddDialogOpen, setSelectedUser, setIsActive, setSelectedTags);
      expect(addGroupMember).toHaveBeenCalledWith('Admin', 'alice', {});
    });

    it('handles error gracefully', async () => {
      addGroupMember.mockRejectedValue(new Error('fail'));
      const selectedUser = { username: 'alice' };
      await handleAddSubmitLogic(selectedUser, 'Admin', true, [], addGroupMember, setMembers, setAddDialogOpen, setSelectedUser, setIsActive, setSelectedTags);
      expect(setAddDialogOpen).not.toHaveBeenCalled();
    });
  });

  describe('handleEditSubmitLogic', () => {
    it('returns early if no editing username', async () => {
      await handleEditSubmitLogic(null, 'Reviewer', true, [], updateUserAttributes, setMembers, setEditDialogOpen, setEditingUsername);
      expect(updateUserAttributes).not.toHaveBeenCalled();
    });

    it('updates Reviewer with custom attributes', async () => {
      updateUserAttributes.mockResolvedValue({ username: 'bob' });
      await handleEditSubmitLogic('bob', 'Reviewer', false, ['tag2'], updateUserAttributes, setMembers, setEditDialogOpen, setEditingUsername);
      expect(updateUserAttributes).toHaveBeenCalledWith('Reviewer', 'bob', { isActive: 'false', topicTags: 'tag2' });
      expect(setEditDialogOpen).toHaveBeenCalledWith(false);
    });

    it('updates generic user without custom attributes', async () => {
      updateUserAttributes.mockResolvedValue({ username: 'alice' });
      await handleEditSubmitLogic('alice', 'Admin', true, [], updateUserAttributes, setMembers, setEditDialogOpen, setEditingUsername);
      expect(updateUserAttributes).toHaveBeenCalledWith('Admin', 'alice', {});
    });

    it('handles error gracefully', async () => {
      updateUserAttributes.mockRejectedValue(new Error('fail'));
      await handleEditSubmitLogic('alice', 'Admin', true, [], updateUserAttributes, setMembers, setEditDialogOpen, setEditingUsername);
      expect(setEditDialogOpen).not.toHaveBeenCalled();
    });
  });
});
