declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

/** 统计挂了不能影响支付，所以调用点一律不判断返回值 */
export function track(event: string, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // 手机是主流量入口，也是付费断头路所在，所以每个事件都带上设备
  const device = window.matchMedia("(hover: none)").matches ? "mobile" : "desktop";
  window.umami?.track(event, { device, ...data });
}
