import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "猫を探す",
  description: "里親募集中の猫を検索できます。品種、年齢、性別、地域などの条件で絞り込んで、あなたにぴったりの猫を見つけましょう。",
  openGraph: {
    title: "猫を探す | OnlyCats",
    description: "里親募集中の猫を検索できます。品種、年齢、性別、地域などの条件で絞り込んで、あなたにぴったりの猫を見つけましょう。",
  },
};

export default function PetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
