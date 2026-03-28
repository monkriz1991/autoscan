import { redirect } from "next/navigation";

export default async function AccountDevicesRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect(`/${locale}/cabinet/dashboard/devices`);
}
