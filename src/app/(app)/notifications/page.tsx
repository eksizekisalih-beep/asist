import NotificationsClient from "./NotificationsClient";

export const metadata = {
  title: "Bildirimler | asist",
  description: "Yapay zeka asistanınızın sizin için hazırladığı bildirimler ve öneriler.",
};

export default function NotificationsPage() {
  return <NotificationsClient />;
}
