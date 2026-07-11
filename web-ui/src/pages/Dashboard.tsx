import React, {useEffect, useState} from "react";
import {
    Alert,
    Badge,
    Box,
    Button,
    Chip,
    CircularProgress,
    List,
    ListItem,
    ListItemButton,
    ListItemText,
    Paper,
    Snackbar,
    Typography,
} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {DateCalendar} from "@mui/x-date-pickers/DateCalendar";
import type {PickerDayProps} from "@mui/x-date-pickers";
import {PickerDay} from "@mui/x-date-pickers";
import {SubmissionModal} from "../components/SubmissionModal";
import {useAuth} from "../contexts/AuthContext";
import {isSameDay, startOfDay} from "date-fns";
import {configApiClient, matchingApiClient, submissionApiClient, responseApiClient} from "../api/clients";

type TaskType = "Submission" | "Assignment";

interface Task {
  id: string;
  title: string;
  type: TaskType;
  dueDate: Date;
  submissionId: string;
}

function ServerDay(props: PickerDayProps & { highlightedDays?: Date[] }) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;
  const isSelected =
    !outsideCurrentMonth &&
    highlightedDays.some((d: Date) => isSameDay(d, day));

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={isSelected ? "📅" : undefined}
    >
      <PickerDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
      />
    </Badge>
  );
}

const mapAuthorSubmission = (config: any, index: number): Task | null => {
    const subId = (config as any).id || (config as any).submissionId || `sub-${index}`;
    if (!config.submissionDeadline) return null;
    return {
        id: `sub-${subId}`,
        title: config.title,
        type: "Submission",
        dueDate: new Date(config.submissionDeadline),
        submissionId: subId,
    };
};

const fetchAuthorSubmissions = async (userId: string): Promise<Task[]> => {
    try {
        const res = await configApiClient.submissions.authorDetail(userId);
        if (res.data && Array.isArray(res.data)) {
            return res.data.map(mapAuthorSubmission).filter((t): t is Task => t !== null);
        }
    } catch (e) {
        console.error("Failed to fetch author configurations", e);
    }
    return [];
};

const fetchAssignmentConfig = async (assignment: any): Promise<Task | null> => {
    try {
        const configResponse = await configApiClient.submissions.submissionsDetail(assignment.submissionId);
        if (configResponse.data && configResponse.data.reviewDeadline) {
            return {
                id: `ass-${assignment.submissionId}`,
                title: configResponse.data.title,
                type: "Assignment",
                dueDate: new Date(configResponse.data.reviewDeadline),
                submissionId: assignment.submissionId,
            };
        }
    } catch (err) {
        console.error(`Failed to fetch config for assignment ${assignment.submissionId}`, err);
    }
    return null;
};

const processAssignments = async (assignments: any[]): Promise<Task[]> => {
    const tasks: Task[] = [];
    for (const assignment of assignments) {
        const task = await fetchAssignmentConfig(assignment);
        if (task) tasks.push(task);
    }
    return tasks;
};

const fetchReviewerAssignments = async (username: string): Promise<Task[]> => {
    try {
        const res = await matchingApiClient.matches.getMatchesByExaminer(username);
        if (!res.data || !res.data.assignments) return [];
        return await processAssignments(res.data.assignments);
    } catch (e) {
        console.error("Failed to fetch assignments", e);
        return [];
    }
};

const isSubmissionIncomplete = async (submissionId: string): Promise<boolean> => {
    try {
        const subRes = await submissionApiClient.submissions.getSubmission(submissionId) as any;
        const status = subRes?.data?.status;
        if (!status) return true;
        return status === 'WAITING_FOR_SUBMISSION' || status === 'DRAFT';
    } catch (e) {
        return true;
    }
};

const isAssignmentIncomplete = async (submissionId: string, userId: string): Promise<boolean> => {
    try {
        const resResult = await responseApiClient.results.resultsDetail(submissionId);
        if (!resResult.data || !Array.isArray(resResult.data)) return true;
        const hasReviewed = resResult.data.some((r: any) => r.reviewerId === userId);
        return !hasReviewed;
    } catch (e) {
        return true;
    }
};

const filterIncompleteTasks = async (tasks: Task[], userId: string): Promise<Task[]> => {
    const incompleteTasks: Task[] = [];
    for (const task of tasks) {
        let isIncomplete = false;
        if (task.type === 'Submission') {
            isIncomplete = await isSubmissionIncomplete(task.submissionId);
        } else {
            isIncomplete = await isAssignmentIncomplete(task.submissionId, userId);
        }
        if (isIncomplete) incompleteTasks.push(task);
    }
    return incompleteTasks;
};

const buildSubmissionPayload = (
    title: string,
    reviewType: string,
    authorIds: string[],
    reviewTemplateType: string,
    numberOfExaminers: number,
    submissionDeadline: Date,
    reviewDeadline: Date,
    topicTag: string,
    customReviewerIds: string[],
    userId?: string
) => {
    const finalAuthorIds = authorIds.length > 0 ? authorIds : [userId || ""];
    return {
        title,
        reviewProcessType: reviewType,
        authorIds: finalAuthorIds,
        reviewTemplateType,
        numberOfExaminers,
        submissionDeadline: submissionDeadline.toISOString(),
        reviewDeadline: reviewDeadline.toISOString(),
        topicTag,
        customReviewerIds,
    };
};

const handleTaskClick = (task: Task, navigate: ReturnType<typeof useNavigate>) => {
    navigate(
        task.type === "Assignment"
            ? `/assignments/${task.submissionId}`
            : `/submissions/${task.submissionId}`
    );
};

const TaskItem: React.FC<{ task: Task, navigate: ReturnType<typeof useNavigate> }> = ({ task, navigate }) => (
    <ListItem key={task.id} disablePadding divider>
        <ListItemButton onClick={() => handleTaskClick(task, navigate)}>
            <ListItemText
                primary={
                    <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                        {task.title}
                        <Chip
                            label={task.type}
                            size="small"
                            color={task.type === "Submission" ? "primary" : "secondary"}
                        />
                    </Box>
                }
                secondary={`Due: ${task.dueDate.toLocaleDateString()}`}
            />
        </ListItemButton>
    </ListItem>
);

const TaskListContent: React.FC<{ tasks: Task[], loading: boolean, navigate: ReturnType<typeof useNavigate> }> = ({ tasks, loading, navigate }) => {
    if (loading) {
        return (
            <Box sx={{display: "flex", justifyContent: "center", p: 4}}>
                <CircularProgress/>
            </Box>
        );
    }
    if (tasks.length === 0) {
        return (
            <Typography variant="body1" color="text.secondary">
                You have no upcoming tasks.
            </Typography>
        );
    }
    return (
        <List>
            {tasks.map((task) => (
                <TaskItem key={task.id} task={task} navigate={navigate} />
            ))}
        </List>
    );
};

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const roles = (user?.roles || []).map((r) => r.toLowerCase());
  const hasAuthorOrAdminRole =
    roles.includes("admin") || roles.includes("author") || roles.includes("teacher") || roles.includes("examinationofficer");

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let fetchedTasks: Task[] = [];

      if (hasAuthorOrAdminRole) {
        const authorTasks = await fetchAuthorSubmissions(user.id);
        fetchedTasks = fetchedTasks.concat(authorTasks);
      }

      if (roles.includes("reviewer")) {
        const reviewerTasks = await fetchReviewerAssignments(user.username);
        fetchedTasks = fetchedTasks.concat(reviewerTasks);
      }

      const incompleteTasks = await filterIncompleteTasks(fetchedTasks, user.id);

      const now = startOfDay(new Date());
      const validTasks = incompleteTasks.filter((t) => t.dueDate >= now);
      validTasks.sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

      setTasks(validTasks.slice(0, 5));
    } catch (err) {
      console.error("Error aggregating tasks", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const deadlineDates = tasks.map((t) => t.dueDate);

  const handleSubmission = async (
    title: string,
    reviewType: string,
    authorIds: string[],
    reviewTemplateType: string,
    numberOfExaminers: number,
    submissionDeadline: Date,
    reviewDeadline: Date,
    topicTag: string,
    customReviewerIds: string[]
  ) => {
    try {
      const payload = buildSubmissionPayload(
        title, reviewType, authorIds, reviewTemplateType, numberOfExaminers,
        submissionDeadline, reviewDeadline, topicTag, customReviewerIds, user?.id
      );
      const response = await configApiClient.submissions.submissionsCreate(payload);

      if (!response.ok) {
        throw new Error(
            `Failed to create configuration: ${response.status} ${response.statusText}`
        );
      }

      // Removed eager createSubmission call as AI flag is no longer supported automatically

      setSnackbarOpen(true);
      fetchTasks(); // Refresh tasks after a new submission
    } catch (err) {
      console.error("Submission failed:", err);
      throw err;
    }
  };

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 4,
        }}
      >
        <Typography variant="h4">Welcome, {user?.username}</Typography>
        {hasAuthorOrAdminRole && (
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => setModalOpen(true)}
          >
            {roles.includes('teacher') ? 'Create submission for someone else' : 'Create Submission'}
          </Button>
        )}
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 4,
        }}
      >
        <Box sx={{ flex: 2 }}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Your Tasks
            </Typography>
            <TaskListContent tasks={tasks} loading={loading} navigate={navigate} />
          </Paper>
        </Box>

        <Box sx={{ flex: 1 }}>
          <Paper
            sx={{
              p: 2,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" gutterBottom>
              Deadlines
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateCalendar
                slots={{ day: ServerDay }}
                slotProps={{
                  day: { highlightedDays: deadlineDates } as any,
                }}
              />
            </LocalizationProvider>
          </Paper>
        </Box>
      </Box>

      {hasAuthorOrAdminRole && (
        <SubmissionModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmission}
          authorName={user?.username || ""}
          currentUserId={user?.id || ""}
        />
      )}

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{ mt: 8 }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          Submission created successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};
