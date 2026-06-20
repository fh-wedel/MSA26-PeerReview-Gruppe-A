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
import {configApiClient, matchingApiClient} from "../api/clients";

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

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const roles = (user?.roles || []).map((r) => r.toLowerCase());
  const hasAuthorOrAdminRole =
    roles.includes("admin") || roles.includes("author");

  const fetchTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const fetchedTasks: Task[] = [];
      const now = startOfDay(new Date());

      // 1. Fetch own submissions
      if (hasAuthorOrAdminRole) {
        try {
            const submissionsResponse = await configApiClient.submissions.authorDetail(user.id);
          if (submissionsResponse.data && Array.isArray(submissionsResponse.data)) {
              submissionsResponse.data.forEach((config: any, index: number) => {
              const subId = (config as any).id || (config as any).submissionId || `sub-${index}`;
              if (config.submissionDeadline) {
                fetchedTasks.push({
                  id: `sub-${subId}`,
                  title: config.title,
                  type: "Submission",
                  dueDate: new Date(config.submissionDeadline),
                  submissionId: subId,
                });
              }
            });
          }
        } catch (e) {
          console.error("Failed to fetch author configurations", e);
        }
      }

      // 2. Fetch assignments
      try {
        const assignmentsResponse = await matchingApiClient.matches.getMatchesByExaminer(user.username);
        if (assignmentsResponse.data && assignmentsResponse.data.assignments) {
          for (const assignment of assignmentsResponse.data.assignments) {
            try {
                const configResponse = await configApiClient.submissions.submissionsDetail(assignment.submissionId);
              if (configResponse.data && configResponse.data.reviewDeadline) {
                fetchedTasks.push({
                  id: `ass-${assignment.submissionId}`,
                  title: configResponse.data.title,
                  type: "Assignment",
                  dueDate: new Date(configResponse.data.reviewDeadline),
                  submissionId: assignment.submissionId,
                });
              }
            } catch (err) {
              console.error(`Failed to fetch config for assignment ${assignment.submissionId}`, err);
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch assignments", e);
      }

      // Filter and sort tasks
      const validTasks = fetchedTasks.filter((t) => t.dueDate >= now);
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
    reviewDeadline: Date
  ) => {
    try {
        const response = await configApiClient.submissions.submissionsCreate({
        title,
        reviewProcessType: reviewType,
        authorIds: authorIds.length > 0 ? authorIds : [user?.id || ""],
        reviewTemplateType,
        numberOfExaminers,
        submissionDeadline: submissionDeadline.toISOString(),
        reviewDeadline: reviewDeadline.toISOString(),
      });

      if (!response.ok) {
        throw new Error(
            `Failed to create configuration: ${response.status} ${response.statusText}`
        );
      }

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
            Create Submission
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
            {loading ? (
                <Box sx={{display: "flex", justifyContent: "center", p: 4}}>
                  <CircularProgress/>
                </Box>
            ) : tasks.length === 0 ? (
                <Typography variant="body1" color="text.secondary">
                  You have no upcoming tasks.
                </Typography>
            ) : (
                <List>
                  {tasks.map((task) => (
                      <ListItem key={task.id} disablePadding divider>
                        <ListItemButton
                            onClick={() =>
                                navigate(
                                    task.type === "Assignment"
                                        ? `/assignments/${task.submissionId}`
                                        : `/submissions/${task.submissionId}`
                                )
                            }
                        >
                          <ListItemText
                              primary={
                                <Box sx={{display: "flex", alignItems: "center", gap: 1}}>
                                  {task.title}
                                  <Chip
                                      label={task.type}
                                      size="small"
                                      color={task.type === "Submission" ? "primary" : "secondary"}
                                      variant="outlined"
                                  />
                                </Box>
                              }
                              secondary={`Due: ${task.dueDate.toLocaleDateString()}`}
                          />
                        </ListItemButton>
                      </ListItem>
                  ))}
                </List>
            )}
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
