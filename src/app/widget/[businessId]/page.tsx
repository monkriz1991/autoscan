"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Container,
  Title,
  Accordion,
  Button,
  Stack,
  Text,
  Card,
  Group,
  Loader,
} from "@mantine/core";

type Service = {
  _id: string;
  name: string;
  parent: string | null;
};

type Specialist = {
  _id: string;
  name: string;
  categories: string[];
};

export default function WidgetPage() {
  const params = useParams();
  const businessId = params.businessId as string;

  const [services, setServices] = useState<Service[]>([]);
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedSpecialist, setSelectedSpecialist] = useState<string | null>(
    null,
  );

  /* ================= LOAD ================= */

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const [servicesRes, specialistsRes] = await Promise.all([
        fetch(`/api/services?businessId=${businessId}`),
        fetch(`/api/specialists?businessId=${businessId}`),
      ]);

      setServices(await servicesRes.json());
      setSpecialists(await specialistsRes.json());

      setLoading(false);
    };

    if (businessId) load();
  }, [businessId]);

  /* ================= FILTER ================= */

  const filteredSpecialists = useMemo(() => {
    if (!selectedService) return [];

    return specialists.filter((s) => s.categories?.includes(selectedService));
  }, [selectedService, specialists]);

  /* ================= UI ================= */

  if (loading) {
    return (
      <Container size="sm" py="xl">
        <Loader />
      </Container>
    );
  }

  return (
    <Container size="sm" py="xl">
      <Title order={2} mb="lg">
        Онлайн запись
      </Title>

      <Accordion variant="separated" defaultValue="services">
        {/* STEP 1 */}
        <Accordion.Item value="services">
          <Accordion.Control>1️⃣ Выберите услугу</Accordion.Control>

          <Accordion.Panel>
            <Stack>
              {services.map((service) => (
                <Card key={service._id} withBorder shadow="xs" padding="sm">
                  <Group justify="space-between">
                    <Text>{service.name}</Text>

                    <Button
                      size="xs"
                      onClick={() => setSelectedService(service._id)}
                    >
                      Выбрать
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* STEP 2 */}
        <Accordion.Item value="specialists">
          <Accordion.Control>2️⃣ Выберите специалиста</Accordion.Control>

          <Accordion.Panel>
            {!selectedService ? (
              <Text c="dimmed">Сначала выберите услугу</Text>
            ) : filteredSpecialists.length === 0 ? (
              <Text c="dimmed">Нет доступных специалистов</Text>
            ) : (
              <Stack>
                {filteredSpecialists.map((s) => (
                  <Card key={s._id} withBorder shadow="xs" padding="sm">
                    <Group justify="space-between">
                      <Text>{s.name}</Text>

                      <Button
                        size="xs"
                        onClick={() => setSelectedSpecialist(s._id)}
                      >
                        Выбрать
                      </Button>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Accordion.Panel>
        </Accordion.Item>

        {/* STEP 3 */}
        <Accordion.Item value="confirm">
          <Accordion.Control>3️⃣ Подтверждение</Accordion.Control>

          <Accordion.Panel>
            {selectedService && selectedSpecialist ? (
              <Stack>
                <Text>Услуга выбрана ✔</Text>
                <Text>Специалист выбран ✔</Text>

                <Button fullWidth>Перейти к выбору даты 🔥</Button>
              </Stack>
            ) : (
              <Text c="dimmed">Завершите предыдущие шаги</Text>
            )}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Container>
  );
}
