import React from 'react';
import { RotateCcw } from 'lucide-react';
import { PageHeader } from '../../components/shared/PageHeader';
import { Button } from '../../components/ui/Button';
import { DEFAULT_ADMIN_CONFIG } from '../../data/sampleJourney';
import { useLunara } from '../../providers/LunaraProvider';

export const AdminSettingsPage: React.FC = () => {
  const { adminConfig, updateAdminConfig, showToast } = useLunara();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Administration · Configuration"
        title="System configuration"
        description="Manage workspace-level reflection options and notice banners."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              updateAdminConfig(DEFAULT_ADMIN_CONFIG);
              showToast('Configuration reset to defaults.', 'blue');
            }}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset defaults
          </Button>
        }
      />

      <section className="rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-6 space-y-5">
        <div>
          <label
            htmlFor="admin-workspace-name"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Workspace name
          </label>
          <input
            id="admin-workspace-name"
            type="text"
            value={adminConfig.workspaceName}
            onChange={(e) => updateAdminConfig({ workspaceName: e.target.value })}
            className="w-full min-h-[44px] rounded-[12px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3.5 text-sm text-[var(--text-primary)]"
          />
        </div>

        <div className="flex items-center justify-between gap-4 pt-3 border-t border-[var(--border-subtle)]">
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">
              Allow custom check-in tags
            </div>
            <div className="text-xs text-[var(--text-muted)]">
              Let members add custom Likes and Dislikes beyond suggested presets
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={adminConfig.allowCustomTags}
            onClick={() =>
              updateAdminConfig({ allowCustomTags: !adminConfig.allowCustomTags })
            }
            className={`relative w-12 h-7 rounded-full transition-colors cursor-pointer shrink-0 ${
              adminConfig.allowCustomTags
                ? 'bg-[#304A70] dark:bg-[#78A6E7]'
                : 'bg-[var(--surface-secondary)] border border-[var(--border-medium)]'
            }`}
          >
            <span
              className={`block w-5 h-5 rounded-full bg-white shadow-xs transition-transform ${
                adminConfig.allowCustomTags ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="pt-3 border-t border-[var(--border-subtle)]">
          <label
            htmlFor="admin-notice"
            className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
          >
            Optional workspace banner notice
          </label>
          <input
            id="admin-notice"
            type="text"
            value={adminConfig.maintenanceNotice}
            onChange={(e) => updateAdminConfig({ maintenanceNotice: e.target.value })}
            placeholder="Leave empty for no banner..."
            className="w-full min-h-[44px] rounded-[12px] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] px-3.5 text-sm text-[var(--text-primary)]"
          />
        </div>
      </section>
    </div>
  );
};
