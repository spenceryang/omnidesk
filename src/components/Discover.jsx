import React, { useEffect, useState } from 'react';
import { FileVideo, Heart, Loader2, MessageCircle, RefreshCw, Send } from 'lucide-react';
import { addDiscoverComment, getDiscoverProjects, loveDiscoverProject } from '../services/liveApi';

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export default function Discover() {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});

  const loadProjects = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await getDiscoverProjects();
      setProjects(response.projects || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const updateProject = (project) => {
    setProjects((prev) => prev.map((item) => (item.id === project.id ? project : item)));
  };

  const handleLove = async (projectId) => {
    setError('');
    try {
      const response = await loveDiscoverProject(projectId);
      updateProject(response.project);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleComment = async (event, projectId) => {
    event.preventDefault();
    const body = commentDrafts[projectId]?.trim();
    if (!body) return;

    setError('');
    try {
      const response = await addDiscoverComment({ projectId, body });
      updateProject(response.project);
      setCommentDrafts((prev) => ({ ...prev, [projectId]: '' }));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="discover-workspace">
      <div className="discover-header">
        <div>
          <span>Community</span>
          <h2>Discover generated music videos</h2>
        </div>
        <button className="btn-secondary" onClick={loadProjects} disabled={isLoading}>
          {isLoading ? <Loader2 size={16} className="spin-icon" /> : <RefreshCw size={16} />}
          <span>Refresh</span>
        </button>
      </div>

      {error && <div className="inline-error">{error}</div>}

      {isLoading ? (
        <div className="empty-state">
          <Loader2 size={28} className="spin-icon" />
          <strong>Loading projects</strong>
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <FileVideo size={28} />
          <strong>No watchable videos yet</strong>
          <span>Discover only shows generations with playable clips or final renders.</span>
        </div>
      ) : (
        <div className="discover-grid">
          {projects.map((project) => (
            <article key={project.id} className="discover-card">
              {project.finalVideo?.outputUrl ? (
                <video className="discover-video" controls src={project.finalVideo.outputUrl} />
              ) : project.clips?.[0]?.outputUrl ? (
                <video className="discover-video" controls src={project.clips[0].outputUrl} />
              ) : (
                <div className="discover-placeholder">
                  <FileVideo size={28} />
                </div>
              )}

              <div className="discover-card-body">
                <div className="discover-card-top">
                  <span>{project.status || 'planned'}</span>
                  <small>{formatDate(project.updatedAt || project.createdAt)}</small>
                </div>
                <h3>{project.title || project.plan?.title || 'Untitled video'}</h3>
                <p>{project.plan?.styleBible?.logline || project.brief}</p>
                <div className="discover-meta">
                  <span>{project.clips?.length || 0} clips</span>
                  <span>{project.sceneCount || project.plan?.scenes?.length || 10} scenes</span>
                  <span>{project.format || project.plan?.format || '9:16'}</span>
                </div>

                <div className="community-actions">
                  <button className="love-button" onClick={() => handleLove(project.id)}>
                    <Heart size={16} />
                    <span>{project.reactions?.loves || 0}</span>
                  </button>
                  <span>
                    <MessageCircle size={16} />
                    {project.comments?.length || 0}
                  </span>
                </div>

                <form className="comment-form" onSubmit={(event) => handleComment(event, project.id)}>
                  <input
                    className="studio-input"
                    value={commentDrafts[project.id] || ''}
                    onChange={(event) => setCommentDrafts((prev) => ({ ...prev, [project.id]: event.target.value }))}
                    placeholder="Add a comment"
                    maxLength={500}
                  />
                  <button className="btn-secondary" disabled={!commentDrafts[project.id]?.trim()}>
                    <Send size={15} />
                  </button>
                </form>

                {project.comments?.length > 0 && (
                  <div className="comment-list">
                    {project.comments.slice(0, 3).map((comment) => (
                      <div key={comment.id} className="comment-item">
                        <strong>{comment.author || 'Guest'}</strong>
                        <span>{comment.body}</span>
                      </div>
                    ))}
                  </div>
                )}

                <details className="result-details">
                  <summary>Scene plan</summary>
                  <pre>{JSON.stringify(project.plan?.scenes || [], null, 2)}</pre>
                </details>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
