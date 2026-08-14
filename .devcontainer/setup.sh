#!/usr/bin/env bash
# Devcontainer setup: everything the agents need to build and test Personal Space.
set -euo pipefail

echo "Updating npm..."
npm install -g npm@latest
npm cache clean --force

echo "Installing OpenCode and agent-browser..."
# --allow-scripts is required: these packages need their postinstall scripts
# to fetch the correct platform-specific binary.
npm install -g opencode-ai agent-browser --allow-scripts=agent-browser,opencode-ai

echo "Installing Chrome for Testing (agent-browser managed)..."
# Ubuntu's apt "chromium" package is just a snap stub and won't run in a
# container (no snapd). agent-browser downloads its own real Chrome for
# Testing binary instead, so no AGENT_BROWSER_EXECUTABLE_PATH override is
# needed - agent-browser finds it automatically.
agent-browser install --with-deps

echo "Adding the agent-browser skill for OpenCode..."
npx -y skills add vercel-labs/agent-browser -a opencode -y

echo "Verifying the installs..."
opencode --version
agent-browser doctor

echo "Setup complete."