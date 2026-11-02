import React, { useState } from 'react';
import { Plus, X, FileText, Download, Trash2, Upload } from 'lucide-react';
import { CompanyDocument } from '@/types/profile';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { Step2Model } from './useStep2Model';
import { BlockHandle } from './BlockHandle';

/** Documents & Brochures: attach form, legacy brochure, and the draggable list of documents */
export const DocumentsBlock: React.FC<{ m: Step2Model }> = ({ m }) => {
  const { profile, onChange, onToast, docDragProps, docDragClass, aboutBlockDropProps, aboutBlockClass } = m;
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');
  const [newDocDescription, setNewDocDescription] = useState('');
  const [selectedDocFile, setSelectedDocFile] = useState<{ file: File; base64: string } | null>(null);

  const closeAddForm = () => {
    setIsAddingDoc(false);
    setNewDocTitle('');
    setNewDocDescription('');
    setSelectedDocFile(null);
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeMb = file.size / (1024 * 1024);
      if (sizeMb > 5.0) {
        onToast(`File size is ${sizeMb.toFixed(1)} MB. Exceeds allowed limit of 5 MB.`);
        return;
      }
      if (!newDocTitle) {
        setNewDocTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedDocFile({
          file,
          base64: (event.target?.result as string) || '',
        });
      };
      reader.readAsDataURL(file);
      onToast(`Selected: ${file.name} (${sizeMb.toFixed(1)} MB)`);
    }
  };

  const handleAttach = () => {
    if (!selectedDocFile?.file) {
      onToast('Please select a document file to attach (PDF, DOC, or Image).');
      return;
    }
    const title = newDocTitle.trim() || selectedDocFile.file.name || 'Official Document';
    const file = selectedDocFile?.file;
    const sizeText = file ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : '1.5 MB';
    const ext = file?.name?.split('.').pop()?.toUpperCase() || 'PDF';

    const newDoc: CompanyDocument = {
      id: `doc_${Date.now()}`,
      name: title,
      fileName: title,
      description: newDocDescription.trim(),
      url: selectedDocFile?.base64 || '',
      size: sizeText,
      uploadedAt: 'Uploaded Just Now',
      type: ext,
      file: file,
    };

    const updated = [...(profile.documents || []), newDoc];
    onChange('documents', updated);
    closeAddForm();
    onToast(`✅ Added document: "${title}"`);
  };

  return (
    <div {...aboutBlockDropProps('documents')} className={`mb-3 pt-3 border-t border-[#c5c6cd]/40 ${aboutBlockClass('documents')}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <label className="text-xs font-bold text-[#091426] flex items-center gap-1">
          <BlockHandle m={m} block="documents" />
          Documents & Brochures
        </label>

        <button
          type="button"
          onClick={() => setIsAddingDoc(true)}
          className="shrink-0 px-3 py-1.5 rounded-xl bg-[#EFF6FF] border border-[#2563EB]/40 text-[#2563EB] text-xs font-bold flex items-center gap-1.5 hover:bg-[#2563EB] hover:text-white transition-all shadow-2xs"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Document</span>
        </button>
      </div>

      {/* Add Document form */}
      {isAddingDoc && (
        <div className="mb-3 p-3 rounded-xl border border-[#2563EB]/30 bg-[#f8faff] animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-blue-100 mb-2.5">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2563EB]" />
              <h4 className="text-xs font-bold text-[#091426]">Attach Document</h4>
            </div>
            <button
              type="button"
              onClick={closeAddForm}
              className="p-1 rounded-lg hover:bg-blue-100 text-slate-500 hover:text-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <GenericInputField
                label="Document Title"
                type="text"
                value={newDocTitle}
                onChange={(e) => setNewDocTitle(e.target.value)}
                placeholder="e.g. MEA Annual Corporate Profile 2026, Product Catalogue, GST Certificate"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
              <textarea
                rows={2}
                maxLength={300}
                value={newDocDescription}
                onChange={(e) => setNewDocDescription(e.target.value)}
                placeholder="Short note about this document (optional)"
                className="w-full px-3 py-2 rounded-xl border border-stroke bg-white text-xs text-[#091426] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]/25 resize-y"
              />
            </div>

            {/* File Dropzone */}
            <div>
              <label className="w-full min-h-[72px] rounded-xl border-2 border-dashed border-[#c5c6cd] hover:border-[#2563EB] bg-white hover:bg-[#EFF6FF]/40 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all p-3 text-center group">
                <Upload className="w-5 h-5 text-[#2563EB] group-hover:scale-110 transition-transform" />
                {selectedDocFile ? (
                  <div className="text-center">
                    <span className="text-xs font-bold text-[#091426] block">
                      📄 {selectedDocFile.file.name}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {(selectedDocFile.file.size / (1024 * 1024)).toFixed(2)} MB • Ready to attach
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-slate-700 group-hover:text-[#2563EB]">
                    Browse document (PDF, DOC, Image - max 5 MB)
                  </span>
                )}
                <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleFilePicked} className="hidden" />
              </label>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeAddForm}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAttach}
                className="px-4 py-1.5 rounded-xl bg-[#2563EB] text-white text-xs font-bold hover:bg-[#1D4ED8] flex items-center gap-1.5 shadow-sm shadow-[#2563EB]/25 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Attach Document</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List of Attached Documents */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
        {/* Legacy single brochure if present */}
        {profile.brochureName && (
          <div
            className="px-2 py-1.5 rounded-lg border border-stroke bg-[#f8f9ff] flex items-center justify-between hover:border-slate-300 transition-all"
            title={`${profile.brochureSize || '2.4 MB'} • ${profile.brochureDate || 'Uploaded'}`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="w-7 h-7 rounded-md bg-red-100 text-red-700 flex items-center justify-center font-bold shrink-0 text-[9px]">
                PDF
              </div>
              <p className="text-xs font-bold text-[#091426] truncate">
                {profile.brochureName}
              </p>
            </div>

            <div className="flex items-center shrink-0 ml-1">
              <button
                type="button"
                onClick={() => onToast(`Downloading ${profile.brochureName}`)}
                className="p-1.5 text-[#45474c] hover:text-[#2563EB] rounded-lg hover:bg-white transition-colors"
                title="Download Document"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange('brochureName', '');
                  onToast('Brochure removed.');
                }}
                className="p-1.5 text-[#45474c] hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                title="Remove Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Multiple uploaded documents */}
        {profile.documents && profile.documents.length > 0 && (
          profile.documents.map((doc, docIdx) => {
            const fileName = doc.fileName || doc.name || 'Document';
            const fileUrl = doc.url || '';
            const isImage = doc.type === 'IMAGE' || fileUrl.match(/\.(jpeg|jpg|png|webp)/i);
            const isPdf = doc.type === 'PDF' || fileUrl.toLowerCase().endsWith('.pdf') || fileName.toLowerCase().endsWith('.pdf');
            const badgeLabel = isPdf ? 'PDF' : isImage ? 'IMG' : 'DOC';

            return (
              <div
                key={doc.id}
                {...docDragProps(docIdx)}
                className={`px-2 py-1.5 rounded-lg border border-slate-200/80 bg-white hover:border-[#2563EB]/40 flex items-center justify-between transition-all group cursor-grab active:cursor-grabbing ${docDragClass(docIdx)}`}
                title={`Drag to reorder • ${doc.size || (isImage ? 'Image Document' : 'Official Document')} • ${doc.uploadedAt || 'Attached'}`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-[9px] shrink-0 ${
                    isPdf
                      ? 'bg-red-50 text-red-600 border border-red-200/60'
                      : isImage
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60'
                      : 'bg-blue-50 text-blue-600 border border-blue-200/60'
                  }`}>
                    {badgeLabel}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-[#091426] truncate group-hover:text-[#2563EB] transition-colors">
                      {fileName}
                    </p>
                    {doc.description && (
                      <p className="text-[10px] text-gray-500 truncate">{doc.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center shrink-0 ml-1">
                  {fileUrl && (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-500 hover:text-[#2563EB] rounded-lg hover:bg-blue-50 transition-colors"
                      title="View / Download Document"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      const updated = (profile.documents || []).filter(d => d.id !== doc.id);
                      onChange('documents', updated);
                      if (doc.id && !doc.id.startsWith('doc_')) {
                        const currentRemoved = (profile as any).removeDocumentIds || [];
                        onChange('removeDocumentIds' as any, [...currentRemoved, doc.id]);
                      }
                      onToast(`Removed document: "${fileName}"`);
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Remove Document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {/* Empty state when no documents uploaded */}
        {(!profile.documents || profile.documents.length === 0) && !profile.brochureName && !isAddingDoc && (
          <div className="col-span-full p-3 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
            <FileText className="w-6 h-6 text-slate-300 mx-auto mb-1" />
            <p className="text-xs text-slate-600 font-semibold">No documents uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
