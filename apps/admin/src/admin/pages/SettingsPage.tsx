import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  Plus,
  Save,
  Shield,
  Store,
  Trash2,
  Upload,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { useLanguage } from "../../hooks/useLanguage";
import type {
  SellerLegalProfilePayload,
  SellerProfile,
} from "../../auth-api";

type TeamMemberRole = "owner" | "manager" | "operator" | "viewer";
type TeamMemberStatus = "active" | "invited";

type TeamMember = {
  id: string;
  name: string;
  email: string;
  role: TeamMemberRole;
  status: TeamMemberStatus;
};

type ToastState = {
  id: number;
  message: string;
  variant: "success" | "error";
};

type SettingsPageProps = {
  storeName: string;
  sellerProfile: SellerProfile | null;
  onStoreNameChange: (storeName: string) => void;
  onSaveLegalProfile: (payload: SellerLegalProfilePayload) => Promise<void>;
  onSubmitLegalProfile: () => Promise<void>;
  onDeactivateStore: () => void;
  onDeleteStore: () => void;
};

const initialTeam: TeamMember[] = [
  {
    id: "orders-manager",
    name: "Order Manager",
    email: "orders@marketai.local",
    role: "operator",
    status: "invited",
  },
];

export function SettingsPage({
  storeName,
  sellerProfile,
  onStoreNameChange,
  onSaveLegalProfile,
  onSubmitLegalProfile,
  onDeactivateStore,
  onDeleteStore,
}: SettingsPageProps) {
  const { t } = useLanguage();
  const [shop, setShop] = useState({
    name: storeName,
    description: "",
    city: "",
    phone: "",
    email: sellerProfile?.ownerEmail ?? "",
  });
  const [legal, setLegal] = useState({
    businessType: sellerProfile?.legalProfile?.businessType ?? "individual",
    taxId: sellerProfile?.legalProfile?.taxId ?? "",
    legalName: sellerProfile?.legalProfile?.legalName ?? "",
    legalAddress: sellerProfile?.legalProfile?.legalAddress ?? "",
    bankName: sellerProfile?.legalProfile?.bankName ?? "",
    iban: sellerProfile?.legalProfile?.iban ?? "",
  });
  const [team, setTeam] = useState<TeamMember[]>(initialTeam);
  const [coverPreview, setCoverPreview] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    role: "manager" as TeamMemberRole,
  });
  const [toast, setToast] = useState<ToastState | null>(null);
  const isActivated = sellerProfile?.status === "ACTIVATED";
  const isUnderReview = sellerProfile?.status === "UNDER_REVIEW";
  const canEditLegal = !isActivated && !isUnderReview;
  const canManageTeam = isActivated;

  const ownerMember = useMemo<TeamMember>(
    () => ({
      id: "store-owner",
      name: sellerProfile?.ownerName || storeName || "Store owner",
      email: sellerProfile?.ownerEmail || shop.email || "",
      role: "owner",
      status: "active",
    }),
    [sellerProfile?.ownerEmail, sellerProfile?.ownerName, shop.email, storeName],
  );

  useEffect(() => {
    setShop((current) => ({
      ...current,
      name: storeName,
      email: sellerProfile?.ownerEmail ?? current.email,
      phone: formatPhone(sellerProfile?.phone ?? current.phone),
    }));
  }, [sellerProfile?.ownerEmail, sellerProfile?.phone, storeName]);

  useEffect(() => {
    setLegal((current) => ({
      businessType: sellerProfile?.legalProfile?.businessType ?? current.businessType,
      taxId: formatTaxId(sellerProfile?.legalProfile?.taxId ?? current.taxId),
      legalName: sellerProfile?.legalProfile?.legalName ?? current.legalName,
      legalAddress:
        sellerProfile?.legalProfile?.legalAddress ?? current.legalAddress,
      bankName: sellerProfile?.legalProfile?.bankName ?? current.bankName,
      iban: formatBankAccount(sellerProfile?.legalProfile?.iban ?? current.iban),
    }));
  }, [sellerProfile?.legalProfile]);

  useEffect(() => {
    if (!sellerProfile?.status || sellerProfile.status === "ACTIVATED") return;

    const statusMessage =
      sellerProfile.status === "UNDER_REVIEW"
        ? t("sellerStatusUnderReview")
        : sellerProfile.status === "REJECTED"
        ? sellerProfile.reviewComment
          ? `${t("sellerStatusRejected")}: ${sellerProfile.reviewComment}`
          : t("sellerStatusRejected")
        : t("sellerStatusPendingLegal");

    showToast(
      statusMessage,
      sellerProfile.status === "REJECTED" ? "error" : "success",
    );
  }, [sellerProfile?.reviewComment, sellerProfile?.status, t]);

  const coverTitle = useMemo(() => {
    const trimmedName = shop.name.trim();
    return trimmedName || t("settingsStoreNamePlaceholder");
  }, [shop.name, t]);

  function saveSettings() {
    const nextStoreName = shop.name.trim();
    if (nextStoreName) {
      onStoreNameChange(nextStoreName);
    }
    showToast(t("settingsSaved"), "success");
  }

  async function saveLegalProfile() {
    try {
      await onSaveLegalProfile(prepareLegalPayload(legal));
      showToast(t("settingsLegalSaved"), "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  async function submitLegalProfile() {
    try {
      await onSaveLegalProfile(prepareLegalPayload(legal));
      await onSubmitLegalProfile();
      showToast(t("settingsLegalSubmitted"), "success");
    } catch (error) {
      showToast(getErrorMessage(error), "error");
    }
  }

  function handleCoverChange(file: File | undefined) {
    if (!file) return;
    setCoverPreview(URL.createObjectURL(file));
  }

  function closeInviteModal() {
    setIsInviteModalOpen(false);
    setInviteForm({ name: "", email: "", role: "manager" });
  }

  function inviteMember() {
    const name = inviteForm.name.trim();
    const email = inviteForm.email.trim();
    if (!name || !email) {
      showToast(t("checkFieldsMessage"), "error");
      return;
    }
    setTeam((currentTeam) => [
      ...currentTeam,
      {
        id: `member-${Date.now()}`,
        name,
        email,
        role: inviteForm.role,
        status: "invited",
      },
    ]);
    closeInviteModal();
    showToast(t("settingsInviteSubmit"), "success");
  }

  function updateMemberRole(memberId: string, role: TeamMemberRole) {
    setTeam((currentTeam) =>
      currentTeam.map((member) =>
        member.id === memberId ? { ...member, role } : member,
      ),
    );
  }

  function removeMember(memberId: string) {
    setTeam((currentTeam) =>
      currentTeam.filter((member) => member.id !== memberId),
    );
  }

  function showToast(message: string, variant: ToastState["variant"]) {
    const id = Date.now();
    setToast({ id, message, variant });
    window.setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4200);
  }

  return (
    <section className="settings-page">
      {toast && (
        <ToastNotification
          message={toast.message}
          variant={toast.variant}
          onClose={() => setToast(null)}
        />
      )}

      <div className="settings-hero">
        <div>
          <p>{t("settingsEyebrow")}</p>
          <h2>{t("settingsTitle")}</h2>
          <span>{t("settingsDescription")}</span>
        </div>
        <button type="button" className="primary-button" onClick={saveSettings}>
          <Save aria-hidden="true" />
          {t("settingsSave")}
        </button>
      </div>

      <div className="settings-grid">
        <section className="panel settings-section settings-section-large">
          <SettingsSectionTitle
            icon={<Store aria-hidden="true" />}
            title={t("settingsStore")}
            description={t("settingsStoreDescription")}
          />

          <div className="settings-cover-preview">
            {coverPreview ? (
              <img src={coverPreview} alt="" />
            ) : (
              <div>
                <Upload aria-hidden="true" />
                <strong>{coverTitle}</strong>
                <span>{t("settingsCoverHint")}</span>
              </div>
            )}
          </div>

          <label className="settings-upload-button">
            <Upload aria-hidden="true" />
            {t("settingsCoverUpload")}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => handleCoverChange(event.target.files?.[0])}
            />
          </label>

          <div className="settings-form-grid">
            <label>
              {t("settingsStoreName")}
              <input
                value={shop.name}
                onChange={(event) =>
                  setShop((current) => ({ ...current, name: event.target.value }))
                }
                placeholder={t("settingsStoreNamePlaceholder")}
              />
            </label>
            <label className="settings-field-full">
              {t("settingsStoreDescriptionField")}
              <textarea
                value={shop.description}
                onChange={(event) =>
                  setShop((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                placeholder={t("settingsStoreDescriptionPlaceholder")}
              />
            </label>
            <label>
              {t("settingsCity")}
              <input
                value={shop.city}
                onChange={(event) =>
                  setShop((current) => ({ ...current, city: event.target.value }))
                }
                placeholder={t("settingsCityPlaceholder")}
              />
            </label>
            <label>
              {t("settingsPhone")}
              <span className="settings-input-icon">
                <Phone aria-hidden="true" />
                <input
                  value={shop.phone}
                  onChange={(event) =>
                    setShop((current) => ({
                      ...current,
                      phone: formatPhone(event.target.value),
                    }))
                  }
                  placeholder="+7 900 000-00-00"
                />
              </span>
            </label>
            <label>
              {t("settingsEmail")}
              <span className="settings-input-icon">
                <Mail aria-hidden="true" />
                <input
                  type="email"
                  value={shop.email}
                  onChange={(event) =>
                    setShop((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="seller@marketai.local"
                />
              </span>
            </label>
          </div>
        </section>

        <section className="panel settings-section">
          <SettingsSectionTitle
            icon={<BadgeCheck aria-hidden="true" />}
            title={t("settingsLegal")}
            description={t("settingsLegalDescription")}
          />

          <div className="settings-form-grid settings-form-grid-single">
            <label>
              {t("settingsBusinessType")}
              <select
                value={legal.businessType}
                disabled={!canEditLegal}
                onChange={(event) =>
                  setLegal((current) => ({
                    ...current,
                    businessType: event.target.value,
                  }))
                }
              >
                <option value="individual">{t("settingsBusinessIndividual")}</option>
                <option value="company">{t("settingsBusinessCompany")}</option>
                <option value="selfEmployed">{t("settingsBusinessSelfEmployed")}</option>
              </select>
            </label>
            <label>
              {t("settingsTaxId")}
              <input
                value={legal.taxId}
                disabled={!canEditLegal}
                onChange={(event) =>
                  setLegal((current) => ({
                    ...current,
                    taxId: formatTaxId(event.target.value),
                  }))
                }
                placeholder="000 000 000 000"
              />
            </label>
            <label>
              {t("settingsLegalName")}
              <input
                value={legal.legalName}
                disabled={!canEditLegal}
                onChange={(event) =>
                  setLegal((current) => ({
                    ...current,
                    legalName: event.target.value,
                  }))
                }
                placeholder={t("settingsLegalNamePlaceholder")}
              />
            </label>
            <label>
              {t("settingsLegalAddress")}
              <input
                value={legal.legalAddress}
                disabled={!canEditLegal}
                onChange={(event) =>
                  setLegal((current) => ({
                    ...current,
                    legalAddress: event.target.value,
                  }))
                }
                placeholder={t("settingsLegalAddressPlaceholder")}
              />
            </label>
            <label>
              {t("settingsBankName")}
              <input
                value={legal.bankName}
                disabled={!canEditLegal}
                onChange={(event) =>
                  setLegal((current) => ({
                    ...current,
                    bankName: event.target.value,
                  }))
                }
                placeholder={t("settingsBankNamePlaceholder")}
              />
            </label>
            <label>
              {t("settingsIban")}
              <input
                value={legal.iban}
                disabled={!canEditLegal}
                onChange={(event) =>
                  setLegal((current) => ({
                    ...current,
                    iban: formatBankAccount(event.target.value),
                  }))
                }
                onBlur={() =>
                  setLegal((current) => ({
                    ...current,
                    iban: formatBankAccount(current.iban),
                  }))
                }
                placeholder="KZ00 0000 0000 0000 0000"
              />
            </label>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              disabled={!canEditLegal}
              onClick={saveLegalProfile}
            >
              {t("settingsLegalSave")}
            </button>
            <button
              type="button"
              className="primary-button"
              disabled={!canEditLegal}
              onClick={submitLegalProfile}
            >
              {t("settingsLegalSubmit")}
            </button>
          </div>
        </section>
      </div>

      <section className="panel settings-section">
        <SettingsSectionTitle
          icon={<Users aria-hidden="true" />}
          title={t("settingsTeam")}
          description={t("settingsTeamDescription")}
        />

        <div className="settings-team-toolbar">
          <button
            type="button"
            className="secondary-button"
            disabled={!canManageTeam}
            onClick={() => setIsInviteModalOpen(true)}
            title={!canManageTeam ? t("settingsTeamLocked") : undefined}
          >
            <Plus aria-hidden="true" />
            {t("settingsInvite")}
          </button>
        </div>
        {!canManageTeam && (
          <p className="settings-muted-warning">{t("settingsTeamLocked")}</p>
        )}

        <div className="settings-team-list">
          {[ownerMember, ...team].map((member) => (
            <article key={member.id} className="settings-team-card">
              <div className="settings-team-avatar">
                {member.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <h3>{member.name}</h3>
                <p>{member.email}</p>
                <span>{t(member.status === "active" ? "settingsTeamActive" : "settingsTeamInvited")}</span>
              </div>
              <select
                value={member.role}
                disabled={!canManageTeam || member.role === "owner"}
                onChange={(event) =>
                  updateMemberRole(member.id, event.target.value as TeamMemberRole)
                }
              >
                <option value="owner">{t("settingsRoleOwner")}</option>
                <option value="manager">{t("settingsRoleManager")}</option>
                <option value="operator">{t("settingsRoleOperator")}</option>
                <option value="viewer">{t("settingsRoleViewer")}</option>
              </select>
              <button
                type="button"
                className="table-button danger"
                disabled={!canManageTeam || member.role === "owner"}
                onClick={() => removeMember(member.id)}
              >
                <Trash2 aria-hidden="true" />
                {t("delete")}
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="panel settings-section settings-danger-zone">
        <SettingsSectionTitle
          icon={<AlertTriangle aria-hidden="true" />}
          title={t("settingsDanger")}
          description={t("settingsDangerDescription")}
        />

        <div className="settings-danger-actions">
          <div>
            <Shield aria-hidden="true" />
            <div>
              <h3>{t("settingsDeactivateTitle")}</h3>
              <p>{t("settingsDeactivateDescription")}</p>
            </div>
          </div>
          <button type="button" className="secondary-button" onClick={onDeactivateStore}>
            {t("settingsDeactivate")}
          </button>
        </div>

        <div className="settings-danger-actions is-destructive">
          <div>
            <Building2 aria-hidden="true" />
            <div>
              <h3>{t("settingsDeleteTitle")}</h3>
              <p>{t("settingsDeleteDescription")}</p>
            </div>
          </div>
          <button type="button" className="danger-button" onClick={onDeleteStore}>
            {t("settingsDelete")}
          </button>
        </div>
      </section>

      {isInviteModalOpen && (
        <div className="modal-backdrop">
          <form
            className="modal-card settings-invite-modal"
            onSubmit={(event) => {
              event.preventDefault();
              inviteMember();
            }}
          >
            <div className="modal-header">
              <div>
                <h2>{t("settingsInviteTitle")}</h2>
                <p>{t("settingsInviteDescription")}</p>
              </div>
              <button
                type="button"
                className="close-button"
                aria-label={t("close")}
                onClick={closeInviteModal}
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <div className="product-form">
              <label>
                {t("settingsMemberName")}
                <input
                  value={inviteForm.name}
                  onChange={(event) =>
                    setInviteForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder={t("settingsMemberNamePlaceholder")}
                />
              </label>
              <label>
                {t("settingsEmail")}
                <input
                  type="email"
                  value={inviteForm.email}
                  onChange={(event) =>
                    setInviteForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder={t("settingsTeamEmailPlaceholder")}
                />
              </label>
              <label>
                {t("settingsRole")}
                <select
                  value={inviteForm.role}
                  onChange={(event) =>
                    setInviteForm((current) => ({
                      ...current,
                      role: event.target.value as TeamMemberRole,
                    }))
                  }
                >
                  <option value="manager">{t("settingsRoleManager")}</option>
                  <option value="operator">{t("settingsRoleOperator")}</option>
                  <option value="viewer">{t("settingsRoleViewer")}</option>
                </select>
              </label>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeInviteModal}
              >
                {t("cancel")}
              </button>
              <button type="submit" className="primary-button">
                {t("settingsInviteSubmit")}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function SettingsSectionTitle({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="settings-section-title">
      <span>{icon}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}

function ToastNotification({
  message,
  variant,
  onClose,
}: {
  message: string;
  variant: ToastState["variant"];
  onClose: () => void;
}) {
  const Icon = variant === "success" ? CheckCircle2 : XCircle;

  return (
    <div className={`toast-notification toast-notification-${variant}`}>
      <Icon aria-hidden="true" />
      <span>{message}</span>
      <button type="button" aria-label="Close notification" onClick={onClose}>
        <X aria-hidden="true" />
      </button>
    </div>
  );
}

function prepareLegalPayload(
  legal: SellerLegalProfilePayload,
): SellerLegalProfilePayload {
  return {
    ...legal,
    taxId: digitsOnly(legal.taxId),
    iban: compactBankAccount(legal.iban),
  };
}

function formatPhone(value: string) {
  const digits = digitsOnly(value);
  const normalized =
    digits.startsWith("8") && digits.length > 1
      ? `7${digits.slice(1)}`
      : digits.startsWith("7")
      ? digits
      : digits
      ? `7${digits}`
      : "";
  const limited = normalized.slice(0, 11);
  const country = limited.slice(0, 1);
  const operator = limited.slice(1, 4);
  const first = limited.slice(4, 7);
  const second = limited.slice(7, 9);
  const third = limited.slice(9, 11);

  if (!limited) return "";

  let formatted = country ? `+${country}` : "";
  if (operator) formatted += ` ${operator}`;
  if (first) formatted += ` ${first}`;
  if (second) formatted += `-${second}`;
  if (third) formatted += `-${third}`;

  return formatted;
}

function formatTaxId(value: string) {
  return digitsOnly(value).slice(0, 12).replace(/(\d{3})(?=\d)/g, "$1 ");
}

function formatBankAccount(value: string) {
  return compactBankAccount(value)
    .slice(0, 20)
    .replace(/(.{4})(?=.)/g, "$1 ");
}

function compactBankAccount(value: string) {
  return value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
}

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Request failed";
}
