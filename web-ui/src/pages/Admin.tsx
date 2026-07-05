import React, {useEffect, useState} from 'react';
import {
  Box,
  Card,
  CardContent,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  TextField,
  Button
} from '@mui/material';
import {Extension, Group, Tag, Delete, Add} from '@mui/icons-material';
import {searchUsers} from '../api/communication';
import { useWorkflowPlugins } from '../hooks/useWorkflowPlugins';
import { useTopicTags } from '../hooks/useTopicTags';
import { TopicTagsTable } from '../components/admin/TopicTagsTable';
import {useAuth} from '../contexts/AuthContext';
import {Navigate} from 'react-router-dom';

export const Admin: React.FC = () => {
    const {user} = useAuth();
    const [userCount, setUserCount] = useState<number | null>(null);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const { types, templates, loading: loadingPlugins } = useWorkflowPlugins();
    const { topicTags, loading: loadingTags, addTag, deleteTag } = useTopicTags();
    const [newTagName, setNewTagName] = useState('');

    const handleAddTag = async () => {
        if (!newTagName.trim()) return;
        try {
            await addTag(newTagName);
            setNewTagName('');
        } catch (e) {
            console.error("Failed to add tag", e);
        }
    };

    useEffect(() => {
        // Fetch total users
        searchUsers('')
            .then(users => {
                setUserCount(users.length);
            })
            .catch(err => {
                console.error('Failed to fetch users', err);
                setUserCount(0);
            })
            .finally(() => setLoadingUsers(false));

        
    }, []);

    const userRoles = (user?.roles || []).map(r => r.toLowerCase());
    const isAdmin = userRoles.includes('admin');

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace/>;
    }

    return (
        <Box sx={{width: '100%', mb: 4}}>
            <Typography variant="h4" sx={{fontWeight: 'bold', mb: 3}}>
                Admin Dashboard
            </Typography>

            <Box sx={{display: 'flex', flexDirection: {xs: 'column', md: 'row'}, gap: 3, mb: 4}}>
                {/* Users Statistic Card */}
                <Box sx={{flex: 1}}>
                    <Card elevation={3} sx={{height: '100%', borderRadius: 2}}>
                        <CardContent sx={{display: 'flex', alignItems: 'center', p: 3}}>
                            <Box sx={{
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText',
                                p: 2,
                                borderRadius: '50%',
                                display: 'flex',
                                mr: 3
                            }}>
                                <Group fontSize="large"/>
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" color="text.secondary">
                                    Total Users
                                </Typography>
                                {loadingUsers ? (
                                    <Skeleton variant="text" width={80} height={60}/>
                                ) : (
                                    <Typography variant="h3" sx={{fontWeight: 'bold'}}>
                                        {userCount}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>

                {/* Plugins Statistic Card */}
                <Box sx={{flex: 1}}>
                    <Card elevation={3} sx={{height: '100%', borderRadius: 2}}>
                        <CardContent sx={{display: 'flex', alignItems: 'center', p: 3}}>
                            <Box sx={{
                                bgcolor: 'secondary.main',
                                color: 'secondary.contrastText',
                                p: 2,
                                borderRadius: '50%',
                                display: 'flex',
                                mr: 3
                            }}>
                                <Extension fontSize="large"/>
                            </Box>
                            <Box>
                                <Typography variant="subtitle1" color="text.secondary">
                                    Active Workflow Plugins
                                </Typography>
                                {loadingPlugins ? (
                                    <Skeleton variant="text" width={80} height={60}/>
                                ) : (
                                    <Typography variant="h3" sx={{fontWeight: 'bold'}}>
                                        {(types?.length || 0) + (templates?.length || 0)}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            <TopicTagsTable
                topicTags={topicTags}
                loadingTags={loadingTags}
                newTagName={newTagName}
                setNewTagName={setNewTagName}
                handleAddTag={handleAddTag}
                deleteTag={deleteTag}
            />

            {/* Active Workflow Plugins Table */}
            <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
                Workflow Plugins Configuration
            </Typography>

            
            <TableContainer component={Paper} elevation={3} sx={{borderRadius: 2, overflow: 'hidden', mb: 4}}>
                <Typography variant="h6" sx={{p: 2, bgcolor: 'background.default'}}>Review Types</Typography>
                <Table>
                    <TableHead sx={{bgcolor: 'background.default'}}>
                        <TableRow>
                            <TableCell sx={{fontWeight: 'bold', width: '25%'}}>Name</TableCell>
                            <TableCell sx={{fontWeight: 'bold', width: '25%'}}>Title</TableCell>
                            <TableCell sx={{fontWeight: 'bold', width: '50%'}}>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loadingPlugins ? (
                            <TableRow><TableCell colSpan={3}><Skeleton variant="text"/></TableCell></TableRow>
                        ) : types && types.length > 0 ? (
                            types.map((plugin) => (
                                <TableRow key={plugin.name} hover>
                                    <TableCell>{plugin.name}</TableCell>
                                    <TableCell>{plugin.title}</TableCell>
                                    <TableCell>{plugin.description}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} align="center">No types found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <TableContainer component={Paper} elevation={3} sx={{borderRadius: 2, overflow: 'hidden'}}>
                <Typography variant="h6" sx={{p: 2, bgcolor: 'background.default'}}>Review Templates</Typography>
                <Table>
                    <TableHead sx={{bgcolor: 'background.default'}}>
                        <TableRow>
                            <TableCell sx={{fontWeight: 'bold', width: '25%'}}>Name</TableCell>
                            <TableCell sx={{fontWeight: 'bold', width: '25%'}}>Title</TableCell>
                            <TableCell sx={{fontWeight: 'bold', width: '50%'}}>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loadingPlugins ? (
                            <TableRow><TableCell colSpan={3}><Skeleton variant="text"/></TableCell></TableRow>
                        ) : templates && templates.length > 0 ? (
                            templates.map((plugin) => (
                                <TableRow key={plugin.name} hover>
                                    <TableCell>{plugin.name}</TableCell>
                                    <TableCell>{plugin.title}</TableCell>
                                    <TableCell>{plugin.description}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow><TableCell colSpan={3} align="center">No templates found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

        </Box>
    );
};
