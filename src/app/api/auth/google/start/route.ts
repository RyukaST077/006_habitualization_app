import {
  startGoogleLogin,
  type StartGoogleLoginFailure,
  type StartGoogleLoginSuccess,
} from '../../../../../server/auth/start-google-login';

type RequestBody = {
  redirectTo?: string;
};

type RouteResponse = {
  status: number;
  body:
    | Pick<StartGoogleLoginSuccess, 'auth_url' | 'trace_id'>
    | Pick<StartGoogleLoginFailure, 'errorCode' | 'trace_id'>;
};

type JsonRequest = {
  json: () => Promise<unknown>;
};

function isRequestBody(value: unknown): value is RequestBody {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const candidate = value as { redirectTo?: unknown };
  return candidate.redirectTo === undefined || typeof candidate.redirectTo === 'string';
}

export async function POST(request: JsonRequest): Promise<RouteResponse> {
  const payload = await request.json();
  const redirectTo = isRequestBody(payload) ? payload.redirectTo ?? '' : '';
  const result = startGoogleLogin(redirectTo);

  if (result.status === 200) {
    return {
      status: 200,
      body: {
        auth_url: result.auth_url,
        trace_id: result.trace_id,
      },
    };
  }

  return {
    status: result.status,
    body: {
      errorCode: result.errorCode,
      trace_id: result.trace_id,
    },
  };
}
