import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Paper,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import { Delete, Edit, GroupAdd } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import {
  searchUsers,
  fetchGroupMembers,
  addGroupMember,
  removeGroupMember,
  updateUserAttributes,
  fetchUserDetails
} from '../api/users';
import { useTopicTags } from '../hooks/useTopicTags';
import { handleAddSubmitLogic, handleEditSubmitLogic } from '../utils/userManagementHelpers';
import { UserManagementTable } from '../components/user-management/UserManagementTable';
import type { UserProfile, UserSummary } from '../api/generated/users';

const GROUPS = ['All Users', 'Admin', 'ExaminationOfficer', 'Teacher', 'Reviewer', 'Author'];

export const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [members, setMembers] = useState<UserProfile[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // User search (Autocomplete)
  const [searchOptions, setSearchOptions] = useState<UserSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);

  // Form State
  const [isActive, setIsActive] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingUsername, setEditingUsername] = useState<string | null>(null);

  const { topicTags } = useTopicTags();

  const currentGroup = GROUPS[activeTab];

  const userRoles = (user?.roles || []).map(r => r.toLowerCase());
  const hasAccess = userRoles.includes('admin') || userRoles.includes('examinationofficer');

  useEffect(() => {
    if (hasAccess) {
      loadMembers();
    }
  }, [activeTab, hasAccess]);

  const loadMembers = async () => {
    setLoadingMembers(true);
    try {
      if (currentGroup === 'All Users') {
        const summaries = await searchUsers('');
        const detailedUsers = await Promise.all(
          summaries.map(s => fetchUserDetails(s.username).catch(err => {
            console.error(`Failed to fetch details for ${s.username}`, err);
            return null;
          }))
        );
        setMembers(detailedUsers.filter((u): u is UserProfile => u !== null));
      } else {
        const data = await fetchGroupMembers(currentGroup);
        setMembers(data);
      }
    } catch (err) {
      console.error('Failed to load members', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleSearch = async (query: string) => {
    setSearching(true);
    try {
      const results = await searchUsers(query);
      setSearchOptions(results);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setSearching(false);
    }
  };

  const handleAddSubmit = async () => {
    await handleAddSubmitLogic(selectedUser, currentGroup, isActive, selectedTags, addGroupMember, setMembers, setAddDialogOpen, setSelectedUser, setIsActive, setSelectedTags);
  };

  const handleEditOpen = (member: UserProfile) => {
    setEditingUsername(member.username);
    if (currentGroup === 'Reviewer') {
      const activeStr = member.customAttributes?.isActive;
      setIsActive(activeStr === 'true');
      const tagsStr = member.customAttributes?.topicTags;
      setSelectedTags(tagsStr ? tagsStr.split(',') : []);
    }
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    await handleEditSubmitLogic(editingUsername, currentGroup, isActive, selectedTags, updateUserAttributes, setMembers, setEditDialogOpen, setEditingUsername);
  };

  const handleRemove = async (username: string) => {
    if (window.confirm(`Are you sure you want to remove ${username} from ${currentGroup}?`)) {
      try {
        await removeGroupMember(currentGroup, username);
        setMembers(prev => prev.filter(m => m.username !== username));
      } catch (err) {
        console.error('Failed to remove member', err);
      }
    }
  };



  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Box sx={{ width: '100%', mb: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
        User Management
      </Typography>

      <Card elevation={3} sx={{ borderRadius: 2, mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
          >
            {GROUPS.map((group) => (
              <Tab key={group} label={group} />
            ))}
          </Tabs>
        </Box>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">{currentGroup === 'All Users' ? 'All Users' : `${currentGroup}s`}</Typography>
            {currentGroup !== 'All Users' && (
              <Button
                variant="contained"
                startIcon={<GroupAdd />}
                onClick={() => {
                  setSelectedUser(null);
                  setIsActive(true);
                  setSelectedTags([]);
                  setAddDialogOpen(true);
                  handleSearch('');
                }}
              >
                Add Member
              </Button>
            )}
          </Box>

          <UserManagementTable
            currentGroup={currentGroup}
            loadingMembers={loadingMembers}
            members={members}
            handleEditOpen={handleEditOpen}
            handleRemove={handleRemove}
          />
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add {currentGroup}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <Autocomplete
            options={searchOptions.filter(option => !members.some(m => m.username === option.username))}
            getOptionLabel={(option) => option.username}
            onInputChange={(_, value) => handleSearch(value)}
            onChange={(_, value) => setSelectedUser(value)}
            loading={searching}
            renderInput={(params) => {
              // Backward/forward compatibility for MUI versions
              const inputProps = (params as any).slotProps?.input || (params as any).InputProps;
              
              return (
                <TextField
                  {...params}
                  label="Search User"
                  fullWidth
                  slotProps={{
                    ...(params as any).slotProps,
                    input: {
                      ...inputProps,
                      endAdornment: (
                        <React.Fragment>
                          {searching ? <CircularProgress color="inherit" size={20} /> : null}
                          {inputProps?.endAdornment}
                        </React.Fragment>
                      ),
                    },
                  }}
                />
              );
            }}
          />

          {currentGroup === 'Reviewer' && (
            <>
              <FormControlLabel
                control={
                  <Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                }
                label="Is Active"
              />
              <Autocomplete
                multiple
                options={topicTags.map((tag) => tag.tagName || '')}
                value={selectedTags}
                onChange={(_, newValue) => setSelectedTags(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Topic Tags"
                    placeholder="Select tags..."
                  />
                )}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddSubmit} variant="contained" disabled={!selectedUser}>
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Reviewer Attributes - {editingUsername}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <FormControlLabel
            control={
              <Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            }
            label="Is Active"
          />
          <Autocomplete
            multiple
            options={topicTags.map((tag) => tag.tagName || '')}
            value={selectedTags}
            onChange={(_, newValue) => setSelectedTags(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="outlined"
                label="Topic Tags"
                placeholder="Select tags..."
              />
            )}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
