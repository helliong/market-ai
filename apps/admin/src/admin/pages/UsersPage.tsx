import { useLanguage } from "../../hooks/useLanguage";
import { StatusBadge } from "../components/StatusBadge";
import { userRoleLabel, userStatusLabel } from "../formatters";
import type { User, UserRole, UserStatus } from "../types";

type UsersPageProps = {
  users: User[];
  onRoleChange: (userId: number, role: UserRole) => void;
  onStatusChange: (userId: number, status: UserStatus) => void;
};

// Страница пользователей магазина с управлением ролями и статусами.
export function UsersPage({
  users,
  onRoleChange,
  onStatusChange,
}: UsersPageProps) {
  const { t } = useLanguage();

  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h2>{t("manageUsers")}</h2>
          <p>{t("usersDescription")}</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>{t("userName")}</th>
              <th>{t("userEmail")}</th>
              <th>{t("userRole")}</th>
              <th>{t("userStatus")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{t(userRoleLabel(user.role))}</td>
                <td>
                  <StatusBadge label={userStatusLabel(user.status)} />
                </td>
                <td>
                  <div className="inline-controls">
                    <select
                      className="select-control"
                      value={user.role}
                      onChange={(event) =>
                        onRoleChange(user.id, event.target.value as UserRole)
                      }
                    >
                      <option value="admin">{t("roleAdmin")}</option>
                      <option value="seller">{t("roleSeller")}</option>
                      <option value="user">{t("roleUser")}</option>
                    </select>

                    <select
                      className="select-control"
                      value={user.status}
                      onChange={(event) =>
                        onStatusChange(
                          user.id,
                          event.target.value as UserStatus,
                        )
                      }
                    >
                      <option value="active">{t("statusActive")}</option>
                      <option value="blocked">{t("statusBlocked")}</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}

            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-cell">
                  {t("noUsers")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
