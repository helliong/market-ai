import { useState, useEffect, FormEvent } from "react";
import { AtSign, Calendar, User2, Phone } from "lucide-react";
import { updateClientProfile } from "@/lib/auth-api";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/authSlice";

function formatRussianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("7")) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }
  return phone;
}

function normalizeRussianPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) {
    return "+7" + digits.slice(1);
  }
  if (digits.length === 10) {
    return "+7" + digits;
  }
  return phone;
}

export function AccountTab() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  
  const [formData, setFormData] = useState({
    displayName: "",
    birthDate: "",
    gender: "",
    phone: "",
    email: ""
  });

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        displayName: user.displayName ?? user.name ?? "",
        birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
        gender: user.gender ?? "",
        phone: formatRussianPhone(user.phone ?? ""),
        email: user.email ?? "",
      });
    }
  }, [user, isEditing]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user) return;

    setError(undefined);
    setNotice(undefined);

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Введите корректный email");
      return;
    }

    const trimmedName = formData.displayName.trim();
    if (trimmedName.length < 2) {
      setError("ФИО должно быть не короче 2 символов");
      return;
    }

    let normalizedPhone = "";
    if (formData.phone) {
      normalizedPhone = normalizeRussianPhone(formData.phone);
      if (!normalizedPhone || normalizedPhone.length < 12) {
        setError("Введите корректный номер телефона");
        return;
      }
    }

    setIsSaving(true);
    try {
      const payload: any = {
        displayName: trimmedName,
        email: trimmedEmail,
        phone: normalizedPhone || undefined,
        birthDate: formData.birthDate ? new Date(formData.birthDate).toISOString() : undefined,
        gender: formData.gender || undefined,
      };

      const profile = await updateClientProfile(payload);
      
      dispatch(setUser({
        ...user,
        name: profile.displayName,
        displayName: profile.displayName,
        email: profile.email,
        phone: profile.phone,
        birthDate: profile.birthDate,
        gender: profile.gender,
      }));
      
      setIsEditing(false);
      setNotice("Учетные данные успешно сохранены!");
    } catch (err: any) {
      if (err?.message === "Email already exists") {
        setError("Этот email уже занят другим аккаунтом");
      } else if (err?.message === "Phone number already exists") {
        setError("Этот номер телефона уже занят");
      } else {
        setError("Произошла ошибка при сохранении данных");
      }
    } finally {
      setIsSaving(false);
    }
  }

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-[32px] bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F1EDFF] text-[#6D4AFF]">
            <User2 size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black">Учетные данные</h3>
            <p className="text-sm text-[#6B7280]">
              Ваши личные данные и контакты
            </p>
          </div>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#6D4AFF] px-5 text-sm font-bold text-white transition hover:bg-[#4F32D9]"
            >
              Изменить данные
            </button>
          )}
        </div>
        
        <div className="mt-5 rounded-2xl bg-[#F6F7FB] p-5">
          {error && (
            <p className="mb-4 rounded-2xl bg-[#FEF2F2] px-4 py-3 text-sm font-bold text-[#DC2626]">
              {error}
            </p>
          )}
          {notice && !isEditing && (
            <p className="mb-4 rounded-2xl bg-[#ECFDF5] px-4 py-3 text-sm font-bold text-[#059669] dark:bg-[#0F2A24] dark:text-[#6EE7B7]">
              {notice}
            </p>
          )}
          
          {!isEditing ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">ФИО</p>
                <p className="mt-1 font-bold text-[#111827]">{user.displayName || user.name}</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">Дата рождения</p>
                  <p className="mt-1 font-bold text-[#111827]">
                    {user.birthDate ? new Date(user.birthDate).toLocaleDateString("ru-RU") : "Не указана"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">Пол</p>
                  <p className="mt-1 font-bold text-[#111827]">
                    {user.gender === "male" ? "Мужской" : user.gender === "female" ? "Женский" : "Не указан"}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">Email</p>
                  <p className="mt-1 font-bold text-[#111827]">{user.email || "Не указан"}</p>
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6B7280]">Телефон</p>
                  <p className="mt-1 font-bold text-[#111827]">
                    {user.phone ? formatRussianPhone(user.phone) : "Не указан"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-[#111827]">ФИО</span>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  className="mt-2 h-12 w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm outline-none transition focus:border-[#6D4AFF]"
                  required
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-[#111827]">Дата рождения</span>
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    className="mt-2 h-12 w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm outline-none transition focus:border-[#6D4AFF]"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-[#111827]">Пол</span>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-2 h-12 w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm outline-none transition focus:border-[#6D4AFF]"
                  >
                    <option value="">Не выбран</option>
                    <option value="male">Мужской</option>
                    <option value="female">Женский</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-[#111827]">Email</span>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-2 h-12 w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm outline-none transition focus:border-[#6D4AFF]"
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-bold text-[#111827]">Телефон</span>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: formatRussianPhone(e.target.value) })}
                    placeholder="+7 (900) 000-00-00"
                    maxLength={18}
                    className="mt-2 h-12 w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm outline-none transition focus:border-[#6D4AFF]"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#6D4AFF] px-5 text-sm font-bold text-white transition hover:bg-[#4F32D9] disabled:opacity-70"
                >
                  {isSaving ? "Сохранение..." : "Сохранить"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setError(undefined);
                    setFormData({
                      displayName: user.displayName ?? user.name ?? "",
                      birthDate: user.birthDate ? new Date(user.birthDate).toISOString().split('T')[0] : "",
                      gender: user.gender ?? "",
                      phone: formatRussianPhone(user.phone ?? ""),
                      email: user.email ?? "",
                    });
                  }}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-[#D6DAE1] bg-white px-5 text-sm font-bold text-[#111827] transition hover:border-[#6D4AFF] hover:text-[#6D4AFF]"
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
