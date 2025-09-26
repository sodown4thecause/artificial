export {};

declare global {
  interface DenoEnv {
    get(key: string): string | undefined;
  }

  const Deno: {
    env: DenoEnv;
  };
}

