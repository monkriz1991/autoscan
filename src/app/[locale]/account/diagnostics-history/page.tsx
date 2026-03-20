import { redirect } from "next/navigation";

export default function AccountDiagnosticsHistoryRedirect() {
  redirect("/superadmin/dashboard/diagnostics-history");
}
