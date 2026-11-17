export type ProOpenOpts = {
  reason?: "copy" | "pro" | "favorite";
  initialPlan?: string;
  entry?: "plans" | "test";
};

type Registrar = (opts?: ProOpenOpts) => void;

let openProModalFn: Registrar | null = null;

/** 由布局里的 ProModalHost 注册，全站「开通 PRO」都走这一处弹窗 */
export function registerProModal(fn: Registrar | null) {
  openProModalFn = fn;
}

export function openProModal(opts: ProOpenOpts = {}) {
  openProModalFn?.(opts);
}
