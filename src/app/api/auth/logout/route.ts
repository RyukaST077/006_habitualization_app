import { NextResponse } from 'next/server';

import { logout } from '../../../../server/auth/logout';

export async function POST(): Promise<Response> {
  const result = logout();

  return NextResponse.json(
    {
      logout: result.logout,
      redirectTo: result.redirectTo,
      trace_id: result.trace_id,
    },
    { status: result.status },
  );
}
