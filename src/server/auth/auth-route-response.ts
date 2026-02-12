import { NextResponse } from 'next/server';

type AuthResponseResult = {
  status: number;
  [key: string]: unknown;
};

type AuthErrorResult = AuthResponseResult & {
  errorCode: string;
};

export function toAuthJsonResponse(result: AuthResponseResult): Response {
  const { status, ...body } = result;
  return NextResponse.json(body, { status });
}

export function toAuthErrorResponse(
  result: AuthErrorResult,
  aliases: Readonly<Record<string, string>> = {},
): Response {
  const { status, ...body } = result;
  return NextResponse.json(
    {
      ...body,
      ...aliases,
    },
    { status },
  );
}
