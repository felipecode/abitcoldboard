import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-full w-full max-w-md flex-col justify-center px-5 py-12">
      <p className="font-display text-xs uppercase tracking-[0.35em] text-muted">
        A Bit Cold
      </p>
      <h1 className="mt-3 font-display text-4xl uppercase leading-none tracking-wide">
        Visual World
      </h1>
      <p className="mt-4 mb-8 text-sm text-muted">
        Tap your name. Then the password.
      </p>
      <LoginForm />
    </main>
  );
}
