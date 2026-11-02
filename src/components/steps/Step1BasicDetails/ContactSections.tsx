import React from 'react';
import { MapPin, Trash2, Globe, Mail, ExternalLink } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import GenericTextArea from '@/components/Forms/TextArea/GenericTextArea';
import { Step1Model } from './useStep1Model';
import { CARD_CLASS, CardTitle, AddMoreButton, TEXT_INPUT_CLASS } from './ui';

const SMALL_INPUT_CLASS =
  "w-full h-9 px-2 rounded border border-[#C4C4C4] bg-white text-[14px] text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] outline-none focus:border-[#2196F3]";

/** 4. Address Details: address, map link (with Test), pincode lookup + up to 3 extra addresses */
export const AddressSection: React.FC<{ m: Step1Model }> = ({ m }) => {
  const { profile, onChange, extraAddresses, handleAddAddress, handleUpdateAddress, handleRemoveAddress, handleTestPin, isLookingUpPin, handlePincodeChange } = m;
  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between">
        <CardTitle icon={<MapPin className="w-3.5 h-3.5 text-[#2196F3]" />}>Address Details</CardTitle>
        <AddMoreButton label="Add Address" count={extraAddresses.length} onClick={handleAddAddress} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
        <div>
          <GenericTextArea
            label="Enter Address *"
            rows={2}
            value={profile.address}
            onChange={(e) => onChange('address', e.target.value)}
            placeholder="Add- assaoliving, bouta waddo, assagao, north goa"
            required
          />
        </div>

        <div className="flex flex-col justify-between gap-2">
          <div>
            <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
              Enter Map Location link (Optional)
            </label>
            <div className="flex gap-2">
              <div className="flex-1">
                <GenericInputField
                  value={profile.mapLink}
                  onChange={(e) => onChange('mapLink', e.target.value)}
                  placeholder="https://maps.google.com/?q=..."
                />
              </div>
              <button
                type="button"
                onClick={() => handleTestPin()}
                className="px-3 h-9 rounded bg-[#2196F3] text-white text-[14px] font-medium hover:bg-[#1E88E5] transition-colors flex items-center gap-1 shrink-0"
                title="Test Google Map Link"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* Pincode & City Auto-Lookup (Helper) */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">
                Pincode {isLookingUpPin && '...'}
              </label>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                value={profile.pincode || ''}
                onChange={(e) => handlePincodeChange(e.target.value)}
                placeholder="416416"
                className={SMALL_INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={profile.city || ''}
                onChange={(e) => onChange('city', e.target.value)}
                placeholder="City"
                className={SMALL_INPUT_CLASS}
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-gray-700 mb-1">State</label>
              <input
                type="text"
                value={profile.state || ''}
                onChange={(e) => onChange('state', e.target.value)}
                placeholder="State"
                className={SMALL_INPUT_CLASS}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Extra Addresses (limit 3) */}
      {extraAddresses.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#E0E0E0]">
          <span className="text-[12px] font-bold text-gray-700">Additional Addresses</span>
          {extraAddresses.map((addr, idx) => (
            <div key={idx} className="p-2.5 bg-white rounded-lg border border-[#E0E0E0] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-gray-700">Address #{idx + 2}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAddress(idx)}
                  className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors"
                  title="Remove Address"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <GenericTextArea
                  label="Enter Address"
                  rows={2}
                  value={addr.address}
                  onChange={(e) => handleUpdateAddress(idx, 'address', e.target.value)}
                  placeholder="Branch or warehouse address"
                />
                <div>
                  <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
                    Map Location link (Optional)
                  </label>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <GenericInputField
                        value={addr.mapLink}
                        onChange={(e) => handleUpdateAddress(idx, 'mapLink', e.target.value)}
                        placeholder="https://maps.google.com/?q=..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTestPin(addr.mapLink)}
                      className="px-3 h-9 rounded bg-[#2196F3] text-white text-[14px] font-medium hover:bg-[#1E88E5] shrink-0"
                      title="Test Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** 5. Email Details: primary email + up to 3 extra emails */
export const EmailSection: React.FC<{ m: Step1Model }> = ({ m }) => {
  const { profile, onChange, extraEmails, handleAddEmail, handleUpdateEmail, handleRemoveEmail } = m;
  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between">
        <CardTitle icon={<Mail className="w-3.5 h-3.5 text-[#2196F3]" />}>Email Details (Optional)</CardTitle>
        <AddMoreButton label="Add Email" count={extraEmails.length} onClick={handleAddEmail} />
      </div>

      <div>
        <GenericInputField
          label="Enter E-mail (Optional)"
          type="email"
          value={profile.email}
          onChange={(e) => onChange('email', e.target.value)}
          placeholder="Info@assaoliving.com"
        />
      </div>

      {/* Dynamic Extra Emails (limit 3) */}
      {extraEmails.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#E0E0E0]">
          <span className="text-[12px] font-bold text-gray-700">Additional E-mails</span>
          {extraEmails.map((em, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="email"
                  value={em.email}
                  onChange={(e) => handleUpdateEmail(idx, e.target.value)}
                  placeholder={`Additional Email #${idx + 1}`}
                  className={`w-full h-9 px-2.5 rounded border border-[#C4C4C4] bg-white ${TEXT_INPUT_CLASS}`}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemoveEmail(idx)}
                className="p-2 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors"
                title="Remove Email"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** 6. Website Details: protocol + website link */
export const WebsiteSection: React.FC<{ m: Step1Model }> = ({ m }) => {
  const { profile, onChange } = m;
  return (
    <div className={CARD_CLASS}>
      <CardTitle icon={<Globe className="w-3.5 h-3.5 text-[#2196F3]" />}>Website Details (Optional)</CardTitle>

      <div className="flex gap-2">
        <div className="w-28 sm:w-32 shrink-0">
          <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
            Protocol
          </label>
          <select
            value={profile.websiteProtocol || 'http'}
            onChange={(e) => onChange('websiteProtocol', e.target.value)}
            className="w-full h-9 px-2 rounded border border-[#C4C4C4] bg-white text-[14px] font-medium text-[#000000DE] font-['Roboto',Helvetica,Arial,sans-serif] focus:border-[#2196F3] focus:outline-none"
          >
            <option value="http">http://</option>
            <option value="https">https://</option>
          </select>
        </div>

        <div className="flex-1 min-w-0">
          <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
            Enter Website link (Optional)
          </label>
          <input
            type="text"
            value={profile.website || ''}
            onChange={(e) => onChange('website', e.target.value)}
            placeholder="www.assaoliving.com"
            className={`w-full h-9 px-2.5 rounded border border-[#C4C4C4] bg-white ${TEXT_INPUT_CLASS}`}
          />
        </div>
      </div>
    </div>
  );
};
