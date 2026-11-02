import React, { useState, useRef } from 'react';
import {
  Settings,
  User,
  Calendar,
  Sun,
  Moon,
  Laptop,
  Clock,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/common';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Button,
  Badge,
  Input,
  Select,
} from '@/components/ui';
import { SEED_DATA } from '@/constants/seedData';
import { UserSettings } from '@/types';
import { dataAccessLayer } from '@/lib/storage/dal';
import { UniHubBackupDataSchema } from '@/lib/validation/schemas';

export const SettingsPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem('unihub_user_settings_v1');
      return stored ? JSON.parse(stored) : SEED_DATA.data.settings;
    } catch {
      return SEED_DATA.data.settings;
    }
  });

  const [isSaved, setIsSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    const updated = { ...settings, theme: newTheme };
    setSettings(updated);
    localStorage.setItem('unihub_user_settings_v1', JSON.stringify(updated));

    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (newTheme === 'dark' || (newTheme === 'system' && prefersDark)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('unihub_user_settings_v1', JSON.stringify(settings));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleExportBackup = async () => {
    try {
      const backupData = await dataAccessLayer.exportBackup();
      const backupJson = JSON.stringify(backupData, null, 2);
      const blob = new Blob([backupJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `UniHub_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusMessage({ type: 'success', text: 'Backup exported successfully!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Failed to export backup:', err);
      setStatusMessage({ type: 'error', text: 'Failed to export backup data.' });
    }
  };

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Zod strict validation
        const validation = UniHubBackupDataSchema.safeParse(parsed);
        if (!validation.success) {
          const firstError = validation.error.errors[0]?.message || 'Invalid backup structure';
          setStatusMessage({ type: 'error', text: `Validation failed: ${firstError}` });
          return;
        }

        await dataAccessLayer.importBackup(validation.data);
        setStatusMessage({ type: 'success', text: 'Backup restored successfully! Refreshing view...' });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        console.error('Error importing backup:', err);
        setStatusMessage({ type: 'error', text: 'Invalid JSON file format.' });
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (confirm('Are you sure you want to reset all data back to the demo defaults? All custom changes will be erased.')) {
      try {
        await dataAccessLayer.resetAll();
        await dataAccessLayer.initializeSeedDataIfNeeded();
        setStatusMessage({ type: 'success', text: 'All data reset to demo defaults. Reloading...' });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err) {
        console.error('Failed to reset data:', err);
        localStorage.removeItem('unihub_user_settings_v1');
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & System Preferences"
        subtitle="Manage student profile, semester registration, theme styling, and backup snapshots"
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            leftIcon={isSaved ? <Check className="h-4 w-4" /> : undefined}
          >
            {isSaved ? 'Preferences Saved!' : 'Save Changes'}
          </Button>
        }
      />

      <form onSubmit={handleSave} className="space-y-6">
        {/* Student Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-brand-500" />
              <span>Student Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Full Name"
                value={settings.studentName}
                onChange={(e) => setSettings({ ...settings, studentName: e.target.value })}
              />
              <Input
                label="University Name"
                value={settings.universityName}
                onChange={(e) => setSettings({ ...settings, universityName: e.target.value })}
              />
              <Input
                label="Degree & Major"
                value={settings.major}
                onChange={(e) => setSettings({ ...settings, major: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Visual Appearance & Theme Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              <span>Appearance & Color Theme</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'light', label: 'Light Mode', icon: Sun },
                { type: 'dark', label: 'Dark Mode', icon: Moon },
                { type: 'system', label: 'System Default', icon: Laptop },
              ].map(({ type, label, icon: Icon }) => {
                const isSelected = settings.theme === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleThemeChange(type as any)}
                    className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all select-none ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/50 shadow-sm dark:bg-brand-950/40 dark:border-brand-500'
                        : 'border-slate-200/80 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900/60'
                    }`}
                  >
                    <Icon className="h-6 w-6 text-brand-500 mb-2" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <Select
                label="GPA Grading Scale"
                value={settings.gradingScaleType}
                onChange={(e) =>
                  setSettings({ ...settings, gradingScaleType: e.target.value as any })
                }
                options={[
                  { value: '4.0', label: '4.0 Scale (US / International Standard)' },
                  { value: '10.0', label: '10.0 Scale (Vietnam / Europe)' },
                  { value: 'letter', label: 'Letter Grade System (A+, A, B...)' },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Focus Timer Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-500" />
              <span>Pomodoro Timer Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input
                label="Work Session (mins)"
                type="number"
                value={settings.pomodoro.workDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pomodoro: {
                      ...settings.pomodoro,
                      workDuration: parseInt(e.target.value, 10) || 25,
                    },
                  })
                }
              />
              <Input
                label="Short Break (mins)"
                type="number"
                value={settings.pomodoro.shortBreak}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pomodoro: {
                      ...settings.pomodoro,
                      shortBreak: parseInt(e.target.value, 10) || 5,
                    },
                  })
                }
              />
              <Input
                label="Long Break (mins)"
                type="number"
                value={settings.pomodoro.longBreak}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pomodoro: {
                      ...settings.pomodoro,
                      longBreak: parseInt(e.target.value, 10) || 15,
                    },
                  })
                }
              />
              <Input
                label="Long Break Interval"
                type="number"
                value={settings.pomodoro.longBreakInterval}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pomodoro: {
                      ...settings.pomodoro,
                      longBreakInterval: parseInt(e.target.value, 10) || 4,
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Data Persistence, Backup & Disaster Recovery */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Offline Data Backup & Disaster Recovery</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              UniHub runs 100% locally in your browser. To ensure your study schedules and grade records
              survive browser cache purges, download a complete JSON backup envelope.
            </p>

            {statusMessage && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={handleExportBackup}
              >
                Export JSON Backup
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={handleImportClick}
              >
                Restore from Backup
              </Button>

              <Button
                type="button"
                variant="danger"
                size="sm"
                leftIcon={<RotateCcw className="h-4 w-4" />}
                onClick={handleResetData}
              >
                Reset to Demo State
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
};
