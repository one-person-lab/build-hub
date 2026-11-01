type AuthOpenOpts = {
  /** 触发登录的场景，用来把弹窗副标题写清楚 */
  reason?: "pro" | "favorite" | "playbook" | "copy";
  /** 登录成功后要接着做的事（付款、收藏、下载…） */
  onDone?: () => void;
};

type Registrar = (opts: AuthOpenOpts) => void;

let openAuthModal: Registrar | null = null;
let signedIn = false;

/** 由布局里的 AuthModalHost 注册，全局只挂一个登录弹窗实例 */
export function registerAuthModal(fn: Registrar | null) {
  openAuthModal = fn;
}

export function setSignedIn(value: boolean) {
  signedIn = value;
}

/**
 * 全站唯一的登录入口：已登录就直接往下做，未登录才弹统一登录框。
 * 需要登录的按钮一律调它，不要再各自挂 /account 链接或内嵌表单。
 */
export function requireLogin(opts: AuthOpenOpts = {}) {
  if (signedIn) {
    opts.onDone?.();
    return;
  }
  openAuthModal?.(opts);
}
