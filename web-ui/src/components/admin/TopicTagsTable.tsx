import React from "react";
import { TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Paper, Skeleton, IconButton, Box, Typography, TextField, Button } from "@mui/material";
import { Tag, Add, Delete } from "@mui/icons-material";

interface TopicTagsTableProps {
  topicTags: any[];
  loadingTags: boolean;
  newTagName: string;
  setNewTagName: (val: string) => void;
  handleAddTag: () => void;
  deleteTag: (name: string) => void;
}

export const TopicTagsTable: React.FC<TopicTagsTableProps> = ({
  topicTags,
  loadingTags,
  newTagName,
  setNewTagName,
  handleAddTag,
  deleteTag
}) => {
  return (
    <>
      <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
        Topic Tags Management
      </Typography>

      <TableContainer component={Paper} elevation={3} sx={{borderRadius: 2, overflow: 'hidden', mb: 4}}>
        <Box sx={{p: 2, bgcolor: 'background.default', display: 'flex', alignItems: 'center', gap: 2}}>
            <Tag />
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Valid Topic Tags</Typography>
            <TextField 
                size="small" 
                placeholder="New Tag Name" 
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
            />
            <Button variant="contained" startIcon={<Add />} onClick={handleAddTag} disabled={!newTagName.trim()}>
                Add Tag
            </Button>
        </Box>
        <Table>
            <TableHead sx={{bgcolor: 'background.default'}}>
                <TableRow>
                    <TableCell sx={{fontWeight: 'bold', width: '40%'}}>Tag Name</TableCell>
                    <TableCell sx={{fontWeight: 'bold', width: '40%'}}>Created At</TableCell>
                    <TableCell sx={{fontWeight: 'bold', width: '20%', textAlign: 'right'}}>Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {loadingTags ? (
                    <TableRow><TableCell colSpan={3}><Skeleton variant="text"/></TableCell></TableRow>
                ) : topicTags && topicTags.length > 0 ? (
                    topicTags.map((tag) => (
                        <TableRow key={tag.tagName} hover>
                            <TableCell>{tag.tagName}</TableCell>
                            <TableCell>{new Date(tag.createdAt!).toLocaleString()}</TableCell>
                            <TableCell align="right">
                                <IconButton color="error" onClick={() => deleteTag(tag.tagName!)}>
                                    <Delete />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))
                ) : (
                    <TableRow><TableCell colSpan={3} align="center">No topic tags found.</TableCell></TableRow>
                )}
            </TableBody>
        </Table>
      </TableContainer>
    </>
  );
};
