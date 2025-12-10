import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "シェルター一覧",
  description: "保護猫活動を行うシェルターや個人の一覧です。信頼できる掲載者から猫を引き取りましょう。",
  openGraph: {
    title: "シェルター一覧 | OnlyCats",
    description: "保護猫活動を行うシェルターや個人の一覧です。",
  },
};

export default function SheltersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
