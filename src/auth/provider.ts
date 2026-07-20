import type { AuthenticatedSession, AuthTokens, AuthUser, Workspace, WorkspaceMembership } from "./types.js";

export type SignInRequest =
  | { kind: "development" }
  | { kind: "oidc"; authorizationCode: string; codeVerifier: string; redirectUri: string };

/** Provider boundary for local development and production identity integrations. */
export interface AuthProvider {
  readonly id: string;
  signIn(request: SignInRequest): Promise<AuthenticatedSession>;
  signOut?(tokens: AuthTokens): Promise<void>;
}

export interface DevelopmentAuthProviderOptions {
  user: AuthUser;
  workspaces: readonly Workspace[];
  memberships: readonly WorkspaceMembership[];
  tokens?: AuthTokens;
}

export class DevelopmentAuthProvider implements AuthProvider {
  readonly id = "development";

  constructor(private readonly options: DevelopmentAuthProviderOptions) {}

  async signIn(request: SignInRequest): Promise<AuthenticatedSession> {
    if (request.kind !== "development") {
      throw new Error("The development auth provider only accepts development sign-in requests");
    }

    return {
      providerId: this.id,
      user: this.options.user,
      workspaces: [...this.options.workspaces],
      memberships: [...this.options.memberships],
      tokens: this.options.tokens ?? {
        accessToken: "development-access-token",
        refreshToken: "development-refresh-token",
        expiresAt: "2099-01-01T00:00:00.000Z",
      },
    };
  }
}

export function createDevelopmentAuthProvider(options: DevelopmentAuthProviderOptions): DevelopmentAuthProvider {
  return new DevelopmentAuthProvider(options);
}

export interface OAuth2OidcConfiguration {
  issuer: string;
  clientId: string;
  scopes: readonly string[];
}

export interface OidcAuthorizationCodeExchange {
  exchangeAuthorizationCode(request: Extract<SignInRequest, { kind: "oidc" }>): Promise<AuthenticatedSession>;
  revokeTokens?(tokens: AuthTokens): Promise<void>;
}

/**
 * OAuth2/OIDC provider shape. Transport and discovery are injected so desktop
 * shells can use their native browser and callback implementations.
 */
export class OAuth2OidcAuthProvider implements AuthProvider {
  readonly id = "oidc";

  constructor(
    readonly configuration: OAuth2OidcConfiguration,
    private readonly exchange: OidcAuthorizationCodeExchange,
  ) {}

  async signIn(request: SignInRequest): Promise<AuthenticatedSession> {
    if (request.kind !== "oidc") {
      throw new Error("The OAuth2/OIDC provider requires an authorization code");
    }

    const session = await this.exchange.exchangeAuthorizationCode(request);
    if (session.providerId !== this.id) {
      throw new Error("OIDC token exchange returned a session for an unexpected provider");
    }
    return session;
  }

  async signOut(tokens: AuthTokens): Promise<void> {
    await this.exchange.revokeTokens?.(tokens);
  }
}
