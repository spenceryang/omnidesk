const jsonHeaders = { 'Content-Type': 'application/json' };

async function parseResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const message = payload.error || `Request failed with ${response.status}`;
    if (payload.code === 'RESOURCE_EXHAUSTED' || /quota|rate.?limit|resource has been exhausted/i.test(message)) {
      throw new Error('Google quota was hit for this project/model. Wait for the rate-limit window to reset, check AI Studio usage, or generate fewer clips at a time.');
    }
    throw new Error(message);
  }
  return payload;
}

export async function getHealth() {
  const response = await fetch('/api/health');
  return parseResponse(response);
}

export async function getDiscoverProjects() {
  const response = await fetch('/api/discover');
  return parseResponse(response);
}

export async function loveDiscoverProject(projectId) {
  const response = await fetch(`/api/discover/${projectId}/love`, {
    method: 'POST',
    headers: jsonHeaders
  });
  return parseResponse(response);
}

export async function addDiscoverComment({ projectId, author, body }) {
  const response = await fetch(`/api/discover/${projectId}/comments`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ author, body })
  });
  return parseResponse(response);
}

export async function createLivePlan({ brief, targetFormat, durationSeconds, sceneCount, constraints, lyrics, assets }) {
  const formData = new FormData();
  formData.append('brief', brief);
  formData.append('targetFormat', targetFormat);
  formData.append('durationSeconds', String(durationSeconds));
  formData.append('sceneCount', String(sceneCount || 2));
  formData.append('constraints', constraints);
  formData.append('lyrics', lyrics || '');
  for (const asset of assets || []) {
    formData.append('assets', asset);
  }

  const response = await fetch('/api/live/plan', {
    method: 'POST',
    body: formData
  });
  return parseResponse(response);
}

export async function startVideoJob({ projectId, sceneId, sceneTitle, prompt, negativePrompt, aspectRatio, durationSeconds }) {
  const response = await fetch('/api/live/videos', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({
      projectId,
      sceneId,
      sceneTitle,
      prompt,
      negativePrompt,
      aspectRatio,
      durationSeconds
    })
  });
  return parseResponse(response);
}

export async function getVideoJob(jobId) {
  const response = await fetch(`/api/live/video-job?jobId=${encodeURIComponent(jobId)}`);
  return parseResponse(response);
}

export async function compileVideo({ projectId, title, clips, musicTrack }) {
  const response = await fetch('/api/live/compile', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ projectId, title, clips, musicTrack })
  });
  return parseResponse(response);
}

export async function createLyriaPlan({ brief, plan, projectId }) {
  const response = await fetch('/api/live/lyria-plan', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ brief, plan, projectId })
  });
  return parseResponse(response);
}

export async function createLyriaTrack({ brief, lyrics, plan, projectId, durationSeconds }) {
  const response = await fetch('/api/live/lyria-track', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ brief, lyrics, plan, projectId, durationSeconds })
  });
  return parseResponse(response);
}

export async function applyAgentImprovements({ brief, lyrics, plan, projectId, agentReview }) {
  const response = await fetch('/api/live/apply-agent-improvements', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ brief, lyrics, plan, projectId, agentReview })
  });
  return parseResponse(response);
}

export async function runManagedAgentReview({ brief, plan, projectId }) {
  const response = await fetch('/api/live/managed-agent-review', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ brief, plan, projectId })
  });
  return parseResponse(response);
}

export async function getManagedAgents() {
  const response = await fetch('/api/live/managed-agents');
  return parseResponse(response);
}

export async function runManagedAgentRole({ brief, lyrics, plan, projectId, roleId, priorResults }) {
  const response = await fetch('/api/live/managed-agent-role', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ brief, lyrics, plan, projectId, roleId, priorResults })
  });
  return parseResponse(response);
}

export async function runManagedAgentSwarm({ brief, lyrics, plan, selectedAgentIds, projectId }) {
  const response = await fetch('/api/live/managed-agent-swarm', {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ brief, lyrics, plan, selectedAgentIds, projectId })
  });
  return parseResponse(response);
}
