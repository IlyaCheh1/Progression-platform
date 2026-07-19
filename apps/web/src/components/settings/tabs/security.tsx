"use client";

import { useState } from "react";
import FormField from "@/components/ui/form-field";
import Input from "@/components/ui/input";

type SecurityTabProps = {
  email: string;
};

export default function SecurityTab({ email }: SecurityTabProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [emailErrors, setEmailErrors] = useState<Record<string, string>>({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [verified, setVerified] = useState(true);
  const [pending, setPending] = useState(false);

  function validatePassword() {
    const next: Record<string, string> = {};
    if (currentPassword.length < 1) next.current = "Введите текущий пароль";
    if (newPassword.length < 8) next.next = "Минимум 8 символов";
    else if (!/[a-z]/.test(newPassword) || !/[A-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
      next.next = "Нужны строчные, заглавные буквы и цифра";
    }
    if (confirmPassword !== newPassword) next.confirm = "Пароли не совпадают";
    setPasswordErrors(next);
    return Object.keys(next).length === 0;
  }

  function onPasswordSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validatePassword()) return;
    // Demo: OnlyID password change is sandboxed until auth adapter lands.
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordSuccess(true);
    window.setTimeout(() => setPasswordSuccess(false), 3000);
  }

  function onEmailSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) next.newEmail = "Некорректный email";
    if (confirmEmail !== newEmail) next.confirmEmail = "Адреса не совпадают";
    setEmailErrors(next);
    if (Object.keys(next).length > 0) return;
    setEmailSuccess(true);
    setPending(true);
    setVerified(false);
    window.setTimeout(() => setEmailSuccess(false), 3000);
  }

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="flex w-full flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-sm font-medium text-mos-text md:text-[17px]">Безопасность</h2>
        <div className="flex items-center gap-2">
          {verified && !pending ? (
            <>
              <span className="text-[10px] text-mos-muted md:text-xs">Аккаунт подтверждён</span>
              <span className="grid h-5 w-5 place-items-center rounded-full border border-[#7dba5a] text-[10px] text-[#7dba5a]">
                ✓
              </span>
            </>
          ) : pending ? (
            <span className="text-[10px] text-mos-muted md:text-xs">Отправлено на {email || newEmail}</span>
          ) : (
            <>
              <span className="text-[10px] text-mos-muted md:text-xs">Аккаунт не подтвержден</span>
              <button
                type="button"
                className="og-btn og-btn-secondary og-btn-sm uppercase"
                onClick={() => {
                  setPending(true);
                  setVerified(false);
                }}
              >
                Подтвердить
              </button>
            </>
          )}
        </div>
      </div>

      <form onSubmit={onPasswordSubmit} className="flex flex-col gap-3">
        <h3 className="font-display text-xs text-mos-text md:text-[15px]">Смена пароля</h3>
        <FormField label="Текущий пароль" error={passwordErrors.current}>
          <Input
            type={show.current ? "text" : "password"}
            value={currentPassword}
            onValueChange={setCurrentPassword}
            suffix={
              <button type="button" className="text-xs text-mos-muted" onClick={() => setShow((s) => ({ ...s, current: !s.current }))}>
                {show.current ? "скрыть" : "показать"}
              </button>
            }
          />
        </FormField>
        <FormField label="Новый пароль" error={passwordErrors.next}>
          <Input
            type={show.next ? "text" : "password"}
            value={newPassword}
            onValueChange={setNewPassword}
            suffix={
              <button type="button" className="text-xs text-mos-muted" onClick={() => setShow((s) => ({ ...s, next: !s.next }))}>
                {show.next ? "скрыть" : "показать"}
              </button>
            }
          />
        </FormField>
        <FormField label="Подтвердите пароль" error={passwordErrors.confirm}>
          <Input
            type={show.confirm ? "text" : "password"}
            value={confirmPassword}
            onValueChange={setConfirmPassword}
            suffix={
              <button type="button" className="text-xs text-mos-muted" onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}>
                {show.confirm ? "скрыть" : "показать"}
              </button>
            }
          />
        </FormField>
        <button type="submit" className="og-btn og-btn-primary og-btn-md w-full uppercase md:w-auto md:self-end">
          {passwordSuccess ? "Пароль изменён!" : "Сменить пароль"}
        </button>
      </form>

      <form onSubmit={onEmailSubmit} className="flex flex-col gap-3 border-t border-white/10 pt-6">
        <h3 className="font-display text-xs text-mos-text md:text-[15px]">Смена почты</h3>
        <FormField label="Текущая почта">
          <Input value={email} disabled />
        </FormField>
        <FormField label="Новая почта" error={emailErrors.newEmail}>
          <Input type="email" value={newEmail} onValueChange={setNewEmail} />
        </FormField>
        <FormField label="Подтвердите почту" error={emailErrors.confirmEmail}>
          <Input type="email" value={confirmEmail} onValueChange={setConfirmEmail} />
        </FormField>
        <button type="submit" className="og-btn og-btn-secondary og-btn-md w-full uppercase md:w-auto md:self-end">
          {emailSuccess ? "Письмо отправлено!" : "Отправить"}
        </button>
      </form>
    </div>
  );
}
