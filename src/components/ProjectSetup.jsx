import React, { useState } from 'react';
import { UploadCloud, ShieldCheck, Film, Music, Clock, FileText, Image, Check, AlertCircle } from 'lucide-react';

export default function ProjectSetup({ onProjectCreated }) {
  const [name, setName] = useState('');
  const [format, setFormat] = useState('TikTok/Reels');
  const [length, setLength] = useState('30s');
  const [customLength, setCustomLength] = useState('90');
  const [lyrics, setLyrics] = useState('');
  const [brandConstraints, setBrandConstraints] = useState('');
  
  // Upload statuses
  const [files, setFiles] = useState({
    audio: null,
    dance: null,
    outfits: []
  });

  const [rights, setRights] = useState({
    audio: false,
    likeness: false,
    choreography: false,
    elements: false
  });

  const [error, setError] = useState('');

  const handleFileChange = (type, e) => {
    const uploadedFiles = e.target.files;
    if (uploadedFiles.length > 0) {
      if (type === 'outfits') {
        const fileNames = Array.from(uploadedFiles).map(f => f.name);
        setFiles(prev => ({ ...prev, outfits: [...prev.outfits, ...fileNames] }));
      } else {
        setFiles(prev => ({ ...prev, [type]: uploadedFiles[0].name }));
      }
    }
  };

  const handleToggleRight = (key) => {
    setRights(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a project name.');
      return;
    }
    if (!files.audio) {
      setError('An audio file or snippet is required for the Creator DNA Pack.');
      return;
    }
    const allRightsChecked = Object.values(rights).every(Boolean);
    if (!allRightsChecked) {
      setError('You must acknowledge rights and consent for all uploaded assets to proceed.');
      return;
    }

    setError('');
    const newProject = {
      id: 'proj-' + Date.now(),
      name,
      format,
      length: length === 'Custom' ? `${customLength}s` : length,
      creatorDNA: {
        audioName: files.audio,
        audioSize: '1.8 MB',
        lyrics: lyrics || 'No lyrics provided.',
        danceClip: files.dance || 'No dance footage uploaded.',
        danceClipSize: files.dance ? '9.4 MB' : '0 MB',
        outfits: files.outfits.length > 0 ? files.outfits : ['Default Artist Silhouette'],
        motifs: ['Custom Motif Alpha', 'User-defined Setting Highlight'],
        brandConstraints: brandConstraints || 'None specified.',
        rightsChecked: { ...rights }
      },
      brief: '', // Initial state
    };
    onProjectCreated(newProject);
  };

  return (
    <div className="glass-panel" style={{ maxWidth: '780px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px', background: 'linear-gradient(135deg, var(--neon-purple) 0%, var(--neon-cyan) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
        Create Original Video Project
      </h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.95rem' }}>
        Extract original visual DNA from your own files and build an IP-safe, remixable storyboard plan.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Project Name */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>Project Name</label>
          <input 
            type="text" 
            className="studio-input" 
            placeholder="e.g., Summer Anthem 2026 Visuals" 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Format & Length Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Target Video Format</label>
            <select className="studio-select" value={format} onChange={(e) => setFormat(e.target.value)}>
              <option value="TikTok/Reels">TikTok / Reels (9:16)</option>
              <option value="YouTube">YouTube Video (16:9)</option>
              <option value="Spotify Canvas">Spotify Canvas (9:16 Loop)</option>
              <option value="Full Music Video">Full Length Landscape (16:9)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Output Duration</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select 
                className="studio-select" 
                value={length} 
                onChange={(e) => setLength(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="15s">15 Seconds (Quick preview)</option>
                <option value="30s">30 Seconds (Social edit)</option>
                <option value="60s">60 Seconds (Full verse)</option>
                <option value="Custom">Custom Length</option>
              </select>
              {length === 'Custom' && (
                <input 
                  type="number" 
                  className="studio-input" 
                  value={customLength} 
                  onChange={(e) => setCustomLength(e.target.value)}
                  style={{ width: '80px', textAlign: 'center' }}
                  placeholder="Secs"
                />
              )}
            </div>
          </div>
        </div>

        {/* Creator DNA Pack upload grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Creator DNA Pack (Provide original signals)</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            
            {/* Audio Upload */}
            <div className="dna-dropzone" style={{ position: 'relative' }}>
              <input 
                type="file" 
                accept="audio/*" 
                onChange={(e) => handleFileChange('audio', e)}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />
              <Music size={24} style={{ color: files.audio ? 'var(--neon-green)' : 'var(--neon-purple)', marginBottom: '8px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Audio Track / Snippet *</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {files.audio ? <span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>✓ {files.audio}</span> : 'Click or drop .mp3, .wav, .m4a'}
              </div>
            </div>

            {/* Dance Clip Upload */}
            <div className="dna-dropzone" style={{ position: 'relative' }}>
              <input 
                type="file" 
                accept="video/*" 
                onChange={(e) => handleFileChange('dance', e)}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />
              <Film size={24} style={{ color: files.dance ? 'var(--neon-green)' : 'var(--text-muted)', marginBottom: '8px' }} />
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Dance / Movement Footage</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {files.dance ? <span style={{ color: 'var(--neon-green)', fontWeight: 'bold' }}>✓ {files.dance}</span> : 'Optional performance .mp4 clip'}
              </div>
            </div>

          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '10px' }}>
            {/* Outfits Upload */}
            <div className="dna-dropzone" style={{ position: 'relative', padding: '16px 24px' }}>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={(e) => handleFileChange('outfits', e)}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
              />
              <Image size={20} style={{ color: files.outfits.length > 0 ? 'var(--neon-green)' : 'var(--text-muted)', marginBottom: '4px' }} />
              <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>Outfit / Moodboard Images</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {files.outfits.length > 0 ? `${files.outfits.length} photos uploaded` : 'Upload outfit references'}
              </div>
            </div>

            {/* Lyrics text */}
            <textarea 
              className="studio-textarea" 
              placeholder="Paste song lyrics here (Optional - used by Creator DNA Analyst for motif extraction)..." 
              value={lyrics}
              onChange={(e) => setLyrics(e.target.value)}
              rows={2}
              style={{ fontSize: '0.8rem' }}
            />
          </div>
        </div>

        {/* Brand Constraints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Style & Brand Constraints (Optional)</label>
          <input 
            type="text" 
            className="studio-input" 
            placeholder="e.g. Gritty, moody lighting, strictly slow panning camera motions." 
            value={brandConstraints}
            onChange={(e) => setBrandConstraints(e.target.value)}
          />
        </div>

        {/* Rights Check Checklist */}
        <div style={{ background: 'rgba(0,0,0,0.25)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <ShieldCheck size={18} style={{ color: 'var(--neon-cyan)' }} />
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>IP & Likeness Rights Consent</h4>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              { key: 'audio', label: 'I own the copyright or hold appropriate licensing for the uploaded audio track.' },
              { key: 'likeness', label: "I possess explicit consent to utilize the likeness/face of all depicted performers." },
              { key: 'choreography', label: 'The choreography/movement style is either original or explicitly cleared for commercial use.' },
              { key: 'elements', label: 'All uploaded visual assets (sketches, outfit photos) are owner-generated or royalty-free.' }
            ].map(item => (
              <div 
                key={item.key} 
                style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}
                onClick={() => handleToggleRight(item.key)}
              >
                <div style={{ marginTop: '2px', color: rights[item.key] ? 'var(--neon-green)' : 'var(--text-dark)' }}>
                  {rights[item.key] ? <Check size={16} style={{ strokeWidth: 3 }} /> : <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderRadius: '3px' }} />}
                </div>
                <span style={{ fontSize: '0.8rem', color: rights[item.key] ? 'var(--text-main)' : 'var(--text-muted)' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neon-rose)', fontSize: '0.85rem', background: 'rgba(244,63,94,0.1)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(244,63,94,0.2)' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-end', marginTop: '10px' }}>
          Initialize Project Brief
        </button>

      </form>
    </div>
  );
}
