import { permanentRedirect } from "next/navigation";

// 原理词条已并入「概念 → AI」，旧地址永久跳转，避免外链失效
export default function PrinciplesPage() {
  permanentRedirect("/topics/ai");
}
