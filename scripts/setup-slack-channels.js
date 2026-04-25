#!/usr/bin/env node
/**
 * SuvrenHOA Slack Workspace Setup Script
 *
 * Creates the recommended channel structure for the SuvrenHOA organization.
 *
 * Prerequisites:
 * 1. Create a Slack App at https://api.slack.com/apps
 * 2. Add OAuth scope: channels:write, channels:read
 * 3. Install the app to your workspace
 * 4. Copy the Bot User OAuth Token (starts with xoxb-)
 *
 * Usage:
 *   SLACK_TOKEN=xoxb-your-token node scripts/setup-slack-channels.js
 */

const SLACK_TOKEN = process.env.SLACK_TOKEN;

if (!SLACK_TOKEN) {
  console.error('Error: SLACK_TOKEN environment variable is required');
  console.error('Usage: SLACK_TOKEN=xoxb-your-token node scripts/setup-slack-channels.js');
  process.exit(1);
}

const channels = [
  // Engineering
  { name: 'eng-contracts', description: 'Smart contract development - Solidity, Foundry, deployments, PropertyNFT & AssessmentNFT' },
  { name: 'eng-frontend', description: 'Next.js app, wagmi, RainbowKit, UI components, ultra-luxury design system' },
  { name: 'eng-backend', description: 'Supabase, migrations, API routes, indexers, RLS policies' },
  { name: 'eng-deployments', description: 'Base mainnet/testnet deployments, CI/CD alerts, Tenderly monitoring' },
  { name: 'eng-security', description: 'Audit findings, vulnerability discussions, security reviews' },

  // Product
  { name: 'product-roadmap', description: 'Feature planning, sprint priorities, milestone tracking' },
  { name: 'product-faircroft', description: 'Faircroft MVP customer-specific discussions and feedback' },
  { name: 'design-system', description: 'Ultra-luxury aesthetic, Lux scores, obsidian/parchment palette' },

  // Operations
  { name: 'standup', description: 'Daily async standups - what you did, what you\'re doing, blockers' },
  { name: 'incidents', description: 'Production issues, Sentry alerts, Tenderly notifications, postmortems' },

  // Business
  { name: 'biz-legal', description: 'NC HOA law compliance, PropertyNFT classification, D&O insurance, governance' },
  { name: 'biz-growth', description: 'New community outreach, pricing strategy, Stripe subscriptions' },
  { name: 'biz-partnerships', description: 'Arweave, Base ecosystem, potential integrations, vendor relationships' },

  // External/Support
  { name: 'support-faircroft', description: 'Faircroft homeowner questions, onboarding help, issue resolution' },
];

async function createChannel(name, description) {
  const response = await fetch('https://slack.com/api/conversations.create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      is_private: false,
    }),
  });

  const data = await response.json();

  if (!data.ok) {
    if (data.error === 'name_taken') {
      console.log(`⏭️  #${name} already exists`);
      return { skipped: true, name };
    }
    console.error(`❌ Failed to create #${name}: ${data.error}`);
    return { error: data.error, name };
  }

  // Set the channel description/purpose
  const channelId = data.channel.id;
  await fetch('https://slack.com/api/conversations.setPurpose', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SLACK_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      channel: channelId,
      purpose: description,
    }),
  });

  console.log(`✅ Created #${name}`);
  return { created: true, name, id: channelId };
}

async function main() {
  console.log('🏠 SuvrenHOA Slack Workspace Setup\n');
  console.log('Creating channels...\n');

  const results = {
    created: [],
    skipped: [],
    errors: [],
  };

  for (const channel of channels) {
    const result = await createChannel(channel.name, channel.description);
    if (result.created) results.created.push(result.name);
    else if (result.skipped) results.skipped.push(result.name);
    else results.errors.push(result.name);

    // Rate limiting - Slack allows ~50 requests per minute
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  console.log('\n--- Summary ---');
  console.log(`✅ Created: ${results.created.length}`);
  console.log(`⏭️  Skipped (already exist): ${results.skipped.length}`);
  console.log(`❌ Errors: ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log(`\nFailed channels: ${results.errors.join(', ')}`);
  }

  console.log('\n🎉 Done! Your SuvrenHOA Slack workspace is ready.');
}

main().catch(console.error);
