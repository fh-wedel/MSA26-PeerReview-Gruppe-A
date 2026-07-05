import { UserProfile } from '../api/communication';

export const handleAddSubmitLogic = async (
  selectedUser: any,
  currentGroup: string,
  isActive: boolean,
  selectedTags: string[],
  addGroupMember: (group: string, username: string, attrs: Record<string, string>) => Promise<UserProfile>,
  setMembers: (updater: (prev: UserProfile[]) => UserProfile[]) => void,
  setAddDialogOpen: (val: boolean) => void,
  setSelectedUser: (val: any) => void,
  setIsActive: (val: boolean) => void,
  setSelectedTags: (val: string[]) => void
) => {
  if (!selectedUser) return;
  try {
    const customAttrs: Record<string, string> = {};
    if (currentGroup === 'Reviewer') {
      customAttrs.isActive = isActive ? 'true' : 'false';
      if (selectedTags.length > 0) {
        customAttrs.topicTags = selectedTags.join(',');
      }
    }

    const newUser = await addGroupMember(currentGroup, selectedUser.username, customAttrs);
    setMembers((prev: UserProfile[]) => prev.some(m => m.username === newUser.username) ? prev : [...prev, newUser]);
    setAddDialogOpen(false);
    setSelectedUser(null);
    setIsActive(true);
    setSelectedTags([]);
  } catch (err) {
    console.error('Failed to add member', err);
  }
};

export const handleEditSubmitLogic = async (
  editingUsername: string | null,
  currentGroup: string,
  isActive: boolean,
  selectedTags: string[],
  updateUserAttributes: (group: string, username: string, attrs: Record<string, string>) => Promise<UserProfile>,
  setMembers: (updater: (prev: UserProfile[]) => UserProfile[]) => void,
  setEditDialogOpen: (val: boolean) => void,
  setEditingUsername: (val: string | null) => void
) => {
  if (!editingUsername) return;
  try {
    const customAttrs: Record<string, string> = {};
    if (currentGroup === 'Reviewer') {
      customAttrs.isActive = isActive ? 'true' : 'false';
      customAttrs.topicTags = selectedTags.join(',');
    }
    const updatedUser = await updateUserAttributes(currentGroup, editingUsername, customAttrs);
    setMembers((prev: UserProfile[]) => prev.map(m => m.username === editingUsername ? updatedUser : m));
    setEditDialogOpen(false);
    setEditingUsername(null);
  } catch (err) {
    console.error('Failed to update member attributes', err);
  }
};
