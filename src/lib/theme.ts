export const THEME_COLORS = [
  { name: "图鉴金", value: "#8a6a1f", hover: "#6f5518", dark: "#e8c767" },
  { name: "靛蓝", value: "#3559d8", hover: "#2a46b4", dark: "#7b93ea" },
  { name: "紫罗兰", value: "#7c3aed", hover: "#6d28d9", dark: "#a78bfa" },
  { name: "黛绿", value: "#0f766e", hover: "#115e59", dark: "#2dd4bf" },
  { name: "蜜橙", value: "#c2410c", hover: "#9a3412", dark: "#fb923c" },
  { name: "玫红", value: "#e11d48", hover: "#be123c", dark: "#fb7185" },
  { name: "樱粉", value: "#db2777", hover: "#be185d", dark: "#f472b6" },
  { name: "赤金", value: "#b45309", hover: "#92400e", dark: "#fbbf24" },
  { name: "石墨", value: "#525963", hover: "#414751", dark: "#b7bec9" },
];

export const COLOR_MODE_KEY = "vh-color-mode";
export const THEME_COLOR_KEY = "vh-theme-color";

export function applyThemeColor(value: string, hover: string, dark: string) {
  const root = document.documentElement;
  root.style.setProperty("--theme-brand", value);
  root.style.setProperty("--theme-brand-hover", hover);
  root.style.setProperty("--theme-dark-brand", dark);
  localStorage.setItem(THEME_COLOR_KEY, value);
}

// 首屏前同步执行：深色样式全部挂在 :root[data-color-mode="dark"] 上，
// 若等 React hydration 后再设置，第一帧必然渲染成浅色（闪白）。
export const THEME_INIT_SCRIPT = `(function(){
try{
var d=document.documentElement,k=${JSON.stringify(COLOR_MODE_KEY)},c=${JSON.stringify(THEME_COLOR_KEY)};
var s=localStorage.getItem(k);
var m=s==="dark"||(s===null&&window.matchMedia("(prefers-color-scheme: dark)").matches);
d.dataset.colorMode=m?"dark":"light";
var v=localStorage.getItem(c);
var t=${JSON.stringify(THEME_COLORS)}.find(function(x){return x.value===v});
if(t){
d.style.setProperty("--theme-brand",t.value);
d.style.setProperty("--theme-brand-hover",t.hover);
d.style.setProperty("--theme-dark-brand",t.dark);
}
}catch(e){}})();`;
