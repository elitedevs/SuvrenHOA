import { NextResponse } from 'next/server';
import { getAuthenticatedAddress } from '@/lib/auth';

type AuthenticatedHandler = (
  request: Request,
  context: { address: string }
) => Promise<NextResponse | Response>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: Request) => {
    const address = await getAuthenticatedAddress();
    if (!address) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    return handler(request, { address });
  };
}
