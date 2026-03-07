// /src/lib/mockErrors.ts

export const mockErrors = [
  {
    code: "P0171",
    title: "System Too Lean (Bank 1)",
    severity: "medium",
    description:
      "Система подачи топлива слишком бедная. Смесь содержит слишком много воздуха.",
    possibleCauses: [
      "Подсос воздуха",
      "Загрязнённый MAF датчик",
      "Низкое давление топлива",
      "Проблемы с форсунками",
    ],
  },
  {
    code: "P0300",
    title: "Random/Multiple Cylinder Misfire",
    severity: "high",
    description:
      "Обнаружены пропуски зажигания в одном или нескольких цилиндрах.",
    possibleCauses: [
      "Свечи зажигания",
      "Катушки зажигания",
      "Проблемы с топливом",
      "Компрессия двигателя",
    ],
  },
];
