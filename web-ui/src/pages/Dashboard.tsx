import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Snackbar,
  Alert,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { PickerDay } from "@mui/x-date-pickers";
import type { PickerDayProps } from "@mui/x-date-pickers";
import { Badge } from "@mui/material";
import { mockDeadlines } from "../stubs/deadlines";
import { SubmissionModal } from "../components/SubmissionModal";
import { useAuth } from "../contexts/AuthContext";
import { isSameDay } from "date-fns";

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
    reviewMode: string,
    //file: File | null,
  ) => {
    try {
      const token = sessionStorage.getItem("access_token");
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Map "double-blind" -> "DOUBLE_BLIND", etc.
      const mappedReviewType = reviewMode.toUpperCase().replace("-", "_");

      const response = await fetch("/api/configuration/", {
        method: "POST",
        headers,
        body: JSON.stringify({
          title,
          reviewProcessType: mappedReviewType,
          authorIds: [user?.id],
          numberOfExaminers: 1,
          evaluationCriteria: [],
          criteriaVisibleToAuthor: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create configuration: ${response.status} ${errorText}`,
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
          authorName={user?.username ?? ""}
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
