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
  Typography
} from '@mui/material';
import {Extension, Group} from '@mui/icons-material';
import {fetchWorkflowPlugins, searchUsers, type WorkflowPlugin} from '../api/communication';
import {useAuth} from '../contexts/AuthContext';
import {Navigate} from 'react-router-dom';

export const Admin: React.FC = () => {
    const {user} = useAuth();
    const [userCount, setUserCount] = useState<number | null>(null);
    const [plugins, setPlugins] = useState<WorkflowPlugin[] | null>(null);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [loadingPlugins, setLoadingPlugins] = useState(true);

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

        // Fetch plugins
        fetchWorkflowPlugins()
            .then(fetchedPlugins => {
                setPlugins(fetchedPlugins);
            })
            .catch(err => {
                console.error('Failed to fetch plugins', err);
                setPlugins([]);
            })
            .finally(() => setLoadingPlugins(false));
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
                                        {plugins?.length || 0}
                                    </Typography>
                                )}
                            </Box>
                        </CardContent>
                    </Card>
                </Box>
            </Box>

            {/* Active Workflow Plugins Table */}
            <Typography variant="h5" sx={{fontWeight: 'bold', mb: 2}}>
                Workflow Plugins Configuration
            </Typography>

            <TableContainer component={Paper} elevation={3} sx={{borderRadius: 2, overflow: 'hidden'}}>
                <Table>
                    <TableHead sx={{bgcolor: 'background.default'}}>
                        <TableRow>
                            <TableCell sx={{fontWeight: 'bold', width: '25%'}}>Plugin Name</TableCell>
                            <TableCell sx={{fontWeight: 'bold', width: '25%'}}>Title</TableCell>
                            <TableCell sx={{fontWeight: 'bold', width: '50%'}}>Description</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loadingPlugins ? (
                            // Skeleton Loader for Table
                            Array.from(new Array(3)).map((_, index) => (
                                <TableRow key={index}>
                                    <TableCell><Skeleton variant="text"/></TableCell>
                                    <TableCell><Skeleton variant="text"/></TableCell>
                                    <TableCell><Skeleton variant="text"/></TableCell>
                                </TableRow>
                            ))
                        ) : plugins && plugins.length > 0 ? (
                            plugins.map((plugin) => (
                                <TableRow key={plugin.name} hover>
                                    <TableCell>
                                        <Typography variant="body2" sx={{
                                            fontFamily: 'monospace',
                                            bgcolor: 'action.hover',
                                            p: 0.5,
                                            borderRadius: 1,
                                            display: 'inline-block'
                                        }}>
                                            {plugin.name}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>{plugin.title}</TableCell>
                                    <TableCell>{plugin.description}</TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{py: 3}}>
                                    <Typography variant="body1" color="text.secondary">
                                        No active workflow plugins found.
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};
