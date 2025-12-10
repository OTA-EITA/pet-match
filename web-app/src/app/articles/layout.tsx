import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "猫コラム",
  description: "猫との暮らしに役立つ情報をお届けします。里親になるまでの流れ、健康管理、しつけ、お手入れなど、猫と幸せに暮らすためのヒントが満載です。",
  openGraph: {
    title: "猫コラム | OnlyCats",
    description: "猫との暮らしに役立つ情報をお届けします。",
  },
};

export default function ArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
