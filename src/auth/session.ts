import type { AuthProvider, SignInRequest } from "./provider.js";
import type { AuthenticatedSession, SessionSnapshot } from "./types.js";

/** Adapter for the operating system credential manager (for example Keychain or Credential Manager). */
export interface OsCredentialService {
  getPassword(service: string, account: string): Promise<string | undefined>;
  setPassword(service: string, account: string, password: string): Promise<void>;
  deletePassword(service: string, account: string): Promise<void>;
}

export interface SessionStore {
  load(): Promise<AuthenticatedSession | undefined>;
  save(session: AuthenticatedSession): Promise<void>;
  clear(): Promise<void>;
}

const CREDENTIAL_SERVICE = "creature-os";
const SESSION_ACCOUNT = "authenticated-session";

/** Stores the serialized session in the OS credential manager, never in a file or browser storage. */
export class CredentialSessionStore implements SessionStore {
  constructor(private readonly credentials: OsCredentialService) {}

  async load(): Promise<AuthenticatedSession | undefined> {
    const serializedSession = await this.credentials.getPassword(CREDENTIAL_SERVICE, SESSION_ACCOUNT);
    if (serializedSession === undefined) return undefined;

    try {
      const session: unknown = JSON.parse(serializedSession);
      if (!isAuthenticatedSession(session)) throw new Error("invalid session shape");
      return session;
    } catch (error) {
      await this.clear();
      const reason = error instanceof Error ? error.message : "unknown error";
      throw new Error(`Stored authentication session is invalid: ${reason}`);
    }
  }

  async save(session: AuthenticatedSession): Promise<void> {
    await this.credentials.setPassword(CREDENTIAL_SERVICE, SESSION_ACCOUNT, JSON.stringify(session));
  }

  async clear(): Promise<void> {
    await this.credentials.deletePassword(CREDENTIAL_SERVICE, SESSION_ACCOUNT);
  }
}

export class SessionManager {
  private activeSession: SessionSnapshot | undefined;

  constructor(
    private readonly provider: AuthProvider,
    private readonly store: SessionStore,
  ) {}

  get session(): SessionSnapshot | undefined {
    return this.activeSession;
  }

  async restore(): Promise<SessionSnapshot | undefined> {
    const storedSession = await this.store.load();
    if (!storedSession) return undefined;
    if (storedSession.providerId !== this.provider.id) {
      await this.store.clear();
      throw new Error("Stored authentication session belongs to a different provider");
    }

    this.activeSession = toSessionSnapshot(storedSession);
    return this.activeSession;
  }

  async signIn(request: SignInRequest): Promise<SessionSnapshot> {
    const authenticatedSession = await this.provider.signIn(request);
    if (authenticatedSession.providerId !== this.provider.id) {
      throw new Error("Authentication provider returned a session for an unexpected provider");
    }

    await this.store.save(authenticatedSession);
    this.activeSession = toSessionSnapshot(authenticatedSession);
    return this.activeSession;
  }

  async signOut(): Promise<void> {
    const storedSession = await this.store.load();
    this.activeSession = undefined;
    try {
      if (storedSession) await this.provider.signOut?.(storedSession.tokens);
    } finally {
      await this.store.clear();
    }
  }
}

function toSessionSnapshot(session: AuthenticatedSession): SessionSnapshot {
  return {
    providerId: session.providerId,
    user: session.user,
    workspaces: [...session.workspaces],
    memberships: [...session.memberships],
  };
}

function isAuthenticatedSession(value: unknown): value is AuthenticatedSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<AuthenticatedSession>;
  return (
    typeof session.providerId === "string" &&
    typeof session.user?.id === "string" &&
    typeof session.user.email === "string" &&
    typeof session.user.displayName === "string" &&
    Array.isArray(session.workspaces) &&
    Array.isArray(session.memberships) &&
    typeof session.tokens?.accessToken === "string" &&
    typeof session.tokens.expiresAt === "string"
  );
}
