import { StatusBadge } from "../components/StatusBadge";
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
          <h2>Users management</h2>
          <p>Управление пользователями, ролями и статусом аккаунта</p>
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
                <td>{user.role}</td>
                <td>
                  <StatusBadge
                    label={user.status === "active" ? "Активен" : "Заблокирован"}
                  />
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
                      <option value="admin">admin</option>
                      <option value="seller">seller</option>
                      <option value="user">user</option>
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
                      <option value="active">active</option>
                      <option value="blocked">blocked</option>
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
