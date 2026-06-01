"use client";

import { useActionState } from "react";

import { loginAction } from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, INITIAL_ACTION_STATE);

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <label htmlFor="login" className="text-sm font-medium text-[var(--muted)]">
          Login
        </label>
        <input
          id="login"
          name="login"
          defaultValue="diego"
          placeholder="Digite seu login"
          className="h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--field)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium text-[var(--muted)]">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          defaultValue="rincao5979"
          placeholder="Digite sua senha"
          className="h-12 w-full rounded-2xl border border-[var(--line)] bg-[var(--field)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[var(--accent-soft)]"
        />
      </div>

      {state.message ? (
        <p
          aria-live="polite"
          className={state.status === "error" ? "text-sm text-red-600" : "text-sm text-emerald-700"}
        >
          {state.message}
        </p>
      ) : null}

      <SubmitButton className="w-full">Entrar no controle</SubmitButton>
    </form>
  );
}
