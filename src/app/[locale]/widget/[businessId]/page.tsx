"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("widgetBooking");
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
      try {
        const [servicesData, specialistsData] = await Promise.all([
          import("@/lib/api").then((m) => m.getServicesStub(businessId)),
          import("@/lib/api").then((m) => m.getSpecialistsStub(businessId)),
        ]);
        setServices(servicesData);
        setSpecialists(specialistsData);
      } catch {
        setServices([]);
        setSpecialists([]);
      } finally {
        setLoading(false);
      }
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
        {t("title")}
      </Title>

      <Accordion variant="separated" defaultValue="services">
        <Accordion.Item value="services">
          <Accordion.Control>{t("step1")}</Accordion.Control>

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
                      {t("selectCta")}
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="specialists">
          <Accordion.Control>{t("step2")}</Accordion.Control>

          <Accordion.Panel>
            {!selectedService ? (
              <Text c="dimmed">{t("pickServiceFirst")}</Text>
            ) : filteredSpecialists.length === 0 ? (
              <Text c="dimmed">{t("noSpecialists")}</Text>
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
                        {t("selectCta")}
                      </Button>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="confirm">
          <Accordion.Control>{t("step3")}</Accordion.Control>

          <Accordion.Panel>
            {selectedService && selectedSpecialist ? (
              <Stack>
                <Text>{t("serviceSelected")}</Text>
                <Text>{t("specialistSelected")}</Text>

                <Button fullWidth>{t("ctaDate")}</Button>
              </Stack>
            ) : (
              <Text c="dimmed">{t("completePrev")}</Text>
            )}
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </Container>
  );
}
