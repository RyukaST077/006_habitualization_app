export interface SupabaseAuthGatewayContract {
  buildGoogleOAuthUrl(redirectTo: string): Promise<string>;
  clearSession(userId: string): Promise<void>;
}

export interface SupabaseAuthClient {
  createGoogleOAuthUrl(redirectTo: string): Promise<string>;
  clearUserSession(userId: string): Promise<void>;
}

export class SupabaseAuthGateway implements SupabaseAuthGatewayContract {
  public constructor(private readonly client: SupabaseAuthClient) {}

  public async buildGoogleOAuthUrl(redirectTo: string): Promise<string> {
    return await this.client.createGoogleOAuthUrl(redirectTo);
  }

  public async clearSession(userId: string): Promise<void> {
    await this.client.clearUserSession(userId);
  }
}
