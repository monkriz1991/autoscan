import { redirect } from "next/navigation";

export default function AccountDevicesRedirect() {
  redirect("/superadmin/dashboard/devices");
}
