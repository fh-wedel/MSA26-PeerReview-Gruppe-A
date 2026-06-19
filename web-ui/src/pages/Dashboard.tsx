import React, {useState} from "react";
import {Alert, Badge, Box, Button, List, ListItem, ListItemText, Paper, Snackbar, Typography,} from "@mui/material";
import {LocalizationProvider} from "@mui/x-date-pickers/LocalizationProvider";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import {DateCalendar} from "@mui/x-date-pickers/DateCalendar";
import type {PickerDayProps} from "@mui/x-date-pickers";
import {PickerDay} from "@mui/x-date-pickers";
import {mockDeadlines} from "../stubs/deadlines";
import {SubmissionModal} from "../components/SubmissionModal";
import {useAuth} from "../contexts/AuthContext";
import {isSameDay} from "date-fns";
import {configApiClient} from "../api/clients";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const deadlineDates = mockDeadlines.map((d) => d.date);

  const roles = (user?.roles || []).map((r) => r.toLowerCase());
  const hasAuthorOrAdminRole =
    roles.includes("admin") || roles.includes("author");

  const handleSubmission = async (
    title: string,
    reviewType: string,
    authorIds: string[],
  ) => {
    try {
        const response = await configApiClient.postRoot({
            title,
            reviewProcessType: reviewType,
            authorIds: authorIds.length > 0 ? authorIds : [user?.id || ''],
      });

      if (!response.ok) {
        throw new Error(
            `Failed to create configuration: ${response.status} ${response.statusText}`,
        );
      }

      setSnackbarOpen(true);
    } catch (err) {
      console.error("Submission failed:", err);
      throw err; // Re-throw to be caught by SubmissionModal's error state
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
              Your Active Assignments
            </Typography>
            <List>
              {mockDeadlines.map((deadline) => (
                <ListItem key={deadline.id} divider>
                  <ListItemText
                    primary={deadline.title}
                    secondary={`Due: ${deadline.date.toLocaleDateString()}`}
                  />
                </ListItem>
              ))}
            </List>
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
          isAdminOrOfficer={roles.includes("admin") || roles.includes("examinationofficer")}
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
