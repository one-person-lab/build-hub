# BuildHub Skill

让 Agent 在你写代码的过程中顺便把术语讲清楚：你说「鼠标放上去有个小提示」，它做完事会告诉你这叫 Tooltip，并给到 [buildhub.cn/tooltip](https://buildhub.cn/tooltip) 的页面链接。

它只做两件事：把模糊描述改成能直接发出去的需求；点出你描述了但没叫出名字的名词。不做学习路线、课程、练习题，也不会把一句简单需求扩成教程。

## 安装

把下面这段话完整发给你的 Agent：

```text
https://github.com/one-person-lab/build-hub

帮我安装这个仓库里的 skills/buildhub Skill。
```

或者用命令行装：

```bash
npx skills add https://github.com/one-person-lab/build-hub --skill buildhub
```

装进 Claude Code、Cursor 和其他支持 Agent Skill 的工具都可以。

## 怎么用

正常提需求就行：

```text
这个按钮鼠标放上去变个色，点下去也要有一下反馈。
```

想让它把话说明白：

```text
把这句话改成更准确、可以直接发给 Agent 的需求：
这个设置我想改了就马上生效，不想再点一次保存。
```

## 术语从哪来

`scripts/resolve.mjs` 拿你推断出来的候选术语去查 buildhub.cn 的搜索接口，只返回站点里真实存在的术语页。查不到就报未命中，不会编一个链接出来。

```bash
node scripts/resolve.mjs resolve --query Tooltip --query Hover
node scripts/resolve.mjs resolve --query Tooltip --locale en
node scripts/resolve.mjs resolve --help
```

需要 Node 18 以上。站点地址默认 https://buildhub.cn，可以用 `--site-url` 或 `BUILDHUB_SITE_URL` 指到别的部署。

## 目录

```text
skills/buildhub/
├── SKILL.md            # Agent 读的执行说明
├── README.md           # 这个文件
└── scripts/
    └── resolve.mjs     # 术语验证脚本
```
