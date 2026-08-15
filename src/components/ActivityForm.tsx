import { useState, type FormEvent } from 'react';
import { Send } from 'lucide-react';
import { api } from '../api';
import type { ActivityType } from '../types';

const TYPES: Array<{ value: ActivityType; label: string }> = [
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' }
];

export function ActivityForm({
  contactId,
  dealId,
  onAdded
}: {
  contactId?: number;
  dealId?: number;
  onAdded: () => Promise<void> | void;
}) {
  const [type, setType] = useState<ActivityType>('note');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api.createActivity({
        type,
        description,
        contact_id: contactId ?? null,
        deal_id: dealId ?? null,
        due_date: dueDate || null
      });
      setDescription('');
      setDueDate('');
      setType('note');
      await onAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log activity');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card card-pad" style={{ marginBottom: 20 }}>
      <h4 style={{ marginBottom: 12, fontSize: 14 }}>Log an activity</h4>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={submit}>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="act-type">Type</label>
            <select id="act-type" value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
              {TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="act-due">Follow-up due date (optional)</label>
            <input id="act-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
          <div className="field full">
            <label htmlFor="act-desc">What happened?</label>
            <textarea
              id="act-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'call' ? 'Notes from the call…' : type === 'email' ? 'What was sent…' : 'Write a note…'}
              required
            />
          </div>
          <div className="full" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn btn-primary" disabled={busy || !description.trim()}>
              <Send size={15} /> Log {type}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}