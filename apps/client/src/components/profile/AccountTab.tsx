import { useState, useEffect, FormEvent } from "react";
import { MapPin, User2 } from "lucide-react";
import { updateClientProfile } from "@/lib/auth-api";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setUser } from "@/store/authSlice";
import type { AuthUser } from "@/store/authSlice";

function formatRussianPhone(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (!digits) return "";

  // Normalize: strip leading 8 or 7, we always display +7
  if (digits.startsWith("8") && digits.length > 1) {
    digits = "7" + digits.slice(1);
  }
  if (!digits.startsWith("7")) {
    digits = "7" + digits;
  }

  // Limit to 11 digits (7 + 10 local)
  digits = digits.slice(0, 11);

  const local = digits.slice(1); // up to 10 digits after "7"
  let result = "+7";

  if (local.length === 0) return result;
  result += " (" + local.slice(0, 3);
  if (local.length >= 3) result += ")";
  if (local.length > 3) result += " " + local.slice(3, 6);
  if (local.length > 6) result += "-" + local.slice(6, 8);
  if (local.length > 8) result += "-" + local.slice(8, 10);

  return result;
}

function handlePhoneInput(rawValue: string, prevValue: string): string {
  // If user is deleting, let them
  if (rawValue.length < prevValue.length) {
    const digits = rawValue.replace(/\D/g, "");
    if (!digits) return "";
    return formatRussianPhone(digits);
  }
  return formatRussianPhone(rawValue);
}

function formatBirthDateMask(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (!digits) return "";
  let result = digits.slice(0, 2);
  if (digits.length > 2) result += "." + digits.slice(2, 4);
  if (digits.length > 4) result += "." + digits.slice(4, 8);
  return result;
}

function isoToBirthDateMask(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function parseBirthDateToISO(masked: string): string | undefined {
  const digits = masked.replace(/\D/g, "");
  if (digits.length !== 8) return undefined;
  const dd = parseInt(digits.slice(0, 2), 10);
  const mm = parseInt(digits.slice(2, 4), 10);
  const yyyy = parseInt(digits.slice(4, 8), 10);
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yyyy < 1900 || yyyy > 2025) return undefined;
  const d = new Date(yyyy, mm - 1, dd);
  if (d.getDate() !== dd || d.getMonth() !== mm - 1) return undefined;
  return d.toISOString();
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
  
  const [formData, setFormData] = useState<AccountFormData>({
    displayName: "",
    birthDate: "",
    gender: "",
    phone: "",
    email: "",
    deliveryCity: "",
    deliveryStreet: "",
    deliveryHouse: "",
    deliveryFlat: "",
    deliveryComment: "",
  });

  useEffect(() => {
    if (user && !isEditing) {
      setFormData({
        displayName: user.displayName ?? user.name ?? "",
        birthDate: isoToBirthDateMask(user.birthDate ?? ""),
        gender: user.gender ?? "",
        phone: formatRussianPhone(user.phone ?? ""),
        email: user.email ?? "",
        deliveryCity: user.deliveryCity ?? "",
        deliveryStreet: user.deliveryStreet ?? "",
        deliveryHouse: user.deliveryHouse ?? "",
        deliveryFlat: user.deliveryFlat ?? "",
        deliveryComment: user.deliveryComment ?? "",
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
        birthDate: parseBirthDateToISO(formData.birthDate),
        gender: formData.gender || undefined,
        deliveryCity: formData.deliveryCity,
        deliveryStreet: formData.deliveryStreet,
        deliveryHouse: formData.deliveryHouse,
        deliveryFlat: formData.deliveryFlat,
        deliveryComment: formData.deliveryComment,
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
        avatar: profile.avatar,
        deliveryCity: profile.deliveryCity,
        deliveryStreet: profile.deliveryStreet,
        deliveryHouse: profile.deliveryHouse,
        deliveryFlat: profile.deliveryFlat,
        deliveryComment: profile.deliveryComment,
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
              <DeliveryAddressSummary user={user} />
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
                    type="text"
                    inputMode="numeric"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: formatBirthDateMask(e.target.value) })}
                    placeholder="ДД.ММ.ГГГГ"
                    maxLength={10}
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
                    onChange={(e) => setFormData({ ...formData, phone: handlePhoneInput(e.target.value, formData.phone) })}
                    placeholder="+7 (900) 000-00-00"
                    maxLength={18}
                    className="mt-2 h-12 w-full rounded-2xl border border-[#E5E7EB] bg-white px-4 text-sm outline-none transition focus:border-[#6D4AFF]"
                  />
                </label>
              </div>

              <DeliveryAddressFields
                formData={formData}
                setFormData={setFormData}
              />

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
                      birthDate: isoToBirthDateMask(user.birthDate ?? ""),
                      gender: user.gender ?? "",
                      phone: formatRussianPhone(user.phone ?? ""),
                      email: user.email ?? "",
                      deliveryCity: user.deliveryCity ?? "",
                      deliveryStreet: user.deliveryStreet ?? "",
                      deliveryHouse: user.deliveryHouse ?? "",
                      deliveryFlat: user.deliveryFlat ?? "",
                      deliveryComment: user.deliveryComment ?? "",
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

function DeliveryAddressSummary({ user }: { user: AuthUser }) {
  const hasAddress =
    user.deliveryCity || user.deliveryStreet || user.deliveryHouse;

  return (
    <div className="rounded-2xl bg-white p-4">
      <div className="mb-3 flex items-center gap-2 text-[#6D4AFF]">
        <MapPin size={18} />
        <p className="text-xs font-black uppercase tracking-[0.14em]">
          Адрес доставки
        </p>
      </div>
      {hasAddress ? (
        <div className="space-y-1 text-sm font-bold text-[#111827]">
          <p>
            {[user.deliveryCity, user.deliveryStreet, user.deliveryHouse]
              .filter(Boolean)
              .join(", ")}
            {user.deliveryFlat ? `, кв. ${user.deliveryFlat}` : ""}
          </p>
          {user.deliveryComment && (
            <p className="font-medium text-[#6B7280]">
              {user.deliveryComment}
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm font-bold text-[#6B7280]">Не указан</p>
      )}
    </div>
  );
}

type AccountFormData = {
  displayName: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  deliveryCity: string;
  deliveryStreet: string;
  deliveryHouse: string;
  deliveryFlat: string;
  deliveryComment: string;
};

function DeliveryAddressFields({
  formData,
  setFormData,
}: {
  formData: AccountFormData;
  setFormData: (value: AccountFormData) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E7EB] bg-white p-4">
      <div className="mb-4 flex items-center gap-2 text-[#6D4AFF]">
        <MapPin size={18} />
        <span className="text-sm font-black">Адрес доставки</span>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AddressInput
          label="Город"
          value={formData.deliveryCity}
          placeholder="Екатеринбург"
          onChange={(deliveryCity) => setFormData({ ...formData, deliveryCity })}
        />
        <AddressInput
          label="Улица"
          value={formData.deliveryStreet}
          placeholder="Ленина"
          onChange={(deliveryStreet) =>
            setFormData({ ...formData, deliveryStreet })
          }
        />
        <AddressInput
          label="Дом"
          value={formData.deliveryHouse}
          placeholder="10"
          onChange={(deliveryHouse) =>
            setFormData({ ...formData, deliveryHouse })
          }
        />
        <AddressInput
          label="Квартира / офис"
          value={formData.deliveryFlat}
          placeholder="24"
          onChange={(deliveryFlat) =>
            setFormData({ ...formData, deliveryFlat })
          }
        />
        <label className="block sm:col-span-2">
          <span className="text-sm font-bold text-[#111827]">
            Комментарий
          </span>
          <textarea
            value={formData.deliveryComment}
            onChange={(event) =>
              setFormData({
                ...formData,
                deliveryComment: event.target.value,
              })
            }
            placeholder="Подъезд, домофон или удобное время доставки"
            rows={3}
            className="mt-2 w-full resize-none rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3 text-sm outline-none transition focus:border-[#6D4AFF] focus:bg-white"
          />
        </label>
      </div>
    </div>
  );
}

function AddressInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-[#111827]">{label}</span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-12 w-full rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] px-4 text-sm outline-none transition focus:border-[#6D4AFF] focus:bg-white"
      />
    </label>
  );
}
