import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { sendEmail } from '@/lib/email';
import { welcomeEmail, nftAssignmentEmail, newProposalEmail } from '@/lib/email-templates';

type TemplateType = 'welcome' | 'nft_assignment' | 'new_proposal';

export async function POST(req: NextRequest) {
  // Verify the request is from an authenticated admin/manager
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { template, params, to } = body as {
      template: TemplateType;
      params: Record<string, unknown>;
      to: string;
    };

    if (!template || !to) {
      return NextResponse.json(
        { error: 'Missing required fields: template, to' },
        { status: 400 }
      );
    }

    let email: { subject: string; html: string; text: string };

    switch (template) {
      case 'welcome':
        email = welcomeEmail({
          recipientName: (params.recipientName as string) || 'Resident',
          communityName: (params.communityName as string) || 'Your Community',
          dashboardUrl: (params.dashboardUrl as string) || `${getBaseUrl(req)}/dashboard`,
        });
        break;

      case 'nft_assignment':
        email = nftAssignmentEmail({
          recipientName: (params.recipientName as string) || 'Resident',
          communityName: (params.communityName as string) || 'Your Community',
          lotNumber: (params.lotNumber as number) || 0,
          dashboardUrl: (params.dashboardUrl as string) || `${getBaseUrl(req)}/dashboard`,
        });
        break;

      case 'new_proposal':
        email = newProposalEmail({
          recipientName: (params.recipientName as string) || 'Resident',
          communityName: (params.communityName as string) || 'Your Community',
          proposalTitle: (params.proposalTitle as string) || 'New Proposal',
          proposalDescription: (params.proposalDescription as string) || '',
          proposalUrl: (params.proposalUrl as string) || `${getBaseUrl(req)}/proposals`,
          votingDeadline: params.votingDeadline as string | undefined,
        });
        break;

      default:
        return NextResponse.json(
          { error: `Unknown template: ${template}` },
          { status: 400 }
        );
    }

    const result = await sendEmail({
      to,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: result.id });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal error' },
      { status: 500 }
    );
  }
}

function getBaseUrl(req: NextRequest): string {
  const host = req.headers.get('host') || 'localhost:3000';
  const protocol = host.includes('localhost') ? 'http' : 'https';
  return `${protocol}://${host}`;
}
