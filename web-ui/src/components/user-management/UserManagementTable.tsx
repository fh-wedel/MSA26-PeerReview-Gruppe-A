import React from "react";
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, CircularProgress, Chip, Typography, IconButton } from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import type { UserProfile } from "../../api/generated/users";

interface UserManagementTableProps {
  currentGroup: string;
  loadingMembers: boolean;
  members: UserProfile[];
  handleEditOpen: (member: UserProfile) => void;
  handleRemove: (username: string) => void;
}

export const UserManagementTable: React.FC<UserManagementTableProps> = ({
  currentGroup,
  loadingMembers,
  members,
  handleEditOpen,
  handleRemove
}) => {
  return (
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
                      <IconButton color="primary" onClick={() => handleEditOpen(member)} size="small" sx={{ mr: 1 }}>
                        <Edit fontSize="small" />
                      </IconButton>
                    )}
                    <IconButton color="error" onClick={() => handleRemove(member.username)} size="small">
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
