import React from 'react';
import {
  Alert,
  Avatar,
  Box,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemText,
  Paper,
  Skeleton,
  Typography
} from '@mui/material';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import {useNavigate} from 'react-router-dom';
import {formatDateTime} from '../utils/date';
import {useAuth} from '../contexts/AuthContext';
import {useAssignments} from '../hooks/useAssignments';
import {filterByStatus, StatusFilter} from '../components/StatusFilter';
import type {SortDirection, SortOption} from '../components/SortControl';
import {SortControl, sortItems} from '../components/SortControl';
import {configApiClient, submissionApiClient} from '../api/clients';
import {useWorkflowPlugins} from '../hooks/useWorkflowPlugins';

export const Assignments: React.FC = () => {
  const navigate = useNavigate();
  const { assignments, loading, error } = useAssignments();
  const { user } = useAuth();
  const [selectedStatuses, setSelectedStatuses] = React.useState<string[]>([]);

  const sortOptions: SortOption[] = [
    {label: 'Last Updated', value: 'updateTime'},
    {label: 'Creation Date', value: 'createdAt'},
    {label: 'Status', value: 'status'},
    {label: 'Title', value: 'title'},
  ];
  const [sortBy, setSortBy] = React.useState<string>('updateTime');
  const [sortDir, setSortDir] = React.useState<SortDirection>('desc');

  const initialized = React.useRef(false);

  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const hasAccess = roles.includes('admin') || roles.includes('reviewer');

  if (!hasAccess) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          My Assignments
        </Typography>
        <Alert severity="error">
          You are not authorized to view this page. This area is restricted to Administrators and Reviewers.
        </Alert>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error.message}</Alert>
      </Box>
    );
  }

  const {types} = useWorkflowPlugins();
  const [enrichedAssignments, setEnrichedAssignments] = React.useState<any[]>([]);
  const [enriching, setEnriching] = React.useState(true);

  React.useEffect(() => {
    if (loading) {
      setEnriching(true);
      return;
    }
    if (assignments.length === 0) {
      setEnrichedAssignments([]);
      setEnriching(false);
      return;
    }
    const fetchDetails = async () => {
      setEnriching(true);
      try {
        const enriched = await Promise.all(assignments.map(async (assignment) => {
          let title = `Submission ID: ${assignment.submissionId}`;
          let reviewProcessType = 'Unknown';
          let updateTime = assignment.assignedAt;
          let createdAt = new Date().toISOString();
            let status = 'Assigned';
            try {
                const subRes = await submissionApiClient.submissions.getSubmission(assignment.submissionId);
                if (subRes && (subRes as any).data && (subRes as any).data.status) {
                    const subData = (subRes as any).data;
                    if (subData.status === 'SUBMITTED') {
                        status = 'Submitted';
                    } else if (subData.status === 'READY_FOR_REVIEW') {
                        status = 'Ready for Review';
                    } else if (subData.status === 'WAITING_FOR_SUBMISSION') {
                        status = 'Waiting for Submission';
                    }
                    if (subData.updatedAt) {
                        const subDate = new Date(subData.updatedAt);
                        const updateDate = new Date(updateTime);
                        if (subDate > updateDate) {
                            updateTime = subData.updatedAt;
                        }
                    }
                }
            } catch (e) {
                // ignore
            }

          try {
            const res = await configApiClient.submissions.submissionsDetail(assignment.submissionId, {format: 'json'});
            if (res && (res as any).data) {
              const data = (res as any).data;
              title = data.title || title;
              reviewProcessType = data.reviewProcessType || reviewProcessType;
              if (data.createdAt) {
                createdAt = data.createdAt;
                const configDate = new Date(data.createdAt);
                const updateDate = new Date(updateTime);
                if (configDate > updateDate) {
                  updateTime = data.createdAt;
                }
              }
            }
          } catch (e) {
            console.error('Failed to fetch config for', assignment.submissionId);
          }
          return {
            ...assignment,
            title,
            reviewProcessType,
            updateTime,
            createdAt,
              status
          };
        }));
        setEnrichedAssignments(enriched);
        if (!initialized.current && enriched.length > 0) {
          setSelectedStatuses(Array.from(new Set(enriched.map(a => a.status))));
          initialized.current = true;
        }
      } catch (e) {
        console.error(e);
      } finally {
        setEnriching(false);
      }
    };
    fetchDetails();
  }, [assignments, loading]);

  const availableStatuses = Array.from(new Set(enrichedAssignments.map(a => a.status))).sort();
  const filteredAssignments = filterByStatus(enrichedAssignments, selectedStatuses);
  const finalAssignments = sortItems(filteredAssignments, sortBy, sortDir);

  const formatSubheading = (assignment: any) => {
    const plugin = types.find(p => p.name === assignment.reviewProcessType);
    const type = plugin ? plugin.title : (assignment.reviewProcessType || 'Unknown');
    const datetime = formatDateTime(assignment.updateTime, 'PPPp');
    return (
        <Box component="span">
          <Box component="span" sx={{fontWeight: 600}}>Last Update:</Box> {datetime} | <Box component="span"
                                                                                            sx={{fontWeight: 600}}>Review
          Type:</Box> {type}
        </Box>
    );
  };

  const renderSkeleton = () => (
      <List>
        {[1, 2, 3].map((item) => (
            <ListItem key={item} disablePadding divider>
              <Box sx={{p: 2, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <Box sx={{flex: 1, mr: 2}}>
                  <Skeleton variant="text" width="40%" height={28}/>
                  <Skeleton variant="text" width="60%" height={20}/>
                </Box>
                <Skeleton variant="rectangular" width={80} height={24} sx={{borderRadius: 1}}/>
              </Box>
            </ListItem>
        ))}
      </List>
  );

  return (
    <Box>
      <Box sx={{mb: 4}}>
        <Typography variant="h4" gutterBottom>
          My Assignments
        </Typography>
        <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start'}}>
          <Box sx={{flexGrow: 1}}>
            <StatusFilter
                availableStatuses={availableStatuses}
                selectedStatuses={selectedStatuses}
                onChange={setSelectedStatuses}
            />
          </Box>
          <Box sx={{ml: 'auto', mb: 2}}>
            <SortControl
                options={sortOptions}
                value={sortBy}
                onChange={setSortBy}
                direction={sortDir}
                onDirectionChange={setSortDir}
            />
          </Box>
        </Box>
        <Paper>
          {(loading || enriching) ? renderSkeleton() : finalAssignments.length === 0 ? (
              <Box sx={{p: 3}}>
                <Typography color="text.secondary">
                  {assignments.length === 0 ? "You have no assignments at the moment." : "No assignments found matching the criteria."}
                </Typography>
              </Box>
          ) : (
              <List>
                {finalAssignments.map((assignment, index) => (
                    <ListItem key={assignment.submissionId} disablePadding
                              divider={index < finalAssignments.length - 1}>
                      <ListItemButton onClick={() => navigate(`/assignments/${assignment.submissionId}`)}>
                        <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: {xs: 'flex-start', sm: 'center'},
                              flexDirection: {xs: 'column', sm: 'row'},
                              gap: 2,
                              width: '100%',
                            }}
                        >
                          <ListItemAvatar sx={{display: {xs: 'none', sm: 'block'}}}>
                            <Avatar sx={{bgcolor: 'primary.main', color: 'primary.contrastText', mr: 2}}>
                              <AssignmentOutlinedIcon/>
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                              primary={
                                <Typography variant="subtitle1" color="text.primary"
                                            sx={{fontWeight: 500, mb: 1, lineHeight: 1.2}}>
                                  {assignment.title}
                                </Typography>
                              }
                              secondary={
                                <Typography variant="body1" color="text.secondary" sx={{fontWeight: 500}}>
                                  {formatSubheading(assignment)}
                                </Typography>
                              }
                          />
                          <Chip
                              label={assignment.status}
                              color={assignment.status === 'Assigned' ? 'info' : 'default'}
                              size="small"
                          />
                        </Box>
                      </ListItemButton>
                    </ListItem>
                ))}
              </List>
          )}
        </Paper>
      </Box>
    </Box>
  );
};
