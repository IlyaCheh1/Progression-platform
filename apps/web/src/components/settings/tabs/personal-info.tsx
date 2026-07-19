"use client";

import { useState } from "react";
import Checkbox from "@/components/ui/checkbox";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import SelectField from "@/components/ui/select-field";
import Textarea from "@/components/ui/textarea";
import type { GenderId } from "@/lib/avatars";
import { COUNTRY_OPTIONS, type PersonalLocal } from "@/lib/settings-local";

type PersonalInfoTabProps = {
  username: string;
  email: string;
  gender: GenderId;
  local: PersonalLocal;
  onUsernameChange: (value: string) => void;
  onGenderChange: (value: GenderId) => void;
  onLocalChange: (patch: Partial<PersonalLocal>) => void;
  onSubmit: () => Promise<void>;
  isSubmitting: boolean;
  errors: Partial<Record<"username" | "firstName" | "lastName" | "phone" | "about", string>>;
};

export default function PersonalInfoTab({
  username,
  email,
  gender,
  local,
  onUsernameChange,
  onGenderChange,
  onLocalChange,
  onSubmit,
  isSubmitting,
  errors,
}: PersonalInfoTabProps) {
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    try {
      await onSubmit();
      setSuccess(true);
      window.setTimeout(() => setSuccess(false), 3000);
    } catch {
      setSuccess(false);
    }
  }

  return (
    <>
      <h2 className="font-display text-sm font-medium text-mos-text md:text-[17px]">Личные данные</h2>
      <form onSubmit={(e) => void handleSubmit(e)} className="mt-1 flex w-full flex-col gap-4">
        <div className="flex w-full flex-col gap-4 md:flex-row">
          <FormField label="Имя" htmlFor="first_name" className="flex-1" error={errors.firstName}>
            <Input
              id="first_name"
              value={local.firstName}
              onValueChange={(value) => onLocalChange({ firstName: value })}
            />
          </FormField>
          <FormField label="Фамилия" htmlFor="last_name" className="flex-1" error={errors.lastName}>
            <Input
              id="last_name"
              value={local.lastName}
              onValueChange={(value) => onLocalChange({ lastName: value })}
            />
          </FormField>
        </div>

        <div className="flex w-full flex-col gap-4 md:flex-row">
          <FormField label="Дата рождения" htmlFor="birth_date" className="flex-1">
            <Input
              id="birth_date"
              type="date"
              value={local.birthDate}
              onValueChange={(value) => onLocalChange({ birthDate: value })}
            />
          </FormField>
          <FormField label="Ник" htmlFor="username" className="flex-1" error={errors.username}>
            <Input id="username" value={username} onValueChange={onUsernameChange} />
          </FormField>
        </div>

        <div className="flex w-full flex-col gap-4 md:flex-row">
          <FormField label="Номер телефона" htmlFor="phone" className="flex-1" error={errors.phone}>
            <Input
              id="phone"
              type="tel"
              value={local.phone}
              onValueChange={(value) => onLocalChange({ phone: value })}
            />
          </FormField>
          <FormField label="Электронная почта" htmlFor="email" className="flex-1">
            <Input id="email" type="email" value={email} disabled />
          </FormField>
        </div>

        <FormField label="Выберите ваш пол" className="w-full">
          <div className="mt-1 flex items-center gap-4 md:mt-3">
            <Checkbox
              label="Мужской"
              checked={gender === "MALE"}
              size="lg"
              onClick={() => onGenderChange("MALE")}
            />
            <Checkbox
              label="Женский"
              checked={gender === "FEMALE"}
              size="lg"
              onClick={() => onGenderChange("FEMALE")}
            />
          </div>
        </FormField>

        <FormField label="О себе" htmlFor="about" className="w-full" error={errors.about}>
          <Textarea
            id="about"
            maxLength={300}
            value={local.about}
            onValueChange={(value) => onLocalChange({ about: value })}
            placeholder="Расскажите о себе в зале…"
          />
          <p className="mt-1 text-right text-[10px] text-mos-muted">{local.about.length}/300</p>
        </FormField>

        <div className="flex w-full flex-col gap-4 md:flex-row">
          <FormField label="Язык" className="flex-1">
            <SelectField
              options={[{ value: "RU", label: "Русский" }]}
              value={local.language}
              onChange={(value) => onLocalChange({ language: value })}
              disabled
            />
          </FormField>
          <FormField label="Страна" className="flex-1">
            <SelectField
              options={COUNTRY_OPTIONS}
              value={local.country}
              onChange={(value) => onLocalChange({ country: value })}
            />
          </FormField>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="og-btn og-btn-primary og-btn-md mt-2 w-full uppercase md:w-auto md:self-end"
        >
          {isSubmitting ? "Сохранение..." : success ? "Изменения сохранены!" : "Сохранить"}
        </button>
      </form>
    </>
  );
}
