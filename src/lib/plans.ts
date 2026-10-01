export type Plan = {
  key: string;
  name: string;
  money: string;
  /** 划线原价，仅展示用；null 表示无限时优惠 */
  listPrice: string | null;
  days: number | "lifetime";
};

export const PLANS: Plan[] = [
  { key: "monthly", name: "BuildHub PRO 月卡", money: "9.90", listPrice: null, days: 30 },
  { key: "yearly", name: "BuildHub PRO 年卡", money: "58.00", listPrice: "98.00", days: 365 },
  { key: "lifetime", name: "BuildHub PRO 终身买断", money: "168.00", listPrice: "298.00", days: "lifetime" },
  // PRO_TEST_PAY=1 才存在：真钱验证通道，1 分钱走完整下单—扫码—回调—到账
  ...(process.env.PRO_TEST_PAY === "1"
    ? [{ key: "test", name: "BuildHub PRO 验证单", money: "0.01", listPrice: null, days: 1 } as Plan]
    : []),
];

export function getPlan(key: string): Plan | undefined {
  return PLANS.find((p) => p.key === key);
}

/** 终身 = 40 年（与数据库 datetime('+N days') 兼容的有限值） */
export function planDays(plan: Plan): number {
  return plan.days === "lifetime" ? 40 * 365 : plan.days;
}
