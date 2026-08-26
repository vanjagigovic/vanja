import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { ApiError } from "../api/api-client";
import { useAuth } from "../auth/AuthProvider";

function getDefaultCalendarPath(): string {
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return `/calendar/month/${date}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) {
    return fallback;
  }

  if (error instanceof ApiError && error.details) {
    const details = error.details as {
      response?: { message?: unknown };
      message?: unknown;
    };
    const message = details.response?.message ?? details.message;

    if (Array.isArray(message)) {
      return message.join(", ");
    }

    if (typeof message === "string" && message) {
      return message;
    }
  }

  return error.message || fallback;
}

export function RegisterPage() {
  const { t } = useTranslation();
  const { register, status } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      navigate(getDefaultCalendarPath(), { replace: true });
    }
  }, [navigate, status]);

  if (status === "restoring" || status === "authenticated") {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: typeof fieldErrors = {};
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      nextErrors.email = t("authEmailRequired");
    } else if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      nextErrors.email = t("authEmailInvalid");
    }

    if (!password) {
      nextErrors.password = t("authPasswordRequired");
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = t("authConfirmPasswordRequired");
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = t("authPasswordsDoNotMatch");
    }

    setFieldErrors(nextErrors);
    setError("");

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitting(true);

    try {
      await register({ email: normalizedEmail, password });
      navigate(getDefaultCalendarPath(), { replace: true });
    } catch (submitError) {
      setError(getErrorMessage(submitError, t("authRegisterError")));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: { xs: 2, sm: 3 },
        background: theme.custom.layout.pageBackground,
      })}
    >
      <Card
        sx={(theme) => ({
          width: "100%",
          maxWidth: 460,
          border: `1px solid ${theme.custom.glass.toolbar.border}`,
          background: theme.custom.glass.menu.background,
          boxShadow: theme.custom.shadows.strong,
          backdropFilter: theme.custom.glass.surface.blur,
        })}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
            <Stack spacing={0.75}>
              <Typography variant="h4">{t("registerTitle")}</Typography>
              <Typography color="text.secondary">
                {t("registerSubtitle")}
              </Typography>
            </Stack>

            {error ? <Alert severity="error">{error}</Alert> : null}

            <TextField
              label={t("authEmail")}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={Boolean(fieldErrors.email)}
              helperText={fieldErrors.email}
              autoComplete="email"
              fullWidth
              required
            />

            <TextField
              label={t("authPassword")}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={Boolean(fieldErrors.password)}
              helperText={fieldErrors.password}
              autoComplete="new-password"
              fullWidth
              required
            />

            <TextField
              label={t("authConfirmPassword")}
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={Boolean(fieldErrors.confirmPassword)}
              helperText={fieldErrors.confirmPassword}
              autoComplete="new-password"
              fullWidth
              required
            />

            <Button type="submit" variant="contained" disabled={submitting}>
              {submitting ? (
                <CircularProgress size={22} color="inherit" />
              ) : (
                t("registerSubmit")
              )}
            </Button>

            <Typography textAlign="center" color="text.secondary">
              {t("registerLoginPrompt")} {" "}
              <Link component={RouterLink} to="/login" underline="hover">
                {t("registerLoginLink")}
              </Link>
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
