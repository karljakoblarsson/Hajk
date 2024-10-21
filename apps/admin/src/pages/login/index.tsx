import React, { useState } from "react";
import Grid from "@mui/material/Grid2";
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Paper,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import useAppStateStore from "../../store/use-app-state-store";

export default function LoginPage() {
  const { t } = useTranslation();
  const { apiBaseUrl } = useAppStateStore.getState();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const csrfResponse = await fetch(`${apiBaseUrl}/auth/csrf`, {
      credentials: "include",
    });
    const { csrfToken } = (await csrfResponse.json()) as { csrfToken: string };

    const body = new FormData();
    body.set("email", email);
    body.set("password", password);
    body.set("csrfToken", csrfToken);

    const loginResponse = await fetch(
      `${apiBaseUrl}/auth/callback/credentials`,
      {
        method: "POST",
        body,
        credentials: "include",
      }
    );

    const data = (await loginResponse.json()) as { email: string };

    if (loginResponse.ok) {
      console.log("Login successful:", data);
    } else {
      console.error("Login failed:", data);
    }

    //signIn("credentials", { username: "jsmith", password: "1234" });
  };

  return (
    <Grid
      sx={{
        height: "70vh",
        width: "100%",
        justifyContent: "center",
        alignContent: "center",
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper elevation={3} sx={{ padding: 3 }}>
          <Typography variant="h5" component="h1" gutterBottom>
            {t("common.login")}
          </Typography>
          <form onSubmit={(e) => void handleSubmit(e)}>
            <Box mb={2}>
              <TextField
                fullWidth
                variant="outlined"
                label={t("common.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Box>
            <Box mb={2}>
              <TextField
                fullWidth
                variant="outlined"
                label={t("common.password")}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Box>
            <Button type="submit" fullWidth variant="contained" color="primary">
              {t("common.login")}
            </Button>
          </form>
        </Paper>
      </Container>
    </Grid>
  );
}
