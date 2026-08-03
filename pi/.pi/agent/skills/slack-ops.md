---
name: slack-operations
description: Use the Slack CLI for interact with slack messages.
---

# Slack CLI

Use the slack CLI and Slack Web API to retrieve information from Slack.
Prioritize read-only operations unless the user explicitly requests a change.

Common tasks include:

- Reading channel messages and thread replies
- Searching messages when the authenticated token supports it
- Listing channels and retrieving channel details
- Finding messages from a person or within a channel
- Retrieving user, file, reaction, and message metadata
- Posting or updating messages when explicitly requested

Access depends on the authenticated Slack app, token type, granted scopes,
and the conversations visible to that token.

Before posting, editing, deleting, or reacting to a message, verify the
target conversation and intended action.

Assume the CLI is usually installed and authenticated. If it is unavailable
or unauthenticated, ask the user to install it and log in.
