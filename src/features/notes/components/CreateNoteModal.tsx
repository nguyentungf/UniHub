import React, { useState } from 'react';
import { Modal, Button, Input, Select, Textarea } from '@/components/ui';
import type { Course } from '@/types';
import { cleanTags } from '../utils/noteLogic';

export interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: Course[];
  onCreate: (input: {
    title: string;
    content: string;
    courseId: string | null;
    tags: string[];
    isPinned: boolean;
  }) => Promise<void>;
}

export const CreateNoteModal: React.FC<CreateNoteModalProps> = ({
  isOpen,
  onClose,
  courses,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState<string>('');
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const parsedTags = cleanTags(tagsInput);
      const initialContent =
        content.trim() || `# ${title.trim()}\n\nViết ghi chú bài giảng, công thức hoặc tóm tắt kiến thức ở đây...`;

      await onCreate({
        title: title.trim(),
        content: initialContent,
        courseId: courseId ? courseId : null,
        tags: parsedTags,
        isPinned,
      });

      // Reset form
      setTitle('');
      setCourseId('');
      setTagsInput('');
      setContent('');
      setIsPinned(false);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo ghi chú học tập mới"
      description="Lưu lại kiến thức bài giảng, thuật toán, tài liệu ôn thi hoặc ghi chú môn học"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <Input
          label="Tiêu đề ghi chú *"
          placeholder="Ví dụ: Duyệt đồ thị (BFS & DFS) hoặc Biến đổi tuyến tính"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Môn học liên kết"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            options={[
              { value: '', label: 'Tự do / Không gắn môn' },
              ...courses.map((c) => ({ value: c.id, label: `${c.code} · ${c.name}` })),
            ]}
          />

          <Input
            label="Thẻ (phân tách bằng dấu phẩy)"
            placeholder="Ví dụ: thuat-toan, do-thi, giua-ky"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
          />
        </div>

        <Textarea
          label="Nội dung Markdown ban đầu"
          placeholder="# Chủ đề chính&#10;&#10;Khái niệm cốt lõi:&#10;- Nguyên lý 1&#10;- Nguyên lý 2"
          rows={6}
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />

        <label className="flex items-center gap-2 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Ghim ghi chú này lên đầu danh sách
          </span>
        </label>

        <div className="sticky bottom-0 -mx-6 -mb-5 px-6 py-3.5 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 z-10">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" size="sm" isLoading={isSubmitting}>
            Tạo ghi chú
          </Button>
        </div>
      </form>
    </Modal>
  );
};

