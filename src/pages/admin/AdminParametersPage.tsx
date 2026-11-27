import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Plus, RotateCcw } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button, IconButton } from '../../components/ui/Button';
import { DEFAULT_CHECKIN_PARAMETERS } from '../../data/sampleJourney';
import { useLunara } from '../../providers/LunaraProvider';
import type { CheckInParameterConfig, ParameterType } from '../../types/lunara';

export const AdminParametersPage: React.FC = () => {
  const { parameters, updateParameters, showToast } = useLunara();
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<ParameterType>('scale');
  const [newLowLabel, setNewLowLabel] = useState('Low');
  const [newHighLabel, setNewHighLabel] = useState('High');

  const sortedParams = [...parameters].sort((a, b) => a.order - b.order);

  const toggleField = (id: string, field: 'enabled' | 'required') => {
    const next = parameters.map((p) => (p.id === id ? { ...p, [field]: !p[field] } : p));
    updateParameters(next);
  };

  const moveParam = (id: string, direction: -1 | 1) => {
    const list = [...sortedParams];
    const idx = list.findIndex((p) => p.id === id);
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= list.length) return;
    const temp = list[idx];
    list[idx] = list[target];
    list[target] = temp;
    updateParameters(list.map((p, i) => ({ ...p, order: i + 1 })));
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const created: CheckInParameterConfig = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || 'Custom daily check-in field.',
      type: newType,
      enabled: true,
      required: false,
      order: parameters.length + 1,
      scaleLabels:
        newType === 'scale' ? [newLowLabel.trim() || 'Low', newHighLabel.trim() || 'High'] : undefined,
      isCore: false,
    };
    updateParameters([...parameters, created]);
    setNewName('');
    setNewDesc('');
    showToast(`Added "${created.name}" to Check-in parameters.`, 'lavender');
  };

  const handleReset = () => {
    updateParameters(DEFAULT_CHECKIN_PARAMETERS);
    showToast('Parameters reset to defaults.', 'blue');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration · Parameters"
        title="Check-in parameters"
        description="Configure reflection fields, scale anchors, display order, and availability."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset defaults
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <section className="lg:col-span-8 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] overflow-hidden">
          <div className="divide-y divide-[var(--border-subtle)]">
            {sortedParams.map((param, idx) => (
              <div
                key={param.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tabular-nums text-xs font-medium text-[var(--text-muted)]">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {param.name}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      · {param.type} {param.scaleLabels ? `(${param.scaleLabels[0]}–${param.scaleLabels[1]})` : ''} ·{' '}
                      {param.isCore ? 'core' : 'custom'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {param.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <IconButton
                    label={`Move ${param.name} up`}
                    size="sm"
                    disabled={idx === 0}
                    onClick={() => moveParam(param.id, -1)}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </IconButton>
                  <IconButton
                    label={`Move ${param.name} down`}
                    size="sm"
                    disabled={idx === sortedParams.length - 1}
                    onClick={() => moveParam(param.id, 1)}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </IconButton>

                  <button
                    type="button"
                    onClick={() => toggleField(param.id, 'required')}
                    className={`min-h-[34px] px-2.5 rounded-[9px] text-xs font-medium cursor-pointer transition-colors ${
                      param.required
                        ? 'bg-[var(--surface-amber)] text-[var(--amber-strong)]'
                        : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]'
                    }`}
                  >
                    {param.required ? 'Required' : 'Optional'}
                  </button>

                  <button
                    type="button"
                    disabled={param.isCore}
                    onClick={() => toggleField(param.id, 'enabled')}
                    className={`min-h-[34px] px-3 rounded-[9px] text-xs font-medium cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                      param.enabled
                        ? 'bg-[var(--surface-teal)] text-[var(--teal-strong)]'
                        : 'bg-[var(--surface-secondary)] text-[var(--text-muted)]'
                    }`}
                  >
                    {param.enabled ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <form
          onSubmit={handleAdd}
          className="lg:col-span-4 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-5 space-y-3.5"
        >
          <h3 className="font-display text-lg font-medium text-[var(--text-primary)]">
            Add parameter
          </h3>

          <div>
            <label
              htmlFor="admin-param-name"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
            >
              Name
            </label>
            <input
              id="admin-param-name"
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Sleep Quality"
              className="w-full min-h-[42px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="admin-param-desc"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
            >
              Description
            </label>
            <input
              id="admin-param-desc"
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="How rested did you feel?"
              className="w-full min-h-[42px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
            />
          </div>

          <div>
            <label
              htmlFor="admin-param-type"
              className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
            >
              Type
            </label>
            <select
              id="admin-param-type"
              value={newType}
              onChange={(e) => setNewType(e.target.value as ParameterType)}
              className="w-full min-h-[42px] rounded-[11px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-sm text-[var(--text-primary)]"
            >
              <option value="scale">1–5 Scale</option>
              <option value="text">Short Text Note</option>
            </select>
          </div>

          {newType === 'scale' && (
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label
                  htmlFor="admin-param-low"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
                >
                  Low label
                </label>
                <input
                  id="admin-param-low"
                  type="text"
                  value={newLowLabel}
                  onChange={(e) => setNewLowLabel(e.target.value)}
                  className="w-full min-h-[40px] rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-xs text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label
                  htmlFor="admin-param-high"
                  className="block text-xs font-medium text-[var(--text-secondary)] mb-1"
                >
                  High label
                </label>
                <input
                  id="admin-param-high"
                  type="text"
                  value={newHighLabel}
                  onChange={(e) => setNewHighLabel(e.target.value)}
                  className="w-full min-h-[40px] rounded-[10px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3 text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="sm"
            className="w-full"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add parameter
          </Button>
        </form>
      </div>
    </div>
  );
};
