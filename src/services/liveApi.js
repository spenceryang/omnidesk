const jsonHeaders = { 'Content-Type': 'application/json' };

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    throw new Error(payload.error || `Request failed with ${response.status}`);
  }
  return payload;
}

export async function getHealth() {
  const response = await fetch('/api/health');
  return parseResponse(response);
}

export async function createLivePlan({ brief, targetFormat, durationSeconds, sceneCount, constraints, assets }) {
  const formData = new FormData();
  formData.append('brief', brief);
  formData.append('targetFormat', targetFormat);
  formData.append('durationSeconds', String(durationSeconds));
  formData.append('sceneCount', String(sceneCount || 10));
  formData.append('constraints', constraints);
  for (const asset of assets || []) {
    formData.append('assets', asset);
  }

  const response = await fetch('/api/live/plan', {
    method: 'POST',
    body: formData
  });
  return parseResponse(response);
}

export async function startVideoJob({ sceneId, prompt, negativePrompt, aspectRatio, durationSeconds }) {
  const response = await fetch('/api/live/videos', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      sceneId,
      prompt,
      negativePrompt,
      aspectRatio,
      durationSeconds
    })
  });
  return parseResponse(response);
}

export async function getVideoJob(jobId) {
  const response = await fetch(`/api/live/videos/${jobId}`);
  return parseResponse(response);
}

export async function createLyriaPlan({ brief, plan }) {
  const response = await fetch('/api/live/lyria-plan', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ brief, plan })
  });
  return parseResponse(response);
}

export async function runManagedAgentReview({ brief, plan }) {
  const response = await fetch('/api/live/managed-agent-review', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ brief, plan })
  });
  return parseResponse(response);
}

export async function getManagedAgents() {
  const response = await fetch('/api/live/managed-agents');
  return parseResponse(response);
}

export async function runManagedAgentSwarm({ brief, plan, selectedAgentIds }) {
  const response = await fetch('/api/live/managed-agent-swarm', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ brief, plan, selectedAgentIds })
  });
  return parseResponse(response);
}
