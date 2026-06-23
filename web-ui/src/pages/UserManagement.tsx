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
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  OutlinedInput,
  Select,
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
import type { SelectChangeEvent } from '@mui/material/Select';
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
      setMembers(prev => [...prev, newUser]);
      setAddDialogOpen(false);
      setSelectedUser(null);
      setIsActive(true);
      setSelectedTags([]);
    } catch (err) {
      console.error('Failed to add member', err);
    }
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
    if (!editingUsername) return;
    try {
      const customAttrs: Record<string, string> = {};
      if (currentGroup === 'Reviewer') {
        customAttrs.isActive = isActive ? 'true' : 'false';
        customAttrs.topicTags = selectedTags.join(',');
      }
      const updatedUser = await updateUserAttributes(currentGroup, editingUsername, customAttrs);
      setMembers(prev => prev.map(m => m.username === editingUsername ? updatedUser : m));
      setEditDialogOpen(false);
      setEditingUsername(null);
    } catch (err) {
      console.error('Failed to update member attributes', err);
    }
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

  const handleTagChange = (event: SelectChangeEvent<typeof selectedTags>) => {
    const {
      target: { value },
    } = event;
    setSelectedTags(
      typeof value === 'string' ? value.split(',') : value,
    );
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

          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table>
              <TableHead sx={{ bgcolor: 'background.default' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  {currentGroup === 'All Users' && <TableCell sx={{ fontWeight: 'bold' }}>Groups</TableCell>}
                  {currentGroup === 'Reviewer' && <TableCell sx={{ fontWeight: 'bold' }}>Active</TableCell>}
                  {currentGroup === 'Reviewer' && <TableCell sx={{ fontWeight: 'bold' }}>Topics</TableCell>}
                  {currentGroup !== 'All Users' && <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingMembers ? (
                  <TableRow>
                    <TableCell colSpan={currentGroup === 'Reviewer' ? 6 : currentGroup === 'All Users' ? 4 : 4} align="center">
                      <CircularProgress size={24} sx={{ my: 2 }} />
                    </TableCell>
                  </TableRow>
                ) : members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={currentGroup === 'Reviewer' ? 6 : currentGroup === 'All Users' ? 4 : 4} align="center">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  members.map((member) => (
                    <TableRow key={member.username} hover>
                      <TableCell>{member.username}</TableCell>
                      <TableCell>{member.email || '-'}</TableCell>
                      <TableCell>
                        <Chip
                          label={member.status}
                          size="small"
                          color={member.status === 'CONFIRMED' ? 'success' : 'default'}
                        />
                      </TableCell>
                      {currentGroup === 'All Users' && (
                        <TableCell>
                          {(member.groups && member.groups.length > 0) ? member.groups.map(g => (
                            <Chip key={g} label={g} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          )) : (
                            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>No groups</Typography>
                          )}
                        </TableCell>
                      )}
                      {currentGroup === 'Reviewer' && (
                        <TableCell>
                          <Chip
                            label={member.customAttributes?.isActive === 'true' ? 'Yes' : 'No'}
                            size="small"
                            color={member.customAttributes?.isActive === 'true' ? 'primary' : 'default'}
                          />
                        </TableCell>
                      )}
                      {currentGroup === 'Reviewer' && (
                        <TableCell>
                          {member.customAttributes?.topicTags?.split(',').map((tag) => (
                            <Chip key={tag} label={tag} size="small" sx={{ mr: 0.5, mb: 0.5 }} />
                          ))}
                        </TableCell>
                      )}
                      {currentGroup !== 'All Users' && (
                        <TableCell align="right">
                          {currentGroup === 'Reviewer' && (
                            <IconButton color="primary" onClick={() => handleEditOpen(member)}>
                              <Edit />
                            </IconButton>
                          )}
                          <IconButton color="error" onClick={() => handleRemove(member.username)}>
                            <Delete />
                          </IconButton>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add {currentGroup}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 2 }}>
          <Autocomplete
            options={searchOptions}
            getOptionLabel={(option) => option.username}
            onInputChange={(_, value) => handleSearch(value)}
            onChange={(_, value) => setSelectedUser(value)}
            loading={searching}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search User"
                fullWidth
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <React.Fragment>
                      {searching ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps?.endAdornment}
                    </React.Fragment>
                  ),
                }}
              />
            )}
          />

          {currentGroup === 'Reviewer' && (
            <>
              <FormControlLabel
                control={
                  <Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
                }
                label="Is Active"
              />
              <FormControl fullWidth>
                <InputLabel id="topic-tags-label">Topic Tags</InputLabel>
                <Select
                  labelId="topic-tags-label"
                  multiple
                  value={selectedTags}
                  onChange={handleTagChange}
                  input={<OutlinedInput label="Topic Tags" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} />
                      ))}
                    </Box>
                  )}
                >
                  {topicTags.map((tag) => (
                    <MenuItem key={tag.tagName} value={tag.tagName}>
                      {tag.tagName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
          <FormControl fullWidth>
            <InputLabel id="edit-topic-tags-label">Topic Tags</InputLabel>
            <Select
              labelId="edit-topic-tags-label"
              multiple
              value={selectedTags}
              onChange={handleTagChange}
              input={<OutlinedInput label="Topic Tags" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {selected.map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {topicTags.map((tag) => (
                <MenuItem key={tag.tagName} value={tag.tagName}>
                  {tag.tagName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
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
