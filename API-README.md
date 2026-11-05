# Actai API

Backend service for the Actai web interface.

## Deploy on Render

This repository includes a `render.yaml` Blueprint. In Render, choose **New → Blueprint**, connect this repository, and review the `actai-api` web service.

Add the secret `OPENROUTER_API_KEY` in the Render service environment. Never commit API keys to GitHub.

- Health: `/health`
- Chat: `POST /api/chat`
- Frontend: GitHub Pages

The free Render web service may spin down after inactivity, so the first request after a quiet period can take longer.
