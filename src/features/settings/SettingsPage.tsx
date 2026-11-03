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
  Database,
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
import { useSettingsStore, useCourseStore } from '@/stores';
import { SemesterManagementCard } from './components';

export const SettingsPage: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storedSettings = useSettingsStore((state) => state.settings);
  const updateSettings = useSettingsStore((state) => state.updateSettings);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const databaseMode = useSettingsStore((state) => state.databaseMode);
  const switchDatabaseMode = useSettingsStore((state) => state.switchDatabaseMode);

  // Semesters & Courses from CourseStore
  const semesters = useCourseStore((state) => state.semesters);
  const courses = useCourseStore((state) => state.courses);
  const loadCourses = useCourseStore((state) => state.loadCourses);
  const addSemester = useCourseStore((state) => state.addSemester);
  const updateSemester = useCourseStore((state) => state.updateSemester);
  const deleteSemester = useCourseStore((state) => state.deleteSemester);
  const setCurrentSemester = useCourseStore((state) => state.setCurrentSemester);
  const transitionSemester = useCourseStore((state) => state.transitionSemester);

  const [settings, setSettings] = useState<UserSettings>(storedSettings);

  React.useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  const [isSaved, setIsSaved] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    const updated = { ...settings, theme: newTheme };
    setSettings(updated);
    setTheme(newTheme);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings(settings);
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
      setStatusMessage({ type: 'success', text: 'Xuất bản sao lưu dữ liệu thành công!' });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      console.error('Failed to export backup:', err);
      setStatusMessage({ type: 'error', text: 'Không thể xuất dữ liệu sao lưu.' });
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
          const firstError = validation.error.errors[0]?.message || 'Cấu trúc bản sao lưu không hợp lệ';
          setStatusMessage({ type: 'error', text: `Xác thực dữ liệu thất bại: ${firstError}` });
          return;
        }

        await dataAccessLayer.importBackup(validation.data);
        setStatusMessage({ type: 'success', text: 'Khôi phục dữ liệu sao lưu thành công! Đang tải lại trang...' });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } catch (err) {
        console.error('Error importing backup:', err);
        setStatusMessage({ type: 'error', text: 'Định dạng tệp JSON không hợp lệ.' });
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    const isReal = databaseMode === 'real';
    const confirmMsg = isReal
      ? 'Bạn có chắc chắn muốn xóa toàn bộ dữ liệu thực tế? Bảng điểm, thời khóa biểu, môn học sẽ trở về trạng thái trường trắng ban đầu.'
      : 'Bạn có chắc chắn muốn đặt lại dữ liệu mẫu về mặc định ban đầu? Toàn bộ các thay đổi cá nhân trong môi trường demo sẽ bị xóa.';

    if (confirm(confirmMsg)) {
      try {
        await dataAccessLayer.resetAll();
        setStatusMessage({
          type: 'success',
          text: isReal
            ? 'Đã xóa trắng dữ liệu thực tế thành công. Đang tải lại...'
            : 'Đã khôi phục dữ liệu mẫu thành công. Đang tải lại...',
        });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (err) {
        console.error('Failed to reset data:', err);
        window.location.reload();
      }
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cài đặt & Tùy chọn hệ thống"
        subtitle="Quản lý hồ sơ sinh viên, giao diện, thang điểm, cấu hình Pomodoro và sao lưu dữ liệu"
        actions={
          <Button
            size="sm"
            onClick={handleSave}
            leftIcon={isSaved ? <Check className="h-4 w-4" /> : undefined}
          >
            {isSaved ? 'Đã lưu tùy chọn!' : 'Lưu thay đổi'}
          </Button>
        }
      />

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Student Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4 text-brand-500" />
              <span>Hồ sơ sinh viên</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Họ và tên"
                value={settings.studentName}
                onChange={(e) => setSettings({ ...settings, studentName: e.target.value })}
              />
              <Input
                label="Trường đại học"
                value={settings.universityName}
                onChange={(e) => setSettings({ ...settings, universityName: e.target.value })}
              />
              <Input
                label="Ngành & Chuyên ngành"
                value={settings.major}
                onChange={(e) => setSettings({ ...settings, major: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Semester Management Card (BUG 01, BUG 02, BUG 03, BUG 04, BUG 05) */}
        <SemesterManagementCard
          semesters={semesters}
          courses={courses}
          onAddSemester={addSemester}
          onUpdateSemester={updateSemester}
          onDeleteSemester={deleteSemester}
          onSetCurrentSemester={setCurrentSemester}
          onTransitionSemester={transitionSemester}
        />

        {/* Visual Appearance & Theme Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              <span>Giao diện & Chủ đề màu sắc</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { type: 'light', label: 'Giao diện sáng', icon: Sun },
                { type: 'dark', label: 'Giao diện tối', icon: Moon },
                { type: 'system', label: 'Mặc định hệ thống', icon: Laptop },
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
                label="Thang điểm GPA"
                value={settings.gradingScaleType}
                onChange={(e) =>
                  setSettings({ ...settings, gradingScaleType: e.target.value as any })
                }
                options={[
                  { value: '4.0', label: 'Thang điểm 4.0 (Chuẩn Quốc tế / Mỹ)' },
                  { value: '10.0', label: 'Thang điểm 10.0 (Việt Nam / Châu Âu)' },
                  { value: 'letter', label: 'Thang điểm chữ (A+, A, B...)' },
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
              <span>Cấu hình đồng hồ Pomodoro</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Input
                label="Thời gian học (phút)"
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
                label="Nghỉ ngắn (phút)"
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
                label="Nghỉ dài (phút)"
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
                label="Chu kỳ nghỉ dài (số phiên)"
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

        {/* Database Environment Management Card */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-brand-500" />
                <span>Môi trường Cơ sở Dữ liệu (Database Mode)</span>
              </CardTitle>
              <Badge variant={databaseMode === 'real' ? 'emerald' : 'amber'} dot>
                {databaseMode === 'real' ? 'Đang dùng Dữ liệu Thực tế' : 'Đang dùng Dữ liệu Mẫu (Demo)'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              UniHub vận hành 2 cơ sở dữ liệu IndexedDB hoàn toàn độc lập. Dữ liệu thực tế là trường trắng dành cho sinh viên học tập hàng ngày, tính toán và hiển thị thời gian thực theo đúng những gì bạn nhập. Dữ liệu mẫu chứa các môn học và thời khóa biểu dựng sẵn phục vụ kiểm thử.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={async () => {
                  if (databaseMode !== 'real') {
                    await switchDatabaseMode('real');
                  }
                }}
                className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all ${
                  databaseMode === 'real'
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Cơ sở Dữ liệu Thực tế (Trường trắng)
                    </span>
                  </div>
                  {databaseMode === 'real' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                      Đang kích hoạt
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Dành cho sinh viên học tập thực tế. Hệ thống khởi tạo trường trắng (0 môn học, 0 bài tập, 0 lịch thi), mọi số liệu và GPA được tính toán động 100% từ dữ liệu bạn thêm.
                </p>
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (databaseMode !== 'demo') {
                    await switchDatabaseMode('demo');
                  }
                }}
                className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all ${
                  databaseMode === 'demo'
                    ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Cơ sở Dữ liệu Mẫu (Demo & Test)
                    </span>
                  </div>
                  {databaseMode === 'demo' && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                      Đang kích hoạt
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Dành cho Tester & Developer. Chứa dữ liệu mẫu hoàn chỉnh (sinh viên Alex Chen, môn CS201, MATH205, TKB tuần, bài tập...) để kiểm tra toàn bộ giao diện và chức năng.
                </p>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Data Persistence, Backup & Disaster Recovery */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Sao lưu dữ liệu ngoại tuyến & Phục hồi</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              UniHub hoạt động 100% cục bộ trên trình duyệt của bạn. Để đảm bảo thời khóa biểu và bảng điểm không bị mất
              khi xóa bộ nhớ đệm trình duyệt, hãy tải xuống tệp JSON sao lưu định kỳ.
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
                Xuất bản sao lưu JSON
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Upload className="h-4 w-4" />}
                onClick={handleImportClick}
              >
                Khôi phục từ tệp sao lưu
              </Button>

              <Button
                type="button"
                variant="danger"
                size="sm"
                leftIcon={<RotateCcw className="h-4 w-4" />}
                onClick={handleResetData}
              >
                {databaseMode === 'real' ? 'Xóa trắng dữ liệu thực tế' : 'Đặt lại dữ liệu mẫu'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
