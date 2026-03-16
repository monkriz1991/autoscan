"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Loader,
  Center,
  Notification,
  Drawer,
  Select,
  NumberInput,
  TextInput,
  ActionIcon,
  Table,
  Collapse,
  Badge,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconCar, IconPlus, IconTrash, IconEdit, IconChevronDown, IconChevronUp } from "@tabler/icons-react";
import {
  ApiError,
  getVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getCarMakes,
  getCarModels,
  getCarFilterOptions,
  getCarModifications,
  searchCarsExternal,
  decodeVin,
  type Vehicle,
  type VehicleCreateUpdate,
  type CarMake,
  type CarModel,
  type CarModification,
} from "@/lib/api";

export default function DashboardVehiclePage() {
  const t = useTranslations("vehicle");
  const tDashboard = useTranslations("dashboard");
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);

  const [makes, setMakes] = useState<CarMake[]>([]);
  const [models, setModels] = useState<CarModel[]>([]);
  const [modifications, setModifications] = useState<CarModification[]>([]);
  const [externalModels, setExternalModels] = useState<
    Array<{ Make_Name: string; Model_Name: string }>
  >([]);

  const [formMake, setFormMake] = useState<string>("");
  const [formModel, setFormModel] = useState<string>("");
  const [formYear, setFormYear] = useState<number | string>("");
  const [formVin, setFormVin] = useState("");
  const [formModelId, setFormModelId] = useState<number | null>(null);
  const [formModificationId, setFormModificationId] = useState<number | null>(
    null,
  );
  const [formBodyType, setFormBodyType] = useState<string | null>(null);
  const [formEngineType, setFormEngineType] = useState<string | null>(null);
  const [bodyTypes, setBodyTypes] = useState<string[]>([]);
  const [engineTypes, setEngineTypes] = useState<string[]>([]);
  const [decodingVin, setDecodingVin] = useState(false);
  const [vinDecodeError, setVinDecodeError] = useState("");

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await getVehicles();
      setVehicles(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  useEffect(() => {
    getCarMakes().then(setMakes).catch(() => setMakes([]));
  }, []);

  useEffect(() => {
    if (!formMake) {
      setModels([]);
      setFormModel("");
      setFormModelId(null);
      setModifications([]);
      setFormModificationId(null);
      setExternalModels([]);
      return;
    }
    const year =
      typeof formYear === "number"
        ? formYear
        : parseInt(String(formYear), 10);
    const hasYear = !isNaN(year) && year > 0;

    getCarModels(formMake, hasYear ? year : undefined)
      .then((r) => {
        setModels(r);
        if (r.length === 0 && hasYear) {
          searchCarsExternal(formMake, year)
            .then(setExternalModels)
            .catch(() => setExternalModels([]));
        } else {
          setExternalModels([]);
        }
      })
      .catch(() => {
        setModels([]);
        if (hasYear) {
          searchCarsExternal(formMake, year)
            .then(setExternalModels)
            .catch(() => setExternalModels([]));
        } else {
          setExternalModels([]);
        }
      });
  }, [formMake, formYear]);

  useEffect(() => {
    if (!formModel || !models.length) return;
    const modelLower = formModel.toLowerCase();
    const m = models.find((x) => x.name.toLowerCase() === modelLower);
    if (m) setFormModelId(m.id);
  }, [models, formModel]);

  useEffect(() => {
    if (!formModelId) {
      setBodyTypes([]);
      setEngineTypes([]);
      setFormBodyType(null);
      setFormEngineType(null);
      setModifications([]);
      setFormModificationId(null);
      return;
    }
    const year =
      typeof formYear === "number"
        ? formYear
        : parseInt(String(formYear), 10);
    const hasYear =
      !isNaN(year) && year >= 1990 && year <= new Date().getFullYear() + 1;
    if (!hasYear) {
      setBodyTypes([]);
      setEngineTypes([]);
      setFormBodyType(null);
      setFormEngineType(null);
      setModifications([]);
      setFormModificationId(null);
      return;
    }
    getCarFilterOptions(formModelId, year).then((opts) => {
      setBodyTypes(opts.body_types ?? []);
      setEngineTypes(opts.engine_types ?? []);
    });
  }, [formModelId, formYear]);

  useEffect(() => {
    if (!formModelId) {
      setModifications([]);
      setFormModificationId(null);
      return;
    }
    const year =
      typeof formYear === "number"
        ? formYear
        : parseInt(String(formYear), 10);
    const hasYear =
      !isNaN(year) && year >= 1990 && year <= new Date().getFullYear() + 1;
    if (!hasYear) {
      setModifications([]);
      setFormModificationId(null);
      return;
    }
    getCarModifications(formModelId, {
      year,
      body_type: formBodyType?.trim() || undefined,
      engine_type: formEngineType?.trim() || undefined,
    })
      .then((mods) => {
        setModifications(mods);
        setFormModificationId((prev) => {
          if (prev == null) return null;
          const stillValid = mods.some((m) => m.id === prev);
          return stillValid ? prev : null;
        });
      })
      .catch(() => setModifications([]));
  }, [formModelId, formYear, formBodyType, formEngineType]);

  const resetForm = () => {
    setFormMake("");
    setFormModel("");
    setFormYear("");
    setFormVin("");
    setFormModelId(null);
    setFormModificationId(null);
    setFormBodyType(null);
    setFormEngineType(null);
    setBodyTypes([]);
    setEngineTypes([]);
    setEditingVehicle(null);
    setVinDecodeError("");
  };

  const handleDecodeVin = async () => {
    const vin = formVin.trim();
    if (!vin || vin.length !== 17) {
      setVinDecodeError(t("vinDecodeError"));
      return;
    }
    setDecodingVin(true);
    setVinDecodeError("");
    try {
      const result = await decodeVin(vin);
      setFormMake(result.make);
      setFormModel(result.model || "");
      setFormYear(result.year ?? "");
      setFormModelId(null);
      setFormModificationId(null);
    } catch (err) {
      const msg =
        err instanceof ApiError &&
        err.data &&
        typeof err.data === "object" &&
        "detail" in err.data
          ? String((err.data as { detail?: unknown }).detail)
          : t("vinDecodeError");
      setVinDecodeError(msg);
    } finally {
      setDecodingVin(false);
    }
  };

  const handleOpenAdd = () => {
    resetForm();
    openDrawer();
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormMake(v.make);
    setFormModel(v.model);
    setFormYear(v.year ?? "");
    setFormVin(v.vin ?? "");
    setFormModelId(null);
    setFormModificationId(v.modification_id);
    setFormBodyType(null);
    setFormEngineType(null);
    setModels([]);
    setModifications([]);
    getCarModels(v.make, v.year ?? undefined).then((r) => {
      setModels(r);
      const m = r.find((x) => x.name === v.model);
      if (m) setFormModelId(m.id);
    });
    openDrawer();
  };

  const handleSave = async () => {
    if (!formMake || !formModel) {
      setError(t("saveError"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const payload: VehicleCreateUpdate = {
        make: formMake,
        model: formModel,
        year: typeof formYear === "number" ? formYear : parseInt(String(formYear), 10) || undefined,
        vin: formVin || undefined,
        modification_id: formModificationId,
      };
      if (editingVehicle) {
        const updated = await updateVehicle(editingVehicle.id, payload);
        setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      } else {
        const created = await createVehicle(payload);
        setVehicles((prev) => [...prev, created]);
      }
      closeDrawer();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeletingId(id);
    setError("");
    try {
      await deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loadError"));
    } finally {
      setDeletingId(null);
    }
  };

  const modelOptions =
    models.length > 0
      ? models.map((m) => ({ value: String(m.id), label: m.name }))
      : externalModels.map((m, i) => ({
          value: `ext-${i}`,
          label: m.Model_Name,
        }));

  const handleModelSelect = (val: string | null) => {
    if (!val) {
      setFormModelId(null);
      setFormModel("");
      return;
    }
    if (val.startsWith("ext-")) {
      const idx = parseInt(val.replace("ext-", ""), 10);
      const ext = externalModels[idx];
      if (ext) {
        setFormModel(ext.Model_Name);
        setFormModelId(null);
      }
      return;
    }
    const id = parseInt(val, 10);
    const m = models.find((x) => x.id === id);
    if (m) {
      setFormModel(m.name);
      setFormModelId(m.id);
    }
  };

  if (loading) {
    return (
      <Center py="xl">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack>
      <Group justify="space-between">
        <Title order={4}>{t("title")}</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAdd}>
          {t("addVehicle")}
        </Button>
      </Group>

      {error && (
        <Notification color="red" onClose={() => setError("")}>
          {error}
        </Notification>
      )}

      {vehicles.length === 0 && !error && (
        <Card withBorder shadow="sm" radius="md" p="xl">
          <Group gap="md">
            <IconCar size={48} stroke={1} />
            <Stack gap={4}>
              <Text fw={500}>{t("noVehicles")}</Text>
              <Text size="sm" c="dimmed">
                {t("noVehiclesDesc")}
              </Text>
            </Stack>
          </Group>
        </Card>
      )}

      {vehicles.length > 0 && (
        <Card withBorder shadow="sm" radius="md" p="md">
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t("make")}</Table.Th>
                <Table.Th>{t("model")}</Table.Th>
                <Table.Th>{t("year")}</Table.Th>
                <Table.Th>{t("vin")}</Table.Th>
                <Table.Th style={{ width: 120 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {vehicles.flatMap((v) => [
                <Table.Tr
                  key={`${v.id}-main`}
                  style={{
                    cursor:
                      Object.keys(v.characteristics || {}).length > 0
                        ? "pointer"
                        : undefined,
                  }}
                  onClick={() =>
                    Object.keys(v.characteristics || {}).length > 0 &&
                    setExpandedId(expandedId === v.id ? null : v.id)
                  }
                >
                  <Table.Td>{v.make}</Table.Td>
                  <Table.Td>{v.model}</Table.Td>
                  <Table.Td>{v.year ?? "—"}</Table.Td>
                  <Table.Td>
                    <Text size="sm" ff="monospace" c="dimmed">
                      {v.vin || "—"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap={4}>
                      {Object.keys(v.characteristics || {}).length > 0 && (
                        <Badge size="sm" variant="light">
                          {expandedId === v.id ? (
                            <IconChevronUp size={12} />
                          ) : (
                            <IconChevronDown size={12} />
                          )}
                        </Badge>
                      )}
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        aria-label={t("editVehicle")}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(v);
                        }}
                      >
                        <IconEdit size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        aria-label={t("delete")}
                        loading={deletingId === v.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(v.id);
                        }}
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Group>
                  </Table.Td>
                </Table.Tr>,
                <Table.Tr key={`${v.id}-exp`}>
                  <Table.Td colSpan={5} p={0}>
                    <Collapse in={expandedId === v.id}>
                      {v.characteristics &&
                        Object.keys(v.characteristics).length > 0 && (
                          <Card withBorder p="md" m="xs" bg="gray.0">
                            <Text size="xs" c="dimmed" fw={600} mb="xs">
                              {t("characteristics")}
                            </Text>
                            <Stack gap={4}>
                              {Object.entries(v.characteristics).map(
                                ([key, val]) => (
                                  <Group key={key} justify="space-between">
                                    <Text size="sm">{key}</Text>
                                    <Text size="sm" c="dimmed">
                                      {val}
                                    </Text>
                                  </Group>
                                ),
                              )}
                            </Stack>
                          </Card>
                        )}
                    </Collapse>
                  </Table.Td>
                </Table.Tr>,
              ])}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      <Drawer
        opened={drawerOpened}
        onClose={() => {
          closeDrawer();
          resetForm();
        }}
        title={editingVehicle ? t("editVehicle") : t("addVehicle")}
        position="right"
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label={t("vin")}
            placeholder="1HGBH41JXMN109186"
            value={formVin}
            onChange={(e) => {
              setFormVin(e.target.value);
              setVinDecodeError("");
            }}
          />
          <Group gap="xs">
            <Button
              variant="light"
              size="sm"
              loading={decodingVin}
              onClick={handleDecodeVin}
              disabled={!formVin.trim() || formVin.trim().length !== 17}
            >
              {decodingVin ? t("vinDecoding") : t("decodeByVin")}
            </Button>
          </Group>
          {vinDecodeError && (
            <Text size="sm" c="red">
              {vinDecodeError}
            </Text>
          )}
          <Select
            label={t("make")}
            placeholder={t("make")}
            data={makes.map((m) => ({ value: m.name, label: m.name }))}
            value={formMake}
            onChange={(v) => setFormMake(v ?? "")}
            searchable
            clearable
          />
          <NumberInput
            label={t("year")}
            placeholder="2020"
            value={formYear}
            onChange={setFormYear}
            min={1990}
            max={new Date().getFullYear() + 1}
          />
          {models.length === 0 && externalModels.length > 0 && (
            <Text size="sm" c="dimmed">
              {t("searchInExternal")}
            </Text>
          )}
          <Select
            label={t("model")}
            placeholder={t("model")}
            data={modelOptions}
            value={
              formModelId
                ? String(formModelId)
                : externalModels.some((m) => m.Model_Name === formModel)
                  ? `ext-${externalModels.findIndex((m) => m.Model_Name === formModel)}`
                  : null
            }
            onChange={handleModelSelect}
            searchable
            clearable
          />
          {formModelId && (
            <Group grow>
              <Select
                label={t("bodyType")}
                placeholder={t("allBodyTypes")}
                data={[
                  { value: "", label: t("allBodyTypes") },
                  ...bodyTypes.map((v) => ({ value: v, label: v })),
                ]}
                value={formBodyType ?? ""}
                onChange={(v) => setFormBodyType(v || null)}
                clearable
                disabled={
                  !formYear ||
                  isNaN(parseInt(String(formYear), 10)) ||
                  parseInt(String(formYear), 10) < 1990
                }
              />
              <Select
                label={t("engineType")}
                placeholder={t("allEngineTypes")}
                data={[
                  { value: "", label: t("allEngineTypes") },
                  ...engineTypes.map((v) => ({ value: v, label: v })),
                ]}
                value={formEngineType ?? ""}
                onChange={(v) => setFormEngineType(v || null)}
                clearable
                disabled={
                  !formYear ||
                  isNaN(parseInt(String(formYear), 10)) ||
                  parseInt(String(formYear), 10) < 1990
                }
              />
            </Group>
          )}
          {formModelId && (
            <Select
              label={t("modification")}
              placeholder={
                formYear && parseInt(String(formYear), 10) >= 1990
                  ? t("modification")
                  : t("yearRequiredForModifications")
              }
              data={modifications.map((m) => {
                const years =
                  m.year_from != null || m.year_to != null
                    ? ` (${m.year_from ?? "?"}-${m.year_to ?? "?"})`
                    : "";
                const chars = m.characteristics || {};
                const extras = [
                  chars["Тип кузова"],
                  chars["Тип двигателя"],
                  chars["Тип КПП"],
                ]
                  .filter(Boolean)
                  .join(", ");
                const label = extras
                  ? `${m.name}${years} — ${extras}`
                  : `${m.name}${years}`;
                return { value: String(m.id), label };
              })}
              value={formModificationId ? String(formModificationId) : null}
              onChange={(v) =>
                setFormModificationId(v ? parseInt(v, 10) : null)
              }
              searchable
              clearable
              disabled={
                !formYear ||
                isNaN(parseInt(String(formYear), 10)) ||
                parseInt(String(formYear), 10) < 1990
              }
            />
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={closeDrawer}>
              {t("cancel")}
            </Button>
            <Button loading={saving} onClick={handleSave}>
              {tDashboard("save")}
            </Button>
          </Group>
        </Stack>
      </Drawer>
    </Stack>
  );
}
