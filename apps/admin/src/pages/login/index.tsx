import React, { useState } from "react";
import Grid from "@mui/material/Grid2";
import { Box, Button, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import useAppStateStore from "../../store/use-app-state-store";

export default function LoginPage() {
  const { t } = useTranslation();
  const { apiBaseUrl } = useAppStateStore.getState();
  const [csrfToken, setCsrfToken] = useState("");

  React.useEffect(() => {
    const x = async () => {
      const csrfResponse = await fetch(
        `${apiBaseUrl}/auth/csrf?callbackUrl=${window.location.origin}`,
        {
          credentials: "include",
        }
      );
      const { csrfToken } = (await csrfResponse.json()) as {
        csrfToken: string;
      };

      setCsrfToken(csrfToken);
    };

    void x();
  }, [apiBaseUrl]);

  return (
    <Grid
      sx={{
        height: "70vh",
        width: "100%",
        justifyContent: "center",
        alignContent: "center",
      }}
    >
      <Box
        component="form"
        action={`${apiBaseUrl}/auth/callback/credentials`}
        method="POST"
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          maxWidth: 400,
          margin: "0 auto",
          padding: 3,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: "background.paper",
        }}
      >
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <Typography variant="h4" align="center">
          {t("common.welcome")}
        </Typography>
        <Typography align="center" gutterBottom>
          {t("common.loginToContinue")}
        </Typography>
        <TextField
          required
          label={t("common.email")}
          name="email"
          id="input-email-for-credentials-provider"
          type="email"
          variant="outlined"
          fullWidth
        />
        <TextField
          required
          label={t("common.password")}
          name="password"
          id="input-password-for-credentials-provider"
          type="password"
          variant="outlined"
          fullWidth
        />
        <Button
          id="submitButton"
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          fullWidth
          sx={{ mt: 2 }}
        >
          {t("common.login")}
        </Button>
      </Box>
    </Grid>
  );
}
