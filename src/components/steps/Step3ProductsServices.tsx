import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Plus, GripVertical, Edit3, Trash2, 
  Check, ArrowRight, ArrowLeft, Image as ImageIcon,
  CheckCircle2, X, Bold, Italic, Link2, List, MoreVertical,
  Upload, Sparkles, Loader2, Type
} from 'lucide-react';
import { ProfileData, ProductItem } from '../../types/profile';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericButton from '@/components/Forms/Buttons/GenericButton';
import { RichTextEditor } from '@/components/Forms/RichTextEditor';
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
  normalizeBackendProduct,
  isTempProductId

} from '@/lib/api/customerProductsApi';
import { reorderList, reorderErrorText } from '@/lib/api/reorderApi';
import { htmlToText } from '@/utils/richText';
import { useDragReorder, moveItem } from '@/hooks/useDragReorder';

interface Step3Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onPrev: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

/** Images allowed on one product */
const MAX_PRODUCT_IMAGES = 20;

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
  const [isSavingProduct, setIsSavingProduct] = useState(false);

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
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [hideDownload, setHideDownload] = useState(false);
  const [image, setImage] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [activeKebabIndex, setActiveKebabIndex] = useState<number | null>(null);
  // Newly picked files, keyed by their preview so deleting a preview drops its file too
  const [newImages, setNewImages] = useState<{ preview: string; file: File }[]>([]);

  // Close kebab menu on outside click
  useEffect(() => {
    const handleCloseKebab = () => setActiveKebabIndex(null);
    if (activeKebabIndex !== null) {
      document.addEventListener('click', handleCloseKebab);
      return () => document.removeEventListener('click', handleCloseKebab);
    }
  }, [activeKebabIndex]);

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
    setImages([]);
    setNewImages([]);
    setActiveKebabIndex(null);
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
    const prodImages = prod.images && prod.images.length > 0 ? prod.images : prod.image ? [prod.image] : [];
    setImages(prodImages);
    setImage(prodImages[0] || prod.image || '');
    setNewImages([]);
    setActiveKebabIndex(null);
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

  const handleAddProductImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files || []);
    e.target.value = '';
    if (picked.length === 0) return;
    // Up to MAX_PRODUCT_IMAGES per product; extra files are skipped
    const room = MAX_PRODUCT_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`You can add up to ${MAX_PRODUCT_IMAGES} images per product`);
      return;
    }
    const files = picked.slice(0, room);
    if (picked.length > room) toast.error(`Only ${room} more image${room === 1 ? '' : 's'} added (limit ${MAX_PRODUCT_IMAGES})`);

    for (const file of files) {
      let preview: string;
      try {
        preview = await compressImage(file, 800, 800, 0.85);
      } catch {
        preview = URL.createObjectURL(file);
      }
      setImages(prev => {
        const next = [...prev, preview];
        if (!image) setImage(next[0]);
        return next;
      });
      setNewImages(prev => [...prev, { preview, file }]);
    }
    toast.success(files.length > 1 ? `${files.length} images added` : 'Image added to product');
  };

  const handleDeleteImage = (index: number) => {
    const removed = images[index];
    setNewImages(prev => prev.filter(n => n.preview !== removed));
    setImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (image === prev[index]) {
        setImage(next[0] || '');
      }
      return next;
    });
    setActiveKebabIndex(null);
    toast.success('Image removed');
  };

  const handleSaveModal = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Product name is required');
      onToast('Please enter a product or service name.');
      return;
    }

    const parsedPrice = price.trim() === '' ? undefined : Number(price.trim());
    const primaryImg = images.length > 0 ? images[0] : image;

    // Validate using backend createProductSchema
    const validationResult = createProductSchema.safeParse({
      name: trimmedName,
      description: description.trim() || undefined,
      currency: currency.trim() || 'INR',
      price: parsedPrice,
      image: primaryImg || undefined,
      isHideEnquiry: hideEnquiry,
      isHideDownloadProductCart: hideDownload,
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]?.message || 'Please check product details';
      toast.error(firstError);
      return;
    }

    const existing = editingId !== null ? profile.products.find(p => p.id === editingId) : undefined;
    const product: ProductItem = {
      ...(existing || {}),
      id: existing?.id ?? `temp-${Date.now()}`,
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
      image: primaryImg,
      images: images,
      imageFile: undefined,
      imageFiles: newImages.map(n => n.file),
      removeImage: !!existing && images.length === 0,
    };

    // Save this one product right away: POST when new, PATCH when it already has a backend id
    setIsSavingProduct(true);
    try {
      await syncCustomerProducts([product], [], adminId);
      const saved: ProductItem = { ...product, imageFile: undefined, imageFiles: undefined, removeImage: false };
      const nextProducts = existing
        ? profile.products.map(p => (p.id === existing.id ? saved : p))
        : [...profile.products, saved];
      onChange('products', nextProducts);
      toast.success(existing ? 'Product updated' : `Added: "${trimmedName}"`);
      onToast(existing ? 'Product updated successfully!' : `Added: "${trimmedName}"`);
      setIsModalOpen(false);
    } catch (error: any) {
      const backendMessage =
        error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to save product';
      const statusCode = error?.response?.status ? ` [HTTP ${error.response.status}]` : '';
      toast.error(`API Error${statusCode}: ${backendMessage}`);
      onToast(`❌ API Error${statusCode}: ${backendMessage}`);
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    try {
      await deleteCustomerProduct(id, adminId);
      onChange('products', profile.products.filter(p => p.id !== id));
      onToast('Product removed from catalog.');
    } catch (error: any) {
      const backendMessage = error?.response?.data?.message || error?.message || 'Failed to delete product';
      toast.error(`API Error: ${backendMessage}`);
    }
  };

  // Drag & drop product order, saved with PATCH products/reorder (every saved product id, new order)
  const { dragProps: productDragProps, dragClass: productDragClass } = useDragReorder(async (from, to) => {
    const previous = profile.products;
    const reordered = moveItem(previous, from, to);
    const ids = reordered
      .map((p) => String(p._id || p.id))
      .filter((id) => !isTempProductId(id));
    onChange('products', reordered);
    try {
      await reorderList('products', ids, adminId);
      toast.success('Product order saved');
    } catch (error: any) {
      onChange('products', previous);
      toast.error(`API Error: ${reorderErrorText(error, 'Failed to save product order')}`);
    }
  });

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

    // Products are saved one by one from the modal; only retry any that never reached the server
    const unsaved = (profile.products || []).filter(p => isTempProductId(p._id) && isTempProductId(p.id));
    if (unsaved.length === 0) {
      onNext();
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Saving remaining products...');

    try {
      await syncCustomerProducts(unsaved, [], adminId);
      onChange('products', [...profile.products]);
      toast.success('Step 3: Products & Services saved successfully!', { id: toastId, duration: 4000 });
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
    <section className="bg-white border border-[#E0E0E0] rounded-lg p-2.5 sm:p-3.5 shadow-xs scroll-mt-28 font-['Roboto',Helvetica,Arial,sans-serif]" id="sec-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#E0E0E0] mb-3">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#2196F3] flex items-center justify-center font-bold text-xs shrink-0">
            3
          </div>
          <h2 className="text-sm sm:text-base font-bold text-[#091426] leading-tight">
            Products & Services
          </h2>
        </div>

        <GenericButton
          type="button"
          onClick={openAddModal}
          className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-3 sm:!px-4 !py-1.5 !text-[13px] font-medium text-white shadow-none flex items-center gap-1 sm:gap-1.5 shrink-0"
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
              {...productDragProps(index)}
              title="Drag to reorder"
              className={`border border-stroke rounded-xl p-2.5 sm:p-3 bg-[#f8f9ff]/60 hover:bg-white hover:border-[#2563EB]/40 transition-all shadow-2xs cursor-grab active:cursor-grabbing ${productDragClass(index)}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3.5 flex-1 min-w-0">
                  <GripVertical className="w-4 h-4 text-gray-400 shrink-0 mt-1" />
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
                        {htmlToText(product.description)}
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

      {/* MODAL: Edit/Add Product/Service details (Matches User Screenshots Exactly) */}
      {isModalOpen && (
        <div
          className={`${isEnquiryModalOpen ? 'hidden' : 'fixed'} inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200`}
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-bold text-[#091426]">
                {editingId ? 'Edit Product/Service details' : 'Add Product/Service details'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 rounded-lg p-1 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (overflow-x-hidden avoids unwanted horizontal scrollbar) */}
            <div className="p-4 sm:p-5 overflow-y-auto overflow-x-hidden">
              {/* Outer light blue container matching screenshot */}
              <div className="border border-[#bfdbfe] bg-[#f0f7ff]/70 rounded-xl p-3.5 sm:p-4.5 space-y-4">
                {/* Enter Product/Service name (Optional) */}
                <div className="border border-gray-300 rounded-lg bg-white px-3 py-1.5 focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB] transition-all">
                  <label className="block text-[11px] font-medium text-gray-500">
                    Enter Product/Service name (Optional)
                  </label>
                  <input
                    type="text"
                    maxLength={150}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onBlur={handleTitleBlur}
                    placeholder="Digital Business Card & Mini Website"
                    className="w-full bg-transparent text-xs sm:text-sm text-[#091426] font-medium focus:outline-none pt-0.5"
                  />
                </div>

                {/* Product Description */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs sm:text-[13px] font-bold text-gray-800">
                      Product Description
                    </label>
                    <button
                      type="button"
                      onClick={handleAiGenerateDesc}
                      className="px-2.5 py-1 rounded-md bg-blue-50 text-[#2563EB] border border-blue-200 text-[11px] font-bold hover:bg-blue-100 flex items-center gap-1.5 transition-colors shadow-2xs"
                      title={description ? 'Regenerate description' : 'Generate with AI'}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{description ? 'Regenerate' : 'AI Write'}</span>
                    </button>
                  </div>
                  <RichTextEditor
                    label=""
                    value={description}
                    onChange={(val) => setDescription(val)}
                    placeholder="Enter detailed product description..."
                    minHeight="140px"
                    typography={profile.typography}
                    onTypographyChange={(newTypo) => {
                      onChange('typography', newTypo);
                    }}
                  />
                </div>

                {/* Currency & Price Row */}
                <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white focus-within:border-[#2563EB] focus-within:ring-1 focus-within:ring-[#2563EB]">
                  <div className="w-24 border-r border-gray-200 px-3 py-1.5 flex flex-col justify-center bg-gray-50/50">
                    <span className="text-[10px] font-semibold text-gray-500 leading-tight">Currency</span>
                    <span className="text-xs sm:text-sm font-bold text-gray-800 text-center">₹</span>
                  </div>
                  <div className="flex-1 px-3 py-1.5 flex flex-col justify-center">
                    <input
                      type="number"
                      min={0}
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Enter Product/Service Price (Optional)"
                      className="w-full bg-transparent text-xs sm:text-sm text-[#091426] font-medium focus:outline-none"
                    />
                  </div>
                </div>

                {/* Checkboxes & Customise Message link */}
                <div className="space-y-2.5 pt-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 select-none">
                      <input
                        type="checkbox"
                        checked={hideEnquiry}
                        onChange={(e) => setHideEnquiry(e.target.checked)}
                        className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] border-gray-300"
                      />
                      <span>Hide Enquiry Button</span>
                    </label>

                    <button
                      type="button"
                      onClick={() => setIsEnquiryModalOpen(true)}
                      className="text-xs font-bold text-[#1e88e5] hover:text-[#1565c0] hover:underline transition-colors"
                    >
                      Customise Your Enquiry Message
                    </button>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 select-none">
                    <input
                      type="checkbox"
                      checked={hideDownload}
                      onChange={(e) => setHideDownload(e.target.checked)}
                      className="w-4 h-4 rounded text-[#2563EB] focus:ring-[#2563EB] border-gray-300"
                    />
                    <span>Hide Download Product Card Button</span>
                  </label>
                </div>

                {/* Multiple Images List (Matches Screenshot 2) */}
                <div className="pt-2">
                  <p className="mb-1.5 text-[11px] text-gray-500">
                    Images {images.length}/{MAX_PRODUCT_IMAGES}
                  </p>
                  <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    {/* Add Image Button (hidden at the limit) */}
                    {images.length < MAX_PRODUCT_IMAGES && (
                    <label className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl border-2 border-dashed border-[#90caf9] bg-white hover:bg-sky-50 flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors p-2 text-center shrink-0 group">
                      <Plus className="w-5 h-5 text-[#1e88e5]" />
                      <span className="text-[11px] font-bold text-[#1e88e5] leading-tight">
                        + Add image
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleAddProductImage}
                        className="hidden"
                      />
                    </label>
                    )}

                    {/* Uploaded Images with Kebab Menu */}
                    {images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className="relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl border border-dashed border-gray-400 bg-white p-1 shrink-0 flex items-center justify-center group"
                      >
                        <img
                          src={imgUrl}
                          alt={`Product ${idx + 1}`}
                          className="w-full h-full object-contain rounded-lg"
                        />

                        {/* 3-dots kebab menu button */}
                        <div className="absolute top-1 right-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveKebabIndex(activeKebabIndex === idx ? null : idx);
                            }}
                            className="w-6 h-6 rounded-full bg-white/95 hover:bg-white shadow-xs border border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                            title="Options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {activeKebabIndex === idx && (
                            <div className="absolute right-0 top-full mt-1 z-50 w-32 rounded-lg bg-white py-1 shadow-lg border border-gray-200 text-left">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteImage(idx);
                                }}
                                className="w-full px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-colors font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete image</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-[#1e88e5] hover:text-[#1565c0] uppercase tracking-wider transition-colors"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={isSavingProduct}
                className="px-6 py-2 rounded-lg bg-[#1e88e5] hover:bg-[#1976d2] text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isSavingProduct && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isSavingProduct ? 'SAVING...' : 'SAVE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIALOG: Customise Enquiry Message */}
      {isEnquiryModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsEnquiryModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
              <h4 className="text-sm sm:text-base font-bold text-[#091426]">
                Customise Enquiry Message
              </h4>
              <button
                type="button"
                onClick={() => setIsEnquiryModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 rounded-lg p-1 transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5">
              <div className="border border-gray-300 rounded-xl p-3 focus-within:border-[#1e88e5] focus-within:ring-2 focus-within:ring-[#1e88e5]/20 bg-white transition-all shadow-2xs">
                <label className="block text-[11px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  Enter Custom Enquiry Message
                </label>
                <textarea
                  rows={4}
                  value={customMessageText}
                  onChange={(e) => setCustomMessageText(e.target.value)}
                  placeholder="Enter custom enquiry message..."
                  className="w-full bg-transparent text-xs sm:text-sm text-[#091426] font-medium focus:outline-none resize-none leading-relaxed"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 border-t border-gray-100 bg-gray-50/60">
              <button
                type="button"
                onClick={() => setIsEnquiryModalOpen(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setCustomiseMessage(true);
                  setIsEnquiryModalOpen(false);
                  toast.success('Custom enquiry message saved');
                }}
                className="px-6 py-2 rounded-lg bg-[#1e88e5] hover:bg-[#1976d2] text-white text-xs font-bold uppercase tracking-wider shadow-sm active:scale-95 transition-all"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step Navigation Buttons */}
      <div className="mt-4 pt-3 border-t border-[#E0E0E0] flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onPrev}
          className="px-4 py-2 rounded border border-[#C4C4C4] bg-white text-[#000000DE] text-[14px] font-medium hover:bg-gray-50 flex items-center gap-1.5 transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous: About & Specialities</span>
          <span className="sm:hidden">Previous</span>
        </button>

        <GenericButton
          type="button"
          onClick={handleSaveAndNext}
          disabled={isSubmitting}
          className="!bg-[#2196F3] hover:!bg-[#1E88E5] !px-6 !py-2 !text-[14px] font-medium text-white shadow-none flex items-center gap-2 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
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
