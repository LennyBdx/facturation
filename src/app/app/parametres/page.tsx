import { routes } from "@/config/routes";
import { redirect } from "next/navigation";

export default function SettingsIndex() {
  redirect(routes.settings.company);
}
