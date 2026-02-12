import { NextResponse } from 'next/server';

import { completeGoogleLogin } from '../../../../../../server/auth/complete-google-login';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const failWith = url.searchParams.get('failWith');
  const result = completeGoogleLogin(
    failWith === 'AUTH_FAILED' || failWith === 'AUTH_PROVIDER_ERROR' ? failWith : undefined,
  );

  if (result.status === 200) {
    return NextResponse.json(
      {
        callback: result.callback,
        redirectTo: result.redirectTo,
        trace_id: result.trace_id,
      },
      { status: 200 },
    );
  }

  return NextResponse.json(
    {
      callback: result.callback,
      errorCode: result.errorCode,
      trace_id: result.trace_id,
      AUTH_FAILED: 'AUTH_FAILED',
      AUTH_PROVIDER_ERROR: 'AUTH_PROVIDER_ERROR',
    },
    { status: result.status },
  );
}
