"use client";

import FormField from "@/components/ui/form-field";
import SelectField from "@/components/ui/select-field";
import type { PrivacyLocal } from "@/lib/settings-local";

type PrivacyTabProps = {
  value: PrivacyLocal;
  onChange: (patch: Partial<PrivacyLocal>) => void;
};

const VISIBILITY = [
  { value: "PUBLIC", label: "Все" },
  { value: "FRIENDS_ONLY", label: "Друзья" },
  { value: "PRIVATE", label: "Никто" },
];

const MESSAGES = [
  { value: "EVERYONE", label: "Все" },
  { value: "FRIENDS_DM", label: "Друзья" },
  { value: "NOBODY", label: "Никто" },
];

export default function PrivacyTab({ value, onChange }: PrivacyTabProps) {
  return (
    <>
      <div className="flex w-full flex-col gap-2">
        <h2 className="font-display text-sm font-medium text-mos-text md:text-[17px]">Приватность</h2>
        <p className="font-golos text-sm text-mos-muted">
          Вы можете выбрать, будет ли ваша учетная запись публичной или приватной. Профили
          несовершеннолетних — private by default.
        </p>
      </div>

      <FormField label="Кто может видеть мой профиль?" className="w-full">
        <SelectField
          options={VISIBILITY}
          value={value.profileVisibility}
          onChange={(next) => onChange({ profileVisibility: next as PrivacyLocal["profileVisibility"] })}
        />
      </FormField>

      <FormField label="Кто может писать мне личные сообщения?" className="w-full">
        <SelectField
          options={MESSAGES}
          value={value.messagePermission}
          onChange={(next) => onChange({ messagePermission: next as PrivacyLocal["messagePermission"] })}
        />
      </FormField>
    </>
  );
}
