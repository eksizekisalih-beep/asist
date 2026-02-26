import RemindersClient from "./RemindersClient";

export const metadata = {
  title: "Hatırlatıcılar | asist",
  description: "Planlanmış randevularınız ve görevleriniz.",
};

export default function RemindersPage() {
  return <RemindersClient />;
}
