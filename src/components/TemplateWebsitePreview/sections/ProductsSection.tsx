import React from 'react';
import { Mail, Package, Download } from 'lucide-react';
import { SectionProps } from '../useTemplateModel';
import { SectionTitle } from '../SectionTitle';
import { ProductImageSlider } from '../ProductImageSlider';
import { stripHtml, formatPrice, productImages, downloadImage, titleParts } from '../helpers';

/** Our Products (every product: list on mobile, grid on desktop) */
export const ProductsSection: React.FC<SectionProps> = ({ t }) => {
  const { isMobile, isTablet, headings, products, sectionRank, setProductPopup, productEnquiryUrl } = t;
  return (
    <section data-section="products" style={{ order: sectionRank('products') }}>
      <SectionTitle isMobile={isMobile} {...titleParts(headings.productsHeading, 'Our Products')} />
      <div>
        <div className="grid gap-3" style={{ gridTemplateColumns: isMobile ? '1fr' : `repeat(${isTablet ? 3 : 4}, minmax(0, 1fr))` }}>
          {products.map((p, idx) => {
            const name = p.name || p.title;
            const price = formatPrice(p.price, p.currency);
            const img = p.image || p.images?.[0];
            return (
              <div key={`${p.id}-${idx}`} className={`group rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md hover:border-[var(--c)] transition-all overflow-hidden flex ${isMobile ? 'flex-row' : 'flex-col'}`}>
                <div className={`${isMobile ? 'w-32 shrink-0' : 'aspect-[4/3]'} bg-[var(--cs)] flex items-center justify-center overflow-hidden`}>
                  {img ? <ProductImageSlider images={productImages(p)} alt={name} onOpen={() => setProductPopup(p)} className="w-full h-full" /> : <Package className="w-8 h-8 text-[var(--c)] opacity-60" />}
                </div>
                <div className="p-2.5 flex-1 flex flex-col min-w-0">
                  <button type="button" onClick={() => setProductPopup(p)} className="text-left min-w-0">
                    <h3 className="text-[12.5px] font-bold text-[#0B1B33] leading-tight line-clamp-1 hover:text-[var(--c)]">{name}</h3>
                    {p.description && <p className="mt-0.5 text-[10.5px] text-slate-500 leading-snug line-clamp-2">{stripHtml(p.description)}</p>}
                    {p.description && <span className="mt-0.5 inline-block text-[10.5px] font-semibold text-[var(--c)]">View details</span>}
                  </button>
                  <div className="mt-auto pt-2 flex items-center justify-between gap-1.5">
                    {price && <span className="text-[13px] font-extrabold text-[#0B1B33]">{price}</span>}
                    <div className="ml-auto flex items-center gap-1.5">
                      {/* Download shown only while the product's "hide download" option is off */}
                      {img && !(p.isHideDownloadProductCart ?? p.hideDownload) && (
                        <button
                          type="button"
                          onClick={() => downloadImage(img, name)}
                          title="Download"
                          aria-label={`Download ${name}`}
                          className="w-6 h-6 rounded-full border border-[var(--c)] text-[var(--c)] hover:bg-[var(--c)] hover:text-white flex items-center justify-center transition-colors"
                        >
                          <Download className="w-3 h-3" />
                        </button>
                      )}
                      {!(p.isHideEnquiry ?? p.hideEnquiry) && (
                        <a href={productEnquiryUrl(p.customEnquiryMessage)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md bg-[var(--c)] hover:bg-[var(--cd)] px-2 py-1 text-[10.5px] font-semibold text-white">
                          <Mail className="w-3 h-3" /> Enquire
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
