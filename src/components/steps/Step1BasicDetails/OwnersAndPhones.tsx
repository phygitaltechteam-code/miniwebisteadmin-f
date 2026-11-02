import React from 'react';
import { Trash2, UserPlus, PhoneCall } from 'lucide-react';
import GenericInputField from '@/components/Forms/Input/GenericInputField';
import { Step1Model } from './useStep1Model';
import { CARD_CLASS, CardTitle, AddMoreButton, PrefixSelect, TEXT_INPUT_CLASS } from './ui';

/** 2. Owner Details: primary owner + up to 3 additional owners */
export const OwnersSection: React.FC<{ m: Step1Model }> = ({ m }) => {
  const { profile, onChange, extraOwners, handleAddOwner, handleUpdateOwner, handleRemoveOwner, updatePrimaryFirstName, updatePrimaryLastName } = m;
  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between">
        <CardTitle icon={<UserPlus className="w-3.5 h-3.5 text-[#2196F3]" />}>Owner Details (Optional)</CardTitle>
        <AddMoreButton label="Add Another Name" count={extraOwners.length} onClick={handleAddOwner} />
      </div>

      {/* Primary Owner Form */}
      <div className="grid grid-cols-12 gap-2 sm:gap-2.5 bg-white p-2.5 rounded-lg border border-[#E0E0E0]">
        <div className="col-span-4 sm:col-span-2">
          <PrefixSelect value={profile.prefix || 'None'} onChange={(v) => onChange('prefix', v)} />
        </div>
        <div className="col-span-8 sm:col-span-4">
          <GenericInputField
            label="Enter First Name"
            value={profile.firstName || ''}
            onChange={(e) => updatePrimaryFirstName(e.target.value)}
            placeholder="First name"
          />
        </div>
        <div className="col-span-6 sm:col-span-3">
          <GenericInputField
            label="Enter Last Name"
            value={profile.lastName || ''}
            onChange={(e) => updatePrimaryLastName(e.target.value)}
            placeholder="Last name"
          />
        </div>
        <div className="col-span-6 sm:col-span-3">
          <GenericInputField
            label="Enter Designation"
            value={profile.designation || ''}
            onChange={(e) => onChange('designation', e.target.value)}
            placeholder="e.g. President / Founder"
          />
        </div>
      </div>

      {/* Another Name Details (Dynamic Extra Owners, up to 3) */}
      {extraOwners.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between border-t border-[#E0E0E0] pt-2">
            <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wide">
              Additional Owners
            </span>
            <span className="text-[11px] text-gray-500 font-mono">
              {extraOwners
                .filter((o) => o.firstName)
                .map((o) => `(${o.prefix !== 'None' ? o.prefix + ' ' : ''}${o.firstName} ${o.lastName})`)
                .join(', ')}
            </span>
          </div>

          {extraOwners.map((owner, idx) => (
            <div key={idx} className="p-2.5 bg-white rounded-lg border border-[#E0E0E0] space-y-2 relative">
              <div className="flex items-center justify-between pb-1 border-b border-gray-100">
                <span className="text-[12px] font-bold text-gray-600">
                  Owner #{idx + 2} Details
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveOwner(idx)}
                  className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Remove Owner"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-12 gap-2 sm:gap-2.5">
                <div className="col-span-4 sm:col-span-2">
                  <PrefixSelect value={owner.prefix || 'None'} onChange={(v) => handleUpdateOwner(idx, 'prefix', v)} />
                </div>
                <div className="col-span-8 sm:col-span-4">
                  <GenericInputField
                    label="Enter First Name"
                    value={owner.firstName}
                    onChange={(e) => handleUpdateOwner(idx, 'firstName', e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <GenericInputField
                    label="Enter Last Name"
                    value={owner.lastName}
                    onChange={(e) => handleUpdateOwner(idx, 'lastName', e.target.value)}
                    placeholder="Last name"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <GenericInputField
                    label="Enter Designation"
                    value={owner.designation}
                    onChange={(e) => handleUpdateOwner(idx, 'designation', e.target.value)}
                    placeholder="e.g. Partner / Director"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** 10-digit phone input with the fixed +91 prefix */
const IndianPhoneInput: React.FC<{
  label: React.ReactNode;
  value: string;
  onChange: (digits: string) => void;
  placeholder: string;
  required?: boolean;
}> = ({ label, value, onChange, placeholder, required }) => (
  <div>
    <label className="block text-[14px] font-normal text-[#000000DE] mb-1">{label}</label>
    <div className="flex">
      <span className="inline-flex items-center px-2.5 h-9 rounded-l border border-r-0 border-[#C4C4C4] bg-gray-50 text-[14px] font-medium text-gray-700 select-none">
        +91
      </span>
      <input
        type="tel"
        maxLength={10}
        inputMode="numeric"
        pattern="[0-9]*"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 10))}
        placeholder={placeholder}
        className={`flex-1 min-w-0 h-9 px-2.5 rounded-r border border-[#C4C4C4] bg-white ${TEXT_INPUT_CLASS}`}
        required={required}
      />
    </div>
  </div>
);

/** 3. Phone Number Details: primary, alternate, WhatsApp, landline + up to 3 extra numbers */
export const PhonesSection: React.FC<{ m: Step1Model }> = ({ m }) => {
  const { profile, onChange, extraPhones, handleAddPhone, handleUpdatePhone, handleRemovePhone } = m;
  return (
    <div className={CARD_CLASS}>
      <div className="flex items-center justify-between">
        <CardTitle icon={<PhoneCall className="w-3.5 h-3.5 text-[#2196F3]" />}>Phone number Details</CardTitle>
        <AddMoreButton label="Add Multiple Phone Number" count={extraPhones.length} onClick={handleAddPhone} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
        <IndianPhoneInput
          label={<>Enter Phone No (Required) <span className="text-red-500 font-bold">*</span></>}
          value={profile.primaryPhone}
          onChange={(clean) => {
            onChange('primaryPhone', clean);
            if (!profile.whatsappPhone) onChange('whatsappPhone', clean);
          }}
          placeholder="9930000993"
          required
        />
        <IndianPhoneInput
          label="Enter Alternate No (Optional)"
          value={profile.altPhone || ''}
          onChange={(clean) => onChange('altPhone', clean)}
          placeholder="Alternate phone"
        />
        <IndianPhoneInput
          label="Enter Whatsapp No (Optional)"
          value={profile.whatsappPhone || profile.whatsappNumber || ''}
          onChange={(clean) => {
            onChange('whatsappPhone', clean);
            onChange('whatsappNumber', clean);
          }}
          placeholder="9930000993"
        />

        {/* Landline */}
        <div>
          <label className="block text-[14px] font-normal text-[#000000DE] mb-1">
            Landline No (Optional)
          </label>
          <div className="flex">
            {/* Full number with the city STD code, e.g. 02332345678 */}
            <input
              type="tel"
              maxLength={15}
              inputMode="numeric"
              pattern="[0-9]*"
              value={profile.landline || ''}
              onChange={(e) => {
                const clean = e.target.value.replace(/\D/g, '').slice(0, 15);
                onChange('landline', clean);
              }}
              placeholder="e.g. 0233 2345678 (with STD code)"
              className={`flex-1 min-w-0 h-9 px-2.5 rounded border border-[#C4C4C4] bg-white ${TEXT_INPUT_CLASS}`}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Extra Phones (limit 3) */}
      {extraPhones.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-[#E0E0E0]">
          <span className="text-[12px] font-bold text-gray-700">Additional Phone Numbers</span>
          {extraPhones.map((ph, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-20">
                <input
                  type="text"
                  value={ph.code || '+91'}
                  onChange={(e) => handleUpdatePhone(idx, 'code', e.target.value)}
                  placeholder="+91"
                  className="w-full h-9 px-2 rounded border border-[#C4C4C4] bg-gray-50 text-[14px] font-medium text-center focus:outline-none focus:border-[#2196F3]"
                />
              </div>
              <div className="flex-1">
                <input
                  type="tel"
                  maxLength={10}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={ph.phone}
                  onChange={(e) => handleUpdatePhone(idx, 'phone', e.target.value)}
                  placeholder={`Additional Phone #${idx + 1}`}
                  className={`w-full h-9 px-2.5 rounded border border-[#C4C4C4] bg-white ${TEXT_INPUT_CLASS}`}
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemovePhone(idx)}
                className="p-2 text-red-500 hover:text-red-700 rounded hover:bg-red-50 transition-colors"
                title="Remove Phone"
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
