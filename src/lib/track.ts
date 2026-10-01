declare global {
  interface Window {
    umami?: {
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

/** 统计挂了不能影响支付，所以调用点一律不判断返回值 */
export function track(event: string, data?: Record<string, unknown>) {
  window.umami?.track(event, data);
}
