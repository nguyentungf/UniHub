import React from 'react';
import { Modal, Button, Badge } from '@/components/ui';
import {
  Calculator,
  BookOpen,
  Award,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Percent,
} from 'lucide-react';
import { GradingScale } from '@/types';

interface CalculationExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  scale: GradingScale;
}

export const CalculationExplainerModal: React.FC<CalculationExplainerModalProps> = ({
  isOpen,
  onClose,
  scale,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cách UniHub tính toán điểm GPA của bạn"
      description="Công thức toán học minh bạch theo tín chỉ chuẩn quy chế đào tạo đại học"
      size="2xl"
      footer={
        <Button variant="primary" onClick={onClose}>
          Đã hiểu, cảm ơn!
        </Button>
      }
    >
      <div className="space-y-6 text-sm text-slate-600 dark:text-slate-300">
        {/* Core Formula Box */}
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5 dark:border-brand-900/50 dark:bg-brand-950/20">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h4 className="font-bold text-slate-900 dark:text-white">
              Công thức tính GPA cốt lõi
            </h4>
          </div>

          <div className="rounded-xl bg-white p-4 font-mono text-xs shadow-xs dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="text-brand-700 dark:text-brand-300 font-semibold">
              Điểm chất lượng (QP) = Số tín chỉ môn học × Điểm hệ số
            </div>
            <div className="text-slate-900 dark:text-white font-bold text-sm">
              GPA = Tổng điểm chất lượng (QP) ÷ Tổng số tín chỉ tính điểm
            </div>
          </div>
        </div>

        {/* Walkthrough Table Example */}
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            <span>Ví dụ minh họa từng bước</span>
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-700 dark:bg-slate-900/70 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 text-left font-semibold">Môn học</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Tín chỉ</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Điểm chữ</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Điểm hệ số</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Điểm chất lượng (QP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    CS201 Cấu trúc dữ liệu
                  </td>
                  <td className="py-2 px-3 text-center">4.0</td>
                  <td className="py-2 px-3 text-center">
                    <Badge variant="brand" size="sm">A (94%)</Badge>
                  </td>
                  <td className="py-2 px-3 text-center font-mono">4.0</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-brand-600 dark:text-brand-400">
                    4 × 4.0 = 16.0
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    MATH205 Đại số tuyến tính
                  </td>
                  <td className="py-2 px-3 text-center">3.0</td>
                  <td className="py-2 px-3 text-center">
                    <Badge variant="brand" size="sm">A- (91%)</Badge>
                  </td>
                  <td className="py-2 px-3 text-center font-mono">3.7</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-brand-600 dark:text-brand-400">
                    3 × 3.7 = 11.1
                  </td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    ENG102 Tiếng Anh chuyên ngành
                  </td>
                  <td className="py-2 px-3 text-center">2.0</td>
                  <td className="py-2 px-3 text-center">
                    <Badge variant="brand" size="sm">B+ (88%)</Badge>
                  </td>
                  <td className="py-2 px-3 text-center font-mono">3.3</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-brand-600 dark:text-brand-400">
                    2 × 3.3 = 6.6
                  </td>
                </tr>
                <tr className="bg-slate-50/80 dark:bg-slate-900/40 font-bold text-slate-900 dark:text-white">
                  <td className="py-2 px-3">Tổng cộng</td>
                  <td className="py-2 px-3 text-center font-mono">9.0 Tín chỉ</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    33.7 Tổng QP
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-right font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
            GPA học kỳ tính được = 33.7 ÷ 9.0 = <span className="text-brand-600 dark:text-brand-400 text-sm">3.74</span>
          </div>
        </div>

        {/* GPA vs Percentage Distinction */}
        {/* <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-indigo-500" />
            <h4 className="font-bold text-slate-900 dark:text-white">
              Phân biệt giữa GPA và Điểm phần trăm trung bình
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            UniHub tách biệt rõ ràng giữa <strong>Điểm GPA</strong> (VD: 3.74 / 4.00, điểm chất lượng chia theo tín chỉ)
            và <strong>Điểm phần trăm trung bình</strong> (VD: 91.7% / 100%, dựa trên điểm thi thô các môn).
            Điểm 90% tương ứng mức điểm A- trong thang điểm chuẩn, quy đổi ra 3.70 điểm hệ số.
          </p>
        </div> */}

        {/* Missing Grades & Edge Cases Policy */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>Các trường hợp đặc biệt & Quy tắc tính</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                ⏳ Môn chưa có điểm / Đang học
              </span>
              Các môn học chưa có điểm số được <strong>loại khỏi mẫu số tính GPA</strong>.
              Hệ thống không mặc định về 0.0 để bảo vệ GPA tích lũy của bạn trước khi có kết quả chính thức.
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                🚫 Môn đã hủy / Rút môn
              </span>
              Các môn học có trạng thái &quot;đã hủy&quot; (hoặc rút môn &quot;W&quot;) hoàn toàn không tính vào số tín chỉ hay điểm chất lượng GPA.
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                ❌ Điểm không đạt (F / 0.0)
              </span>
              Môn bị trượt nhận 0 điểm chất lượng, nhưng số tín chỉ vẫn tính vào <em>tín chỉ đăng ký</em>, làm giảm GPA theo đúng quy chế đào tạo.
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                🎯 Môn 0 tín chỉ (Môn điều kiện / Ngoại khóa)
              </span>
              Các môn học có <strong>0 tín chỉ</strong> (như Thể dục, GDQP, Kỹ năng mềm) hoàn toàn <strong>không tính vào điểm GPA học kỳ và CPA tích lũy</strong>.
            </div>

            {/* <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                ⚙️ Thang điểm hoạt động: {scale.name}
              </span>
              Điểm GPA tối đa là <strong>{scale.maxGpa.toFixed(2)}</strong>. Mọi quy đổi điểm số và chất lượng phản ánh chính xác các mốc cấu hình của thang điểm này.
            </div> */}
          </div>
        </div>
      </div>
    </Modal>
  );
};

