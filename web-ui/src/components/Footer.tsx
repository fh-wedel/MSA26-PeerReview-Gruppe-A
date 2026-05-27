import React from 'react';
import {Box, Container, Link, Stack, Typography} from '@mui/material';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          sx={{ justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} Peer Review System · Fachhochschule Wedel
          </Typography>
          <Stack direction="row" spacing={2}>
            <Link
              href="https://www.fh-wedel.de"
              target="_blank"
              rel="noopener noreferrer"
              color="text.secondary"
              underline="hover"
              variant="body2"
            >
              FH Wedel
            </Link>
              <Link
                  href="https://github.com/fh-wedel/MSA26-PeerReview-Gruppe-A"
                  target="_blank"
                  rel="noopener noreferrer"
                  color="text.secondary"
                  underline="hover"
                  variant="body2">
                  GitHub
              </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};
