"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import {
  Container,
  Title,
  Card,
  Group,
  Table,
  Badge,
  ActionIcon,
  Loader,
  Button,
  Stack,
} from "@mantine/core";
import { IconEdit, IconPlus } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import CreateUserDrawer from "@/components/users/CreateUserDrawer";
import AppPagination from "@/components/ui/AppPagination";
import { usePagination } from "@/hooks/usePagination";
import { getAdminUsers, ApiError } from "@/lib/api";

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
};

function mapAdminUser(u: {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
}): User {
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || u.email;
  return {
    _id: String(u.id),
    name,
    email: u.email,
    role: u.is_staff ? "SUPERADMIN" : "BUSINESS_OWNER",
  };
}

function UsersPageContent() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [drawerOpened, setDrawerOpened] = useState(false);

  const { page, pageSize, changePage, changePageSize } = usePagination({
    defaultPage: 1,
    defaultPageSize: 10,
    storageKey: "users-page-size",
  });

  /* ================= LOAD ================= */

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(data.map(mapAdminUser));
    } catch (error) {
      console.error("Ошибка загрузки пользователей", error);
      if (error instanceof ApiError && error.status === 403) {
        setUsers([]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  /* ================= PAGINATION ================= */

  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * pageSize;
    const end = page * pageSize;
    return users.slice(start, end);
  }, [users, page, pageSize]);

  /* ================= UI ================= */

  return (
    <Container size="lg" py="xl">
      <Title order={2} mb="md">
        Пользователи
      </Title>

      <Group mb="lg">
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => setDrawerOpened(true)}
        >
          Добавить пользователя
        </Button>
      </Group>

      {loading ? (
        <Loader />
      ) : (
        <Stack>
          <Card withBorder shadow="xs">
            <Table highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Имя</Table.Th>
                  <Table.Th>Email</Table.Th>
                  <Table.Th>Роль</Table.Th>
                  <Table.Th />
                </Table.Tr>
              </Table.Thead>

              <Table.Tbody>
                {paginatedUsers.map((user) => (
                  <Table.Tr
                    key={user._id}
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      router.push(`/superadmin/dashboard/users/${user._id}`)
                    }
                  >
                    <Table.Td>{user.name}</Table.Td>
                    <Table.Td>{user.email}</Table.Td>
                    <Table.Td>
                      <Badge
                        color={user.role === "SUPERADMIN" ? "red" : "blue"}
                      >
                        {user.role}
                      </Badge>
                    </Table.Td>

                    <Table.Td>
                      <ActionIcon
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/superadmin/dashboard/users/${user._id}`,
                          );
                        }}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Card>

          <AppPagination
            total={users.length}
            page={page}
            pageSize={pageSize}
            onPageChange={changePage}
            onPageSizeChange={changePageSize}
          />
        </Stack>
      )}

      <CreateUserDrawer
        opened={drawerOpened}
        onClose={() => setDrawerOpened(false)}
        onCreated={fetchUsers}
      />
    </Container>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<Loader />}>
      <UsersPageContent />
    </Suspense>
  );
}
