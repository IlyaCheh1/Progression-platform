"use client";

import Checkbox from "@/components/ui/checkbox";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";
import type { NotificationsLocal } from "@/lib/settings-local";

type NotificationsTabProps = {
  value: NotificationsLocal;
  onChange: (patch: Partial<NotificationsLocal>) => void;
  emailError?: string;
};

export default function NotificationsTab({ value, onChange, emailError }: NotificationsTabProps) {
  return (
    <>
      <div className="flex w-full flex-col gap-2">
        <h2 className="font-display text-sm font-medium text-mos-text md:text-[17px]">Уведомления</h2>
        <p className="font-golos text-sm text-mos-muted">
          Управляйте настройками уведомлений и подписками школы
        </p>
      </div>

      <FormField label="Выберите подписки на уведомления" className="w-full">
        <div className="mt-1 flex flex-wrap items-center gap-4 md:mt-3">
          <Checkbox
            label="Тренировки"
            size="lg"
            checked={value.training}
            onChange={(checked) => onChange({ training: checked })}
          />
          <Checkbox
            label="Квесты"
            size="lg"
            checked={value.quests}
            onChange={(checked) => onChange({ quests: checked })}
          />
        </div>
      </FormField>

      <div className="flex w-full flex-col gap-4">
        <h3 className="font-display text-xs text-mos-text md:text-[15px]">Почтовая рассылка</h3>
        <FormField label="Электронная почта" className="w-full" error={emailError}>
          <Input
            type="email"
            value={value.contactEmail}
            onValueChange={(next) => onChange({ contactEmail: next, emailVerified: false })}
            suffix={
              value.emailVerified ? (
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#7dba5a] text-xs text-mos-bg">
                  ✓
                </span>
              ) : (
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-controls-primary-active text-mos-bg"
                  disabled={!value.contactEmail.trim() || !!emailError}
                  onClick={() => {
                    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.contactEmail)) return;
                    onChange({ emailEnabled: true, emailVerified: true });
                  }}
                  aria-label="Подтвердить почту"
                >
                  →
                </button>
              )
            }
          />
        </FormField>

        <div className="flex flex-wrap gap-3">
          {value.emailEnabled ? (
            <button
              type="button"
              className="text-xs text-mos-muted underline hover:text-mos-amber"
              onClick={() => onChange({ emailEnabled: false, emailVerified: false })}
            >
              отказаться от рассылки
            </button>
          ) : null}
          {value.emailVerified ? (
            <button
              type="button"
              className="text-xs text-mos-muted underline hover:text-mos-amber"
              onClick={() => onChange({ emailVerified: false })}
            >
              сменить почту
            </button>
          ) : null}
        </div>
      </div>
    </>
  );
}
