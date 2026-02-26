import DocumentsClient from "./DocumentsClient";

export const metadata = {
  title: "Dökümanlar | asist",
  description: "Analiz edilen tüm dökümanlarınız.",
};

export default function DocumentsPage() {
  return <DocumentsClient />;
}
