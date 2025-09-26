export {};

declare global {
  namespace Deno {
    interface Env {
      get(key: string): string | undefined;
    }

    const env: Env;
  }
}

