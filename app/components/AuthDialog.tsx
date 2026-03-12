"use client";

import { useState, type FormEvent } from "react";

type AuthMode = "login" | "register";

type AuthDialogProps = {
  mode: AuthMode;
  onClose: () => void;
  onSwitchMode: (mode: AuthMode) => void;
  onAuthenticated: (session: {
    userId: string;
    user: {
      id: string;
      name: string;
      email: string;
      createdAt: string;
    };
    journals?: Array<{
      id: string | number;
      text: string;
      ambience: string;
      createdAt: string;
    }>;
  }) => void;
};

const dialogContent = {
  login: {
    eyebrow: "Welcome back",
    title: "Login to your journal",
    description:
      "Sign in to sync your entries and unlock your saved journal history.",
    fields: [
      {
        id: "login-email",
        label: "Email",
        type: "email",
        placeholder: "you@example.com",
      },
      {
        id: "login-password",
        label: "Password",
        type: "password",
        placeholder: "Enter your password",
      },
    ],
    submitLabel: "Login",
    switchLabel: "Need an account?",
    switchAction: "Register",
    nextMode: "register" as AuthMode,
  },
  register: {
    eyebrow: "New here",
    title: "Create your account",
    description:
      "Register to start saving entries under your own journal history.",
    fields: [
      {
        id: "register-name",
        label: "Full name",
        type: "text",
        placeholder: "Shail Kumar",
      },
      {
        id: "register-email",
        label: "Email",
        type: "email",
        placeholder: "you@example.com",
      },
      {
        id: "register-password",
        label: "Password",
        type: "password",
        placeholder: "Choose a password",
      },
    ],
    submitLabel: "Register",
    switchLabel: "Already have an account?",
    switchAction: "Login",
    nextMode: "login" as AuthMode,
  },
};

type AuthResponse = {
  ok?: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    createdAt?: string;
    created_at?: string;
  };
};

type UserDetailsResponse = {
  ok?: boolean;
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
    createdAt?: string;
    created_at?: string;
  };
  journals?: Array<{
    id?: string | number;
    text?: string;
    ambience?: string;
    createdAt?: string;
    created_at?: string;
  }>;
};

function getAuthValidationMessage(mode: AuthMode, values: {
  name: string;
  email: string;
  password: string;
}) {
  const requiredValues =
    mode === "register"
      ? [values.name, values.email, values.password]
      : [values.email, values.password];

  return requiredValues.some((value) => !value.trim())
    ? "All fields are required."
    : "";
}

function getErrorMessage(detail: unknown, fallback: string) {
  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return "All fields are required.";
  }

  return fallback;
}

export default function AuthDialog({
  mode,
  onClose,
  onSwitchMode,
  onAuthenticated,
}: AuthDialogProps) {
  const content = dialogContent[mode];
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const submittedName = String(formData.get("name") ?? "");
    const submittedEmail = String(formData.get("email") ?? "");
    const submittedPassword = String(formData.get("password") ?? "");

    if (isSubmitting) {
      return;
    }

    const validationMessage = getAuthValidationMessage(mode, {
      name: submittedName,
      email: submittedEmail,
      password: submittedPassword,
    });
    if (validationMessage) {
      setErrorMessage(validationMessage);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const payload =
        mode === "login"
          ? { email: submittedEmail, password: submittedPassword }
          : {
              name: submittedName,
              email: submittedEmail,
              password: submittedPassword,
            };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as AuthResponse & { detail?: unknown };

      if (!response.ok || !data.user) {
        throw new Error(getErrorMessage(data.detail, "Authentication failed."));
      }

      const detailsResponse = await fetch(
        "/api/user-details",
        {
          credentials: "include",
        },
      );
      const details = (await detailsResponse.json()) as UserDetailsResponse;

      onAuthenticated({
        userId: details.userId ?? data.user.id,
        user: {
          id: details.user?.id ?? data.user.id,
          name: details.user?.name ?? data.user.name,
          email: details.user?.email ?? data.user.email,
          createdAt:
            details.user?.createdAt ??
            details.user?.created_at ??
            data.user.createdAt ??
            data.user.created_at ??
            new Date().toISOString(),
        },
        journals: Array.isArray(details.journals)
          ? details.journals.map((entry, index) => ({
              id: entry.id ?? `${Date.now()}-${index}`,
              text: entry.text ?? "",
              ambience: entry.ambience ?? "forest",
              createdAt:
                entry.createdAt ??
                entry.created_at ??
                new Date().toISOString(),
            }))
          : [],
      });
      onClose();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Authentication failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/45 p-4">
      <div className="w-full max-w-md rounded-[32px] border border-stone-200 bg-white p-6 shadow-[0_30px_120px_rgba(28,25,23,0.28)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-amber-700">
              {content.eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-900">
              {content.title}
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-600">
              {content.description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-700"
          >
            Close
          </button>
        </div>

        <form
          className="mt-6 space-y-4"
          onSubmit={handleSubmit}
        >
          {content.fields.map((field) => (
            <label key={field.id} className="block">
              <span className="mb-2 block text-sm font-medium text-stone-700">
                {field.label}
              </span>
              <input
                id={field.id}
                name={
                  field.id.includes("name")
                    ? "name"
                    : field.id.includes("email")
                      ? "email"
                      : "password"
                }
                type={field.type}
                placeholder={field.placeholder}
                value={
                  field.id.includes("name")
                    ? name
                    : field.id.includes("email")
                      ? email
                      : password
                }
                onChange={(event) => {
                  setErrorMessage("");

                  if (field.id.includes("name")) {
                    setName(event.target.value);
                    return;
                  }

                  if (field.id.includes("email")) {
                    setEmail(event.target.value);
                    return;
                  }

                  setPassword(event.target.value);
                }}
                className="w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-amber-500 focus:bg-white"
              />
            </label>
          ))}
          {errorMessage ? (
            <p className="text-sm text-red-600">{errorMessage}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-full bg-amber-500 px-5 py-3 text-sm font-medium text-stone-950 transition hover:bg-amber-400"
          >
            {isSubmitting ? "Please wait..." : content.submitLabel}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-200 pt-4 text-sm">
          <span className="text-stone-500">{content.switchLabel}</span>
          <button
            type="button"
            onClick={() => onSwitchMode(content.nextMode)}
            className="font-medium text-amber-700 transition hover:text-amber-800"
          >
            {content.switchAction}
          </button>
        </div>
      </div>
    </div>
  );
}
