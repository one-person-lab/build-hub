// 低饱和、同明度档的矿物色，避免高纯色放一起显廉价。首项即默认色，改动要同步 site-overrides.css 的静态兜底。
export const THEME_COLORS = [
  { name: "夜紫", value: "#3a2a4d", hover: "#2d2040", dark: "#a97fe0" },
  { name: "香槟金", value: "#a8833f", hover: "#8a6a2f", dark: "#d4b36a" },
  { name: "黛蓝", value: "#3a5baf", hover: "#2e4a90", dark: "#89a3dd" },
  { name: "鸢尾", value: "#6a52b8", hover: "#56419b", dark: "#a594de" },
  { name: "松绿", value: "#1d6b5f", hover: "#17564d", dark: "#56b8a6" },
  { name: "陶土", value: "#b0573a", hover: "#91442d", dark: "#de9377" },
  { name: "石榴", value: "#a83a50", hover: "#8a2e40", dark: "#de7e93" },
  { name: "暮粉", value: "#bc6285", hover: "#9e4e6e", dark: "#e4a0bc" },
  { name: "焦糖", value: "#8a5a2b", hover: "#714823", dark: "#ce9a63" },
  { name: "墨蓝", value: "#2b3a55", hover: "#212d43", dark: "#8ea6c6" },
  { name: "石墨", value: "#4f5661", hover: "#414751", dark: "#b7bec9" },
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
