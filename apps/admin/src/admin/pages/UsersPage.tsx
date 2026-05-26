import { StatusBadge } from "../components/StatusBadge";
import { userRoleLabel, userStatusLabel } from "../formatters";
import type { User, UserRole, UserStatus } from "../types";

type UsersPageProps = {
  users: User[];
  onRoleChange: (userId: number, role: UserRole) => void;
  onStatusChange: (userId: number, status: UserStatus) => void;
};

export function UsersPage({
  users,
  onRoleChange,
  onStatusChange,
}: UsersPageProps) {
  return (
    <section className="panel">
      <div className="section-header">
        <div>
          <h2>Управление пользователями</h2>
          <p>Роли, статусы аккаунтов и доступ к административным функциям.</p>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Роль</th>
              <th>Статус</th>
              <th>Управление</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{userRoleLabel(user.role)}</td>
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
                      <option value="admin">Администратор</option>
                      <option value="seller">Продавец</option>
                      <option value="user">Покупатель</option>
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
                      <option value="active">Активен</option>
                      <option value="blocked">Заблокирован</option>
                    </select>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
