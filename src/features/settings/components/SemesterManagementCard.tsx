import React, { useState } from 'react';
import { Semester, Course } from '@/types';
import { SemesterFormData } from '@/lib/validation/schemas';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui';
import { ConfirmDialog } from '@/components/common';
import {
  GraduationCap,
  Plus,
  ArrowRightLeft,
  Calendar,
  Check,
  Edit2,
  Trash2,
  Sparkles,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { SemesterFormModal } from './SemesterFormModal';
import { SemesterTransitionModal } from './SemesterTransitionModal';

export interface SemesterManagementCardProps {
  semesters: Semester[];
  courses: Course[];
  onAddSemester: (data: SemesterFormData) => Promise<Semester>;
  onUpdateSemester: (id: string, updates: Partial<Semester>) => Promise<Semester>;
  onDeleteSemester: (id: string) => Promise<void>;
  onSetCurrentSemester: (id: string) => Promise<void>;
  onTransitionSemester: (data: SemesterFormData) => Promise<Semester>;
}

export const SemesterManagementCard: React.FC<SemesterManagementCardProps> = ({
  semesters,
  courses,
  onAddSemester,
  onUpdateSemester,
  onDeleteSemester,
  onSetCurrentSemester,
  onTransitionSemester,
}) => {
  const currentSemester = semesters.find((s) => s.isCurrent) || semesters[0];

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [isTransitionModalOpen, setIsTransitionModalOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<Semester | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 3500);
  };

  const handleSaveSemester = async (data: SemesterFormData, id?: string) => {
    try {
      if (id) {
        await onUpdateSemester(id, data);
        showNotification('success', `Đã cập nhật học kỳ "${data.name}"`);
      } else {
        await onAddSemester(data);
        showNotification('success', `Đã tạo mới học kỳ "${data.name}"`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Có lỗi xảy ra khi lưu học kỳ';
      showNotification('error', msg);
      throw err;
    }
  };

  const handleSetCurrent = async (semester: Semester) => {
    try {
      await onSetCurrentSemester(semester.id);
      showNotification('success', `Đã chuyển học kỳ hiện tại sang "${semester.name}"`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể chuyển học kỳ hiện tại';
      showNotification('error', msg);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteCandidate) return;
    try {
      await onDeleteSemester(deleteCandidate.id);
      showNotification('success', `Đã xóa học kỳ "${deleteCandidate.name}"`);
      setDeleteCandidate(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa học kỳ';
      showNotification('error', msg);
      setDeleteCandidate(null);
    }
  };

  const handleTransition = async (data: SemesterFormData) => {
    try {
      await onTransitionSemester(data);
      showNotification('success', `Đã khởi động thành công học kỳ "${data.name}"!`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Chuyển tiếp học kỳ thất bại';
      showNotification('error', msg);
      throw err;
    }
  };

  return (
    <Card className="border border-slate-200/90 dark:border-slate-800">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-brand-500" />
              <span>Quản lý Học kỳ & Mục tiêu GPA</span>
            </CardTitle>
            <Badge variant="brand" size="sm">
              {semesters.length} Học kỳ
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Tạo mới, chỉnh sửa thông tin, thiết lập mục tiêu GPA riêng và chuyển đổi học kỳ làm việc
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {currentSemester && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<ArrowRightLeft className="h-3.5 w-3.5 text-indigo-500" />}
              onClick={() => setIsTransitionModalOpen(true)}
            >
              Chuyển tiếp học kỳ mới
            </Button>
          )}

          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Tạo học kỳ mới
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {statusMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="space-y-3">
          {semesters.map((semester) => {
            const isCurrent = Boolean(semester.isCurrent);
            const linkedCoursesCount = courses.filter((c) => c.semesterId === semester.id).length;
            const isOnlySemester = semesters.length <= 1;

            return (
              <div
                key={semester.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-4 ${
                  isCurrent
                    ? 'border-brand-500/80 bg-brand-50/40 dark:border-brand-500/60 dark:bg-brand-950/30 shadow-xs'
                    : 'border-slate-200/80 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700'
                }`}
              >
                {/* Left: Info & Badges */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {semester.name}
                    </span>
                    {isCurrent && (
                      <Badge variant="emerald" dot size="sm">
                        Học kỳ hiện tại
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-slate-400" />
                      <span>
                        {semester.startDate} → {semester.endDate}
                      </span>
                    </span>

                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5 text-slate-400" />
                      <span>{linkedCoursesCount} Môn học</span>
                    </span>

                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {semester.targetGpa !== undefined && semester.targetGpa !== null
                          ? `Mục tiêu GPA: ${semester.targetGpa.toFixed(2)}`
                          : 'Chưa đặt mục tiêu GPA'}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!isCurrent && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetCurrent(semester)}
                      className="text-xs font-semibold"
                    >
                      Đặt làm hiện tại
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingSemester(semester)}
                    leftIcon={<Edit2 className="h-3.5 w-3.5" />}
                    aria-label={`Chỉnh sửa ${semester.name}`}
                  >
                    Sửa
                  </Button>

                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      if (isCurrent) {
                        showNotification('error', 'Không thể xóa học kỳ đang là hiện tại. Vui lòng chuyển học kỳ khác làm hiện tại trước.');
                        return;
                      }
                      if (isOnlySemester) {
                        showNotification('error', 'Không thể xóa học kỳ duy nhất của hệ thống.');
                        return;
                      }
                      if (linkedCoursesCount > 0) {
                        showNotification('error', `Không thể xóa học kỳ đang chứa ${linkedCoursesCount} môn học. Vui lòng xóa hoặc chuyển các môn học trước.`);
                        return;
                      }
                      setDeleteCandidate(semester);
                    }}
                    disabled={isCurrent || isOnlySemester || linkedCoursesCount > 0}
                    leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                    title={
                      isCurrent
                        ? 'Không thể xóa học kỳ hiện tại'
                        : isOnlySemester
                        ? 'Không thể xóa học kỳ duy nhất'
                        : linkedCoursesCount > 0
                        ? `Đang chứa ${linkedCoursesCount} môn học`
                        : 'Xóa học kỳ này'
                    }
                    aria-label={`Xóa ${semester.name}`}
                  >
                    Xóa
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Add Semester Modal */}
      <SemesterFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={async (data) => {
          await handleSaveSemester(data);
        }}
        isOnlySemester={semesters.length === 0}
      />

      {/* Edit Semester Modal */}
      <SemesterFormModal
        isOpen={Boolean(editingSemester)}
        onClose={() => setEditingSemester(null)}
        initialData={editingSemester}
        onSave={async (data, id) => {
          await handleSaveSemester(data, id);
          setEditingSemester(null);
        }}
        isOnlySemester={semesters.length <= 1}
      />

      {/* Transition Semester Modal */}
      {currentSemester && (
        <SemesterTransitionModal
          isOpen={isTransitionModalOpen}
          onClose={() => setIsTransitionModalOpen(false)}
          currentSemester={currentSemester}
          onTransition={async (data) => {
            await handleTransition(data);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteCandidate)}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xóa học kỳ"
        description={`Bạn có chắc chắn muốn xóa học kỳ "${deleteCandidate?.name}"? Dữ liệu học kỳ này sẽ bị xóa khỏi hệ thống.`}
        confirmText="Xóa học kỳ"
        variant="danger"
      />
    </Card>
  );
};

