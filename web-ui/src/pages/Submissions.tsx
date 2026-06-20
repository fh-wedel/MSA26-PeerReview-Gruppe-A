import React, {useEffect, useState} from 'react';
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
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import {useNavigate} from 'react-router-dom';
import {useAuth} from '../contexts/AuthContext';
import {configApiClient, matchingApiClient, submissionApiClient} from '../api/clients';
import {filterByStatus, StatusFilter} from '../components/StatusFilter';
import type {SortDirection, SortOption} from '../components/SortControl';
import {SortControl, sortItems} from '../components/SortControl';
import {useWorkflowPlugins} from '../hooks/useWorkflowPlugins';
import {formatDateTime} from '../utils/date';

export const Submissions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mySelectedStatuses, setMySelectedStatuses] = useState<string[]>([]);
  const [allSelectedStatuses, setAllSelectedStatuses] = useState<string[]>([]);
  const {types} = useWorkflowPlugins();

  const sortOptions: SortOption[] = [
    {label: 'Last Updated', value: 'updateTime'},
    {label: 'Creation Date', value: 'createdAt'},
    {label: 'Status', value: 'status'},
    {label: 'Title', value: 'title'},
  ];
  const [mySortBy, setMySortBy] = useState<string>('updateTime');
  const [mySortDir, setMySortDir] = useState<SortDirection>('desc');
  const [allSortBy, setAllSortBy] = useState<string>('updateTime');
  const [allSortDir, setAllSortDir] = useState<SortDirection>('desc');

  const roles = (user?.roles || []).map(r => r.toLowerCase());
  const hasAccess = roles.includes('admin') || roles.includes('examinationofficer') || roles.includes('author');
  const hasOverviewAccess = roles.includes('admin') || roles.includes('examinationofficer');

  if (!hasAccess) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Submissions
        </Typography>
        <Alert severity="error">
          You are not authorized to view this page. This area is restricted to Administrators, Examination Officers, and Authors.
        </Alert>
      </Box>
    );
  }

  const [mySubmissions, setMySubmissions] = useState<any[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !hasAccess) return;

    const fetchSubmissionsData = async () => {
      setLoading(true);
      try {
        let myConfigs: any[] = [];
        let allConfigs: any[] = [];

        // Fetch user's own submissions
        const myRes = await configApiClient.submissions.authorDetail(user.id, {format: 'json'});
        myConfigs = (myRes as any).data || [];

        // Fetch all submissions if admin/exam officer
        if (hasOverviewAccess) {
          const allRes = await configApiClient.submissions.submissionsList({format: 'json'});
          allConfigs = (allRes as any).data || [];
        }

        const mapConfigToDisplay = async (config: any) => {
          const id = config.id || config.submissionId;
          let status = 'Created';
          let reviewerId: string | undefined = undefined;
          let matchedAt: string | undefined = undefined;

          try {
            const matchRes = await matchingApiClient.matches.getMatchesBySubmission(id);
            const matchData: any = (matchRes as any).data;
            if (matchData) {
              if (matchData.status === 'MATCHED') {
                status = 'Matched';
                reviewerId = matchData.matches?.[0]?.examinerId;
                matchedAt = matchData.matchedAt;
              } else if (matchData.status === 'FAILED') {
                status = 'Failed';
                matchedAt = matchData.matchedAt;
              }
            }
          } catch (e) {
            // Not matched yet or 404
          }

          let submissionUpdatedAt: string | undefined = undefined;
          try {
            const subRes = await submissionApiClient.submissions.getSubmission(id);
            if (subRes && (subRes as any).data && (subRes as any).data.status) {
              const subData = (subRes as any).data;
              if (subData.status === 'SUBMITTED') {
                status = 'Submitted';
              } else if (subData.status === 'READY_FOR_REVIEW') {
                status = 'Ready for Review';
              } else if (subData.status === 'WAITING_FOR_SUBMISSION') {
                status = 'Waiting for Submission';
              } else if (subData.status === 'DRAFT') {
                status = 'Draft';
              }
              submissionUpdatedAt = subData.updatedAt;
            }
          } catch (e) {
            // No submission yet
          }

            if (!config.createdAt) {
                throw new Error(`Submission ${id} is missing a creation date from the backend.`);
            }

          let updateTime = config.createdAt;
          if (matchedAt) {
            const matchDate = new Date(matchedAt);
            const updateDate = new Date(updateTime);
            if (matchDate > updateDate) {
              updateTime = matchedAt;
            }
          }
          if (submissionUpdatedAt) {
            const subDate = new Date(submissionUpdatedAt);
            const updateDate = new Date(updateTime);
            if (subDate > updateDate) {
              updateTime = submissionUpdatedAt;
            }
          }

          return {
            id,
            title: config.title || 'Untitled',
            createdAt: config.createdAt,
            updateTime,
            status,
            reviewerId,
            reviewProcessType: config.reviewProcessType,
            numberOfExaminers: config.numberOfExaminers
          };
        };

        const myParsed = await Promise.all(myConfigs.map(mapConfigToDisplay));
        setMySubmissions(myParsed);
        setMySelectedStatuses(Array.from(new Set(myParsed.map(s => s.status))));

        if (hasOverviewAccess) {
          const allParsed = await Promise.all(allConfigs.map(mapConfigToDisplay));
          setAllSubmissions(allParsed);
          setAllSelectedStatuses(Array.from(new Set(allParsed.map(s => s.status))));
        }
      } catch (err) {
        console.error('Error fetching submissions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissionsData();
  }, [user, hasAccess, hasOverviewAccess]);

  const availableMyStatuses = Array.from(new Set(mySubmissions.map(s => s.status))).sort();
  const availableAllStatuses = Array.from(new Set(allSubmissions.map(s => s.status))).sort();

  const filteredMySubmissions = filterByStatus(mySubmissions, mySelectedStatuses);
  const finalMySubmissions = sortItems(filteredMySubmissions, mySortBy, mySortDir);

  const filteredAllSubmissions = filterByStatus(allSubmissions, allSelectedStatuses);
  const finalAllSubmissions = sortItems(filteredAllSubmissions, allSortBy, allSortDir);

  const formatSubheading = (submission: any) => {
    const plugin = types.find(p => p.name === submission.reviewProcessType);
    const type = plugin ? plugin.title : (submission.reviewProcessType || 'Unknown');
    const datetime = submission.updateTime ? formatDateTime(submission.updateTime, 'PPPp') : 'Unknown';
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
          <Box sx={{ p: 2, width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ flex: 1, mr: 2 }}>
              <Skeleton variant="text" width="40%" height={28} />
              <Skeleton variant="text" width="60%" height={20} />
            </Box>
            <Skeleton variant="rectangular" width={80} height={24} sx={{ borderRadius: 1 }} />
          </Box>
        </ListItem>
      ))}
    </List>
  );

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          My Submissions
        </Typography>
        <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start'}}>
          <Box sx={{flexGrow: 1}}>
            <StatusFilter
                availableStatuses={availableMyStatuses}
                selectedStatuses={mySelectedStatuses}
                onChange={setMySelectedStatuses}
            />
          </Box>
          <Box sx={{ml: 'auto', mb: 2}}>
            <SortControl
                options={sortOptions}
                value={mySortBy}
                onChange={setMySortBy}
                direction={mySortDir}
                onDirectionChange={setMySortDir}
            />
          </Box>
        </Box>
        <Paper>
          {loading ? renderSkeleton() : finalMySubmissions.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary">
                {mySubmissions.length === 0 ? "You have no submissions." : "No submissions found matching the criteria."}
              </Typography>
            </Box>
          ) : (
            <List>
              {finalMySubmissions.map((submission, index) => (
                <ListItem key={submission.id} disablePadding divider={index < finalMySubmissions.length - 1}>
                  <ListItemButton onClick={() => navigate(`/submissions/${submission.id}`)}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        width: '100%',
                      }}
                    >
                      <ListItemAvatar sx={{ display: { xs: 'none', sm: 'block' } }}>
                        <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', mr: 2 }}>
                          <ArticleOutlinedIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 500, mb: 1, lineHeight: 1.2 }}>
                            {submission.title}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body1" color="text.secondary" sx={{fontWeight: 500}}>
                            {formatSubheading(submission)}
                          </Typography>
                        }
                      />
                      <Chip
                        label={submission.status}
                        color={submission.status === 'Failed' ? 'error' : submission.status === 'Published' ? 'success' : submission.status === 'Under Review' ? 'warning' : 'default'}
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

      {hasOverviewAccess && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4">
              Submissions Overview
            </Typography>
          </Box>

          <Box sx={{display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start'}}>
            <Box sx={{flexGrow: 1}}>
              <StatusFilter
                  availableStatuses={availableAllStatuses}
                  selectedStatuses={allSelectedStatuses}
                  onChange={setAllSelectedStatuses}
              />
            </Box>
            <Box sx={{ml: 'auto', mb: 2}}>
              <SortControl
                  options={sortOptions}
                  value={allSortBy}
                  onChange={setAllSortBy}
                  direction={allSortDir}
                  onDirectionChange={setAllSortDir}
              />
            </Box>
          </Box>

          <Paper>
            {loading ? renderSkeleton() : finalAllSubmissions.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <Typography color="text.secondary">No submissions found matching the criteria.</Typography>
              </Box>
            ) : (
              <List>
                {finalAllSubmissions.map((submission, index) => (
                  <ListItem key={submission.id} disablePadding divider={index < finalAllSubmissions.length - 1}>
                    <ListItemButton onClick={() => navigate(`/submissions/${submission.id}`)}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: 2,
                          width: '100%',
                        }}
                      >
                        <ListItemAvatar sx={{ display: { xs: 'none', sm: 'block' } }}>
                          <Avatar sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', mr: 2 }}>
                            <ArticleOutlinedIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 600, mb: 0.5, lineHeight: 1.2 }}>
                              {submission.title}
                            </Typography>
                          }
                          secondary={
                            <Typography variant="body1" color="text.secondary" sx={{fontWeight: 500}}>
                              {formatSubheading(submission)}
                            </Typography>
                          }
                        />
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {!submission.reviewerId && (
                            <Chip label="Needs Reviewer" color="error" size="small" variant="outlined" />
                          )}
                          <Chip
                            label={submission.status}
                            color={submission.status === 'Failed' ? 'error' : submission.status === 'Published' ? 'success' : submission.status === 'Under Review' ? 'warning' : 'default'}
                            size="small"
                          />
                        </Box>
                      </Box>
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </>
      )}
    </Box>
  );
};
