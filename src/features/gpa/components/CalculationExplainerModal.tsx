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
      title="How UniHub Calculates Your GPA"
      description="Transparent, credit-weighted mathematics adhering to university accreditation standards"
      size="xl"
    >
      <div className="space-y-6 pt-2 text-sm text-slate-600 dark:text-slate-300">
        {/* Core Formula Box */}
        <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5 dark:border-brand-900/50 dark:bg-brand-950/20">
          <div className="flex items-center gap-2 mb-3">
            <Calculator className="h-5 w-5 text-brand-600 dark:text-brand-400" />
            <h4 className="font-bold text-slate-900 dark:text-white">
              The Fundamental GPA Formula
            </h4>
          </div>

          <div className="rounded-xl bg-white p-4 font-mono text-xs shadow-xs dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="text-brand-700 dark:text-brand-300 font-semibold">
              Quality Points (QP) = Course Credits × Grade Point Value
            </div>
            <div className="text-slate-900 dark:text-white font-bold text-sm">
              GPA = Total Quality Points ÷ Total Attempted Graded Credits
            </div>
          </div>
        </div>

        {/* Walkthrough Table Example */}
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-emerald-500" />
            <span>Step-by-Step Example Walkthrough</span>
          </h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-700 dark:bg-slate-900/70 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 text-left font-semibold">Course</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Credits</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Grade</th>
                  <th className="py-2.5 px-3 text-center font-semibold">Grade Points</th>
                  <th className="py-2.5 px-3 text-right font-semibold">Quality Points (QP)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-200">
                    CS201 Data Structures
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
                    MATH205 Linear Algebra
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
                    ENG102 Tech Writing
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
                  <td className="py-2 px-3">Total Sums</td>
                  <td className="py-2 px-3 text-center font-mono">9.0 Credits</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-center">-</td>
                  <td className="py-2 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    33.7 Total QP
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-right font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
            Calculated Semester GPA = 33.7 ÷ 9.0 = <span className="text-brand-600 dark:text-brand-400 text-sm">3.74</span>
          </div>
        </div>

        {/* GPA vs Percentage Distinction */}
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2">
            <Percent className="h-4 w-4 text-indigo-500" />
            <h4 className="font-bold text-slate-900 dark:text-white">
              Distinguishing GPA from Percentage Scores
            </h4>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            UniHub clearly separates your <strong>GPA</strong> (e.g. 3.74 / 4.00, scaled quality points per credit)
            from your <strong>Weighted Percentage Average</strong> (e.g. 91.7% / 100%, based on raw course percentage scores).
            A 90% score reflects an A- in standard US grading, resulting in 3.70 grade points, rather than directly dividing by 25.
          </p>
        </div>

        {/* Missing Grades & Edge Cases Policy */}
        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>Academic Edge Cases & Policies</span>
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                ⏳ Missing / In-Progress Grades
              </span>
              Courses without assigned grades are strictly <strong>excluded from the GPA denominator</strong>.
              They are never defaulted to 0.0, ensuring your cumulative GPA is protected before final grades are published.
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                🚫 Dropped Courses
              </span>
              Courses with a status of &quot;dropped&quot; (or withdrawal &quot;W&quot;) are completely excluded from both credit counts and GPA quality point totals.
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                ❌ Failing Grades (F / 0.0)
              </span>
              Failing courses provide 0 Quality Points, but their credits are counted in <em>attempted credits</em>, properly lowering the GPA according to university regulations.
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 dark:bg-slate-900/40 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white block mb-1">
                ⚙️ Active Scale: {scale.name}
              </span>
              Maximum possible GPA is <strong>{scale.maxGpa.toFixed(2)}</strong>. All conversions and quality points reflect this scale&apos;s configured thresholds.
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={onClose}>
            Got it, thanks!
          </Button>
        </div>
      </div>
    </Modal>
  );
};

