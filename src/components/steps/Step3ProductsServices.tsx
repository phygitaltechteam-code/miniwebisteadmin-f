import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, GripVertical, Edit3, Trash2, 
  Check, ArrowRight, ArrowLeft, Image as ImageIcon,
  CheckCircle2, X, Bold, Italic, Link2, List, MoreVertical,
  Upload, Sparkles, Loader2
} from 'lucide-react';
import { ProfileData, ProductItem } from '../../types/profile';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { 
  step3ProductsServicesSchema, 
  createProductSchema, 
  updateProductSchema 
} from '@/schemas/cardProfileSchema';
import { generateProductDescription } from '@/utils/aiGenerator';
import { compressImage } from '@/utils/imageCompressor';
import { 
  getCustomerProducts, 
  syncCustomerProducts, 
  deleteCustomerProduct,
  normalizeBackendProduct
} from '@/lib/api/customerProductsApi';

interface Step3Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onPrev: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

export const Step3ProductsServices: React.FC<Step3Props> = ({
  profile,
  onChange,
  onNext,
  onPrev,
  onToast,
  adminId,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [deletedProductIds, setDeletedProductIds] = useState<(string | number)[]>([]);

  // Auto-fetch existing products from GET customers/products or superAdmin/admin/:adminId/products
  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      try {
        const res = await getCustomerProducts({ page: 1, limit: 100 }, adminId);
        const rawList = (res as any)?.data?.products || (res as any)?.data || (res as any)?.products || (Array.isArray(res) ? res : []);
        if (isMounted && Array.isArray(rawList) && rawList.length > 0 && (!profile.products || profile.products.length === 0)) {
          const normalized = rawList.map(normalizeBackendProduct);
          onChange('products', normalized);
        }
      } catch (err) {
        // Normal if products not saved yet
      }
    };
    loadProducts();
    return () => { isMounted = false; };
  }, [adminId]);

  // Form State adhering to createProductSchema & updateProductSchema
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [price, setPrice] = useState('');
  const [hideEnquiry, setHideEnquiry] = useState(false);
  const [customiseMessage, setCustomiseMessage] = useState(false);
  const [customMessageText, setCustomMessageText] = useState('');
  const [hideDownload, setHideDownload] = useState(false);
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const openAddModal = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setCurrency('INR');
    setPrice('');
    setHideEnquiry(false);
    setCustomiseMessage(false);
    setCustomMessageText('');
    setHideDownload(false);
    setImage('');
    setImageFile(null);
    setRemoveImage(false);
    setIsModalOpen(true);
  };

  const openEditModal = (prod: ProductItem) => {
    setEditingId(prod.id);
    setName(prod.name || prod.title || '');
    setDescription(prod.description || '');
    setCurrency(prod.currency || prod.currencyInfo || 'INR');
    setPrice(prod.price !== undefined && prod.price !== null ? String(prod.price) : '');
    setHideEnquiry(Boolean(prod.isHideEnquiry ?? prod.hideEnquiry));
    setCustomiseMessage(!!prod.customiseMessage);
    setCustomMessageText(prod.customEnquiryMessage || '');
    setHideDownload(Boolean(prod.isHideDownloadProductCart ?? prod.hideDownload));
    setImage(prod.image || '');
    setImageFile(prod.imageFile || null);
    setRemoveImage(false);
    setIsModalOpen(true);
  };

  const handleAiGenerateDesc = () => {
    if (!name.trim()) {
      onToast('Please enter a product or service title first.');
      return;
    }
    const generated = generateProductDescription(name, profile.businessName);
    setDescription(generated);
    onToast(`AI generated description for "${name}"!`);
  };

  const handleTitleBlur = () => {
    if (name.trim().length >= 2 && !description.trim()) {
      const generated = generateProductDescription(name.trim(), profile.businessName);
      setDescription(generated);
      onToast(`AI auto-generated description for "${name.trim()}". Click Regenerate if needed.`);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setRemoveImage(false);
      try {
        const compressed = await compressImage(file, 800, 800, 0.85);
        setImage(compressed);
        onToast('Product image compressed & ready for upload!');
      } catch {
        const url = URL.createObjectURL(file);
        setImage(url);
      }
    }
  };

  const handleRemoveImage = () => {
    setImage('');
    setImageFile(null);
    setRemoveImage(true);
  };

  const handleSaveModal = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Product name is required');
      onToast('Please enter a product or service name.');
      return;
    }

    const parsedPrice = price.trim() === '' ? undefined : Number(price.trim());

    // Validate using backend createProductSchema
    const validationResult = createProductSchema.safeParse({
      name: trimmedName,
      description: description.trim() || undefined,
      currency: currency.trim() || 'INR',
      price: parsedPrice,
      image: image || undefined,
      isHideEnquiry: hideEnquiry,
      isHideDownloadProductCart: hideDownload,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]?.message || 'Please check product details';
      toast.error(firstError);
      return;
    }

    if (editingId !== null) {
      // Update existing product in state
      const updated = profile.products.map(p => {
        if (p.id === editingId) {
          return {
            ...p,
            name: trimmedName,
            title: trimmedName,
            description: description.trim(),
            currency: currency.trim() || 'INR',
            price: price.trim(),
            hideEnquiry,
            isHideEnquiry: hideEnquiry,
            customiseMessage,
            customEnquiryMessage: customiseMessage ? customMessageText.trim() : undefined,
            hideDownload,
            isHideDownloadProductCart: hideDownload,
            image,
            imageFile: imageFile || undefined,
            removeImage,
          };
        }
        return p;
      });
      onChange('products', updated);
      onToast('Product updated successfully!');
    } else {
      // Add new product to state
      const newId = `temp-${Date.now()}`;
      const newProduct: ProductItem = {
        id: newId,
        name: trimmedName,
        title: trimmedName,
        description: description.trim(),
        currency: currency.trim() || 'INR',
        price: price.trim(),
        hideEnquiry,
        isHideEnquiry: hideEnquiry,
        customiseMessage,
        customEnquiryMessage: customiseMessage ? customMessageText.trim() : undefined,
        hideDownload,
        isHideDownloadProductCart: hideDownload,
        image,
        imageFile: imageFile || undefined,
        removeImage: false,
      };

      onChange('products', [...profile.products, newProduct]);
      onToast(`Added: "${trimmedName}"`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = async (id: string | number) => {
    const updated = profile.products.filter(p => p.id !== id);
    onChange('products', updated);
    setDeletedProductIds(prev => [...prev, id]);
    onToast('Product removed from catalog.');
    try {
      if (typeof id === 'string' && !id.startsWith('temp-') && isNaN(Number(id))) {
        await deleteCustomerProduct(id, adminId);
      }
    } catch {
      // Deletions will also be processed during Save & Next
    }
  };

  const handleSaveAndNext = async () => {
    const mapped = (profile.products || []).map(p => ({
      id: p.id,
      name: p.name || p.title,
      title: p.name || p.title,
      description: p.description,
      price: p.price,
      currency: p.currency || 'INR',
      image: p.image,
      isHideEnquiry: p.isHideEnquiry ?? p.hideEnquiry,
      isHideDownloadProductCart: p.isHideDownloadProductCart ?? p.hideDownload,
      isAvailable: true,
    }));

    const result = step3ProductsServicesSchema.safeParse({
      products: mapped,
    });

    if (!result.success) {
      const msg = result.error.errors[0]?.message || 'Please check product details';
      toast.error(`Validation: ${msg}`, { id: 'save-step3' });
      onToast(`⚠️ Validation: ${msg}`);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Syncing products to customers/products API...');
    onToast('Submitting products to server...');

    try {
      const res = await syncCustomerProducts(profile.products || [], deletedProductIds, adminId);
      const serverMsg = res?.message || 'Step 3: Products & Services saved successfully!';
      const displayMsg = `${serverMsg} (customers/products)`;

      toast.success(displayMsg, { id: toastId, duration: 4000 });
      onToast(`✅ ${displayMsg}`);
      onNext();
    } catch (error: any) {
      console.error('[Step3ProductsServices] API Error on customers/products:', error);
      const backendMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to sync products to customers/products API.';
      const statusCode = error?.response?.status ? ` [HTTP ${error.response.status}]` : '';

      const errText = `API Error${statusCode}: ${backendMessage}`;
      toast.error(errText, { id: toastId, duration: 5000 });
      onToast(`❌ ${errText}`);
      // Proceed on non-fatal error so user can continue filling profile
      onNext();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-white border border-[#c5c6cd]/60 rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-xs scroll-mt-28" id="sec-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#c5c6cd]/40 mb-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
            3
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
            Products & Services
          </h2>
        </div>

        <GenericButton
          type="button"
          onClick={openAddModal}
          className="!px-2.5 sm:!px-4 !py-1 sm:!py-2 !text-xs font-bold flex items-center gap-1 sm:gap-1.5 shrink-0 shadow-md shadow-[#2563EB]/20"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Add Product/Service</span>
          <span className="sm:hidden">Add Product</span>
        </GenericButton>
      </div>

      {/* Product List Container */}
      <div className="space-y-2.5">
        {profile.products.length === 0 ? (
          <div className="p-5 rounded-xl border border-dashed border-slate-200 text-center bg-slate-50/50">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-2">
              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800">No products or services added yet</p>
          </div>
        ) : (
          profile.products.map((product, index) => {
          return (
            <div 
              key={product.id}
              className="border border-stroke rounded-xl p-2.5 sm:p-3 bg-[#f8f9ff]/60 hover:bg-white hover:border-[#2563EB]/40 transition-all shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                  <span className="hidden sm:flex w-6 h-6 rounded-full bg-[#EFF6FF] text-[#2563EB] text-xs items-center justify-center font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </span>

                  {/* Thumbnail */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-white border border-stroke overflow-hidden shrink-0 flex items-center justify-center shadow-2xs">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name || product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-gray-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-[#091426] truncate">
                        {product.name || product.title}
                      </h4>
                      {product.price !== undefined && product.price !== '' && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                          {product.currency || 'INR'} {product.price}
                        </span>
                      )}
                    </div>

                    {product.description && (
                      <p className="text-xs text-[#5a5c61] line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-gray-500">
                      <span className={`px-2 py-0.5 rounded ${(product.isHideEnquiry ?? product.hideEnquiry) ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700 font-medium'}`}>
                        {(product.isHideEnquiry ?? product.hideEnquiry) ? 'Enquiry Hidden' : 'Enquiry Active'}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${(product.isHideDownloadProductCart ?? product.hideDownload) ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700 font-medium'}`}>
                        {(product.isHideDownloadProductCart ?? product.hideDownload) ? 'Card Download Hidden' : 'Card Download Active'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => openEditModal(product)}
                    className="p-2 text-gray-500 hover:text-[#2563EB] rounded-lg hover:bg-white border border-transparent hover:border-stroke transition-all"
                    title="Edit Product"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(product.id)}
                    className="p-2 text-gray-500 hover:text-rose-600 rounded-lg hover:bg-white border border-transparent hover:border-stroke transition-all"
                    title="Delete Product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        }))}
      </div>

      {/* MODAL: Add Product/Service details (matching backend createProductSchema / updateProductSchema) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full border border-stroke overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stroke">
              <h3 className="text-base font-bold text-[#091426]">
                {editingId ? 'Edit Product/Service' : 'Add Product/Service'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 overflow-y-auto">
              <div className="space-y-3">
                {/* Product Name */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1 block">
                    Product Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={150}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleTitleBlur}
                    placeholder="Enter Product/Service name (e.g. Premium Consulting)"
                    className="w-full h-10 px-3.5 rounded-lg border border-stroke bg-white text-xs text-[#091426] placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none"
                  />
                </div>

                {/* Product Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                      Product Description
                    </label>
                    <button
                      type="button"
                      onClick={handleAiGenerateDesc}
                      className="px-2.5 py-1 rounded-md bg-blue-50 text-[#2563EB] border border-blue-200 text-[11px] font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors shadow-2xs"
                      title={description ? 'Regenerate description if you want a different variation' : 'Generate professional description using AI'}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{description ? 'Regenerate' : 'AI Write'}</span>
                    </button>
                  </div>
                  <div className="border border-stroke rounded-lg overflow-hidden bg-white">
                    {/* Toolbar */}
                    <div className="flex items-center border-b border-stroke bg-gray-50/70 px-2 py-1 gap-1 text-gray-600 text-xs">
                      <span className="px-2 py-0.5 text-xs text-gray-700 font-medium">Paragraph ▾</span>
                      <div className="h-4 w-px bg-gray-300 mx-1" />
                      <button type="button" className="p-1 hover:bg-gray-200 rounded font-bold" title="Bold">B</button>
                      <button type="button" className="p-1 hover:bg-gray-200 rounded italic" title="Italic">I</button>
                      <button type="button" className="p-1 hover:bg-gray-200 rounded" title="Link"><Link2 className="w-3.5 h-3.5" /></button>
                      <button type="button" className="p-1 hover:bg-gray-200 rounded" title="List"><List className="w-3.5 h-3.5" /></button>
                      <div className="ml-auto">
                        <MoreVertical className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      maxLength={2000}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Write brief description..."
                      className="w-full p-3 text-xs text-[#091426] focus:outline-none resize-y"
                    />
                  </div>
                </div>

                {/* Price Row with Currency Box */}
                <div className="flex gap-2">
                  <div className="w-24">
                    <label className="text-[10px] text-gray-500 font-semibold mb-1 block">Currency</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                      placeholder="INR"
                      className="w-full h-11 px-2.5 text-center font-bold rounded-lg border border-stroke bg-gray-50 text-xs text-[#091426] focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[10px] text-gray-500 font-semibold mb-1 block">Price</label>
                    <input
                      type="number"
                      min={0}
                      max={100000000}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Enter Price (Optional, 0 - 10 Cr)"
                      className="w-full h-11 px-3.5 rounded-lg border border-stroke bg-white text-xs text-[#091426] placeholder:text-gray-400 focus:border-[#2563EB] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Hide Enquiry Button Checkbox (isHideEnquiry) */}
                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 select-none">
                    <input
                      type="checkbox"
                      checked={hideEnquiry}
                      onChange={(e) => setHideEnquiry(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    <span>Hide Enquiry Button</span>
                  </label>

                  {/* Customise WhatsApp Enquiry Message Link */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setCustomiseMessage(!customiseMessage)}
                      className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
                    >
                      {customiseMessage ? '✓ Customising Enquiry Message' : 'Customise Your Enquiry Message'}
                    </button>
                    {customiseMessage && (
                      <input
                        type="text"
                        value={customMessageText}
                        onChange={(e) => setCustomMessageText(e.target.value)}
                        placeholder="Hi, I am interested in this product..."
                        className="w-full h-9 px-3 mt-1.5 rounded-lg border border-stroke bg-white text-xs text-[#091426] focus:border-[#2563EB] focus:outline-none"
                      />
                    )}
                  </div>
                </div>

                {/* Hide Download Card Checkbox (isHideDownloadProductCart) */}
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 select-none">
                  <input
                    type="checkbox"
                    checked={hideDownload}
                    onChange={(e) => setHideDownload(e.target.checked)}
                    className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <span>Hide Download Product Card Button</span>
                </label>

                {/* Add / Manage Image Upload Box */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Product Image
                  </label>
                  {image ? (
                    <div className="relative inline-block w-24 h-24 rounded-lg border border-stroke overflow-hidden shadow-xs group">
                      <img src={image} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="absolute top-1 right-1 bg-black/70 hover:bg-rose-600 text-white rounded-full p-1 transition-colors shadow-sm"
                        title="Remove Image"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 rounded-lg border-2 border-dashed border-sky-300 bg-white hover:bg-sky-50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors p-2 text-center group">
                      <Plus className="w-5 h-5 text-sky-500" />
                      <span className="text-[11px] font-bold text-sky-600 leading-tight">
                        Add image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-4 py-3 border-t border-stroke bg-gray-50/50">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-sky-600 hover:text-sky-800 uppercase tracking-wider"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-5 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
              >
                SAVE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step Navigation Buttons */}
      <div className="mt-4 pt-3 border-t border-[#c5c6cd]/40 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border border-stroke bg-white text-[#091426] text-xs font-semibold hover:bg-[#f8f9ff] flex items-center gap-1.5 sm:gap-2 transition-all shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Previous: About & Specialities</span>
          <span className="sm:hidden">Previous</span>
        </button>

        <GenericButton
          type="button"
          onClick={handleSaveAndNext}
          disabled={isSubmitting}
          className="!px-4 sm:!px-6 !py-2.5 !text-xs !font-bold flex items-center gap-2 whitespace-nowrap shadow-md shadow-[#2563EB]/25 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <span>Save & Next</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </GenericButton>
      </div>
    </section>
  );
};
