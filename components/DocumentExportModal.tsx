import React, { useState } from 'react';
import { FileDown, FileText, CheckCircle2, AlertCircle, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TemplateType = 'A' | 'B' | 'C';
type ExportFormat = 'pdf' | 'docx';

interface DocumentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (template: TemplateType, format: ExportFormat, data: { employeeName: string; employerName: string }) => Promise<void>;
  isExporting: boolean;
}

export const DocumentExportModal: React.FC<DocumentExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting
}) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('A');
  const [employeeName, setEmployeeName] = useState('');
  const [employerName, setEmployerName] = useState('');

  const templates = [
    {
      id: 'A' as TemplateType,
      title: 'Memoria Técnica de Cálculo y Fundamentación LFT',
      description: 'Desglose aritmético detallado, fórmulas y artículos de la LFT aplicados. (No requiere datos extra).',
      requiresExtraData: false,
    },
    {
      id: 'B' as TemplateType,
      title: 'Recibo de Finiquito y Liquidación Circunstanciado',
      description: 'Declaraciones legales, recibo de prestaciones y cláusula de liberación mutua.',
      requiresExtraData: true,
    },
    {
      id: 'C' as TemplateType,
      title: 'Carta de Renuncia Voluntaria con Ratificación',
      description: 'Formato estándar con huella, firma y ratificación del finiquito ante testigos.',
      requiresExtraData: true,
    }
  ];

  const handleExport = (format: ExportFormat) => {
    onExport(selectedTemplate, format, { employeeName, employerName });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        >
          {/* Header Sticky */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">Descargar Documento Oficial</h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1">Generador dual: PDF y Word (.docx)</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <X size={20} />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 sm:p-6 overflow-y-auto">
            <h4 className="mb-4 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-500">1. Selecciona la Plantilla</h4>
            <div className="grid gap-3 sm:grid-cols-1">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => setSelectedTemplate(tpl.id)}
                  className={`flex items-start gap-3 sm:gap-4 rounded-xl border p-4 text-left transition-all ${
                    selectedTemplate === tpl.id
                      ? 'border-legal-gold bg-amber-50 ring-1 ring-legal-gold/20'
                      : 'border-slate-200 bg-white hover:border-amber-300 hover:bg-slate-50'
                  }`}
                >
                  <div className={`mt-0.5 shrink-0 rounded-full p-1.5 ${
                    selectedTemplate === tpl.id ? 'bg-legal-gold text-white' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {selectedTemplate === tpl.id ? <CheckCircle2 size={16} /> : <FileText size={16} />}
                  </div>
                  <div>
                    <h5 className={`text-[13px] sm:text-sm font-bold leading-snug ${selectedTemplate === tpl.id ? 'text-slate-900' : 'text-slate-700'}`}>
                      Plantilla {tpl.id}: {tpl.title}
                    </h5>
                    <p className="mt-1 text-[11px] sm:text-xs leading-relaxed text-slate-500">{tpl.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <AnimatePresence mode="popLayout">
              {templates.find(t => t.id === selectedTemplate)?.requiresExtraData && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 overflow-hidden"
                >
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex items-center gap-2">
                      <AlertCircle size={16} className="text-amber-600" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700">Datos Opcionales</h4>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nombre del Trabajador</label>
                        <input
                          type="text"
                          value={employeeName}
                          onChange={(e) => setEmployeeName(e.target.value)}
                          placeholder="Ej. Juan Pérez López"
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-legal-gold focus:outline-none focus:ring-1 focus:ring-legal-gold/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nombre del Patrón / Empresa</label>
                        <input
                          type="text"
                          value={employerName}
                          onChange={(e) => setEmployerName(e.target.value)}
                          placeholder="Ej. Empresa S.A. de C.V."
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-legal-gold focus:outline-none focus:ring-1 focus:ring-legal-gold/50"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-6 sm:mt-8">
              <h4 className="mb-4 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-slate-500">2. Descargar Documento</h4>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pb-4">
                <button
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 sm:py-3.5 text-[13px] sm:text-sm font-bold text-white transition-all hover:bg-slate-800 disabled:opacity-50"
                >
                  {isExporting ? <span className="animate-pulse">Generando...</span> : <><FileDown size={18} /> Descargar PDF</>}
                </button>
                <button
                  onClick={() => handleExport('docx')}
                  disabled={isExporting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 sm:py-3.5 text-[13px] sm:text-sm font-bold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                >
                  {isExporting ? <span className="animate-pulse">Generando...</span> : <><Download size={18} /> Descargar Word (.docx)</>}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
