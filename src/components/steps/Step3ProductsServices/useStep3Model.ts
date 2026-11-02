import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { ProfileData, ProductItem } from '@/types/profile';
import { step3ProductsServicesSchema, createProductSchema } from '@/schemas/cardProfileSchema';
import { generateProductDescription } from '@/utils/aiGenerator';
import { compressImage } from '@/utils/imageCompressor';
import {
  getCustomerProducts,
  syncCustomerProducts,
  deleteCustomerProduct,
  normalizeBackendProduct,
  isTempProductId,
} from '@/lib/api/customerProductsApi';
import { reorderList, reorderErrorText } from '@/lib/api/reorderApi';
import { useDragReorder, moveItem } from '@/hooks/useDragReorder';

export interface Step3Props {
  profile: ProfileData;
  onChange: <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => void;
  onNext: () => void;
  onPrev: () => void;
  onToast: (msg: string) => void;
  adminId?: string;
}

/** Images allowed on one product */
export const MAX_PRODUCT_IMAGES = 20;

/** State and handlers of Step 3 (Products & Services): product list, add / edit modal, reorder, Save & Next */
export const useStep3Model = ({ profile, onChange, onNext, onToast, adminId }: Step3Props) => {
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

  return {
    profile, onChange, isSubmitting, handleSaveAndNext,
    openAddModal, openEditModal, handleDelete, productDragProps, productDragClass,
    isModalOpen, setIsModalOpen, editingId, isSavingProduct, handleSaveModal,
    name, setName, description, setDescription, price, setPrice, handleAiGenerateDesc, handleTitleBlur,
    hideEnquiry, setHideEnquiry, hideDownload, setHideDownload,
    setCustomiseMessage, customMessageText, setCustomMessageText, isEnquiryModalOpen, setIsEnquiryModalOpen,
    images, handleAddProductImage, handleDeleteImage, activeKebabIndex, setActiveKebabIndex,
  };
};

export type Step3Model = ReturnType<typeof useStep3Model>;
