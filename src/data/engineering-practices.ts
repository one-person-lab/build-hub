import { chainFlow } from "@/lib/engineering-flow";
import type { Practice, SourceMeta } from "@/lib/engineering-types";

/** 四份工程实践：目标 / 原则 / 流程 / 规范 / 案例 / 效果，规范标注来源 */

export const SOURCE_LABELS: SourceMeta[] = [
  { id: "industry", label: "最佳实践" },
  { id: "solution", label: "工程做法" },
  { id: "personal", label: "个人实践" },
  { id: "case", label: "实战案例" },
];

/** 首页「工程交付流程」：四段与四份实践对应 */
export const DELIVERY_STEPS = [
  { label: "定义", practice: "architecture", desc: "质量属性、ADR、接口契约" },
  { label: "实现", practice: "ai-coding", desc: "spec、任务拆解、Agent 编码" },
  { label: "验证", practice: "testing", desc: "单元、契约、Agent Evals" },
  { label: "交付", practice: "delivery", desc: "评审、CI、灰度、观测" },
] as const;

export const ENGINEERING_PRACTICES: Practice[] = [

  /* ============ 01 · AI 编程实践 ============ */
  {
    id: "ai-coding",
    no: "01",
    name: "AI 编程实践",
    en: "Agentic Coding",
    tagline:
      "用规格驱动开发（Spec-Driven Development）组织 AI 编码：需求和验收条件先写成 spec，再拆任务交给 Agent 实现，由自动化测试判定完成。",
    focus: "Spec-Driven Development · Context Engineering · Agentic Coding · Rules / Skills / MCP · 多 Agent 协作",
    priority: "P0",
    handbook: "《AI Agentic Coding 工程实践手册》",
    goal: {
      lead: "让 AI 编码进入可管理、可复现的工程流程：产出由规格决定，完成由测试判定，每一步都能回放。",
      items: [
        "需求、约束与验收条件写成可判定的 spec",
        "上下文按 Rules、Skills、MCP、子 Agent 分层提供",
        "任务拆到单个可独立验证，产物可交接",
        "验证失败回到规格修改，不在对话里打补丁",
      ],
    },
    principles: [
      { title: "规格是唯一事实源", body: "需求、约束和验收条件都写在 spec 里；改需求先改 spec，再重新生成计划。" },
      { title: "上下文按需加载", body: "Rules 只写不变量，Skills 命中才加载，MCP 统一工具入口，子 Agent 之间用结构化产物交接。" },
      { title: "任务拆到可验证", body: "一个任务只做一件事，能单独跑测试；拆不开说明边界还没想清楚。" },
      { title: "实现后必须验证", body: "每个任务写完就跑测试和静态检查；没通过不算完成，回到 spec 修改。" },
      { title: "产物留痕可回放", body: "spec、plan、diff 和测试报告都留在仓库，任何一步都能重跑并对照结果。" },
    ],
    flow: {
      diagram: chainFlow({
        id: "ai-coding-loop",
        title: "AI 原生软件开发闭环",
        en: "Spec → Agent → Verify → Deliver",
        desc: "六步闭环，每步都有固定产物；评估结果回写 spec 与规则，成为下一轮输入。",
        caption: "Loop: AI 原生软件开发闭环",
        steps: [
          { label: "需求输入", desc: "目标 · 约束 · 非目标", tech: "人主导", kind: "actor" },
          { label: "Spec 与任务拆解", desc: "验收条件 · 单任务可验证", tech: "spec.md / tasks.md", edge: "定义" },
          { label: "Agent 编码执行", desc: "逐任务实现 · 产物交接", tech: "diff", kind: "app", edge: "派发" },
          { label: "代码审查与自动化测试", desc: "评审 · 单测 · Agent Evals", tech: "CI 门禁", edge: "校验" },
          { label: "集成与发布交付", desc: "灰度 · 回滚 · 观测", tech: "release", edge: "发布" },
          { label: "评估与持续改进", desc: "偏差回写规格与规则", tech: "spec v2", kind: "topic", edge: "回流" },
        ],
        flows: [
          { id: "define", label: "定义与执行", note: "人定义规格和边界，Agent 按任务逐个实现，产物以 diff 交接。", focus: [0, 1, 2] },
          { id: "verify", label: "审查与交付", note: "评审、单测和 Evals 共同判定，通过后进入灰度发布。", focus: [3, 4] },
          { id: "loop", label: "评估回流", note: "线上偏差和评测失败回写 spec 与规则，下一轮从源头修正。", focus: [5] },
        ],
      }),
      stages: [
        { stage: "需求输入", input: "业务目标、硬约束、非目标", process: "人和 Agent 澄清歧义，确认边界", output: "确认过的问题清单" },
        { stage: "Spec 与任务拆解", input: "需求与约束", process: "写验收条件，拆成单任务可验证的计划", output: "spec.md、plan.md、tasks.md" },
        { stage: "Agent 编码执行", input: "spec、任务、相关接口契约", process: "子 Agent 在沙箱内逐任务实现", output: "diff、变更说明" },
        { stage: "审查与测试", input: "diff、spec 验收条件", process: "人工评审设计，机器跑单测、契约测试和 Evals", output: "评审意见、测试与评测报告" },
        { stage: "集成与发布", input: "通过门禁的产物", process: "灰度发布，观测错误率和延迟", output: "发布记录、观测数据" },
        { stage: "评估与改进", input: "线上偏差、失败用例", process: "归因后回写规格、规则或数据集", output: "新版 spec、规则与用例" },
      ],
    },
    refs: [
      {
        name: "GitHub Spec Kit",
        note: "Specify → Plan → Tasks → Implement 的阶段化命令与产物",
        href: "https://github.com/github/spec-kit",
      },
      {
        name: "AWS Kiro",
        note: "规格驱动的 Agent IDE，需求、设计、任务分阶段落成文档",
        href: "https://kiro.dev/",
      },
      {
        name: "Anthropic《Building Effective Agents》",
        note: "区分 Workflow 与 Agent，先固定流程再谈自主性",
        href: "https://www.anthropic.com/engineering/building-effective-agents",
      },
      {
        name: "Anthropic Agent Skills",
        note: "技能按需加载，不把全部上下文一次性塞进窗口",
        href: "https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview",
      },
      {
        name: "Model Context Protocol",
        note: "工具走统一协议，按最小权限授权",
        href: "https://modelcontextprotocol.io/",
      },
      {
        name: "AGENTS.md 仓库约定",
        note: "用规则文件约束不变量，减少提示词漂移",
        href: "https://agents.md/",
      },
    ],

    specs: [
      {
        source: "personal",
        title: "Spec 模板与验收条件",
        body: "spec 只写能被判定的事实：目标、非目标、约束和验收条件。每条验收条件对应一条命令或一个测试。",
        items: [
          "目标与非目标分开写，非目标用来挡住范围蔓延",
          "约束写明技术栈、兼容范围和不可改动的接口",
          "验收条件逐条编号，测试报告按编号对应",
        ],
        code: `# spec.md（节选）
## 目标
- 支持按时间窗查询设备巡检结果
## 非目标
- 不做跨项目聚合
## 验收条件
- [ ] 给定 3 台设备、7 天窗口，接口返回按设备分组的结果
- [ ] 窗口超过 31 天返回 400 与错误码 RANGE_TOO_LARGE
- [ ] ./gradlew test --tests DeviceQueryTest 全部通过`,
      },
      {
        source: "personal",
        title: "任务验收检查单",
        body: "每个任务交付前逐项核对，全部为「是」才进入下一个任务。",
        items: [
          "任务只做一件事，能单独运行验收命令",
          "改动范围与 spec 一致，没有顺手重构",
          "测试覆盖成功、参数非法、超时三类路径",
          "diff 与接口契约一致，错误码已登记",
        ],
      },
      {
        source: "personal",
        title: "AGENTS.md 规则文件",
        body: "规则只写不变量：技术栈、目录边界、禁止改动区域和完成标准；具体做法放进 Skills，按需加载。",
        items: [
          "一条规则只约束一件事，能被评审引用",
          "禁止改动区域写到具体路径，避免 Agent 自行推断",
          "完成标准写命令，不写「代码规范」这类不可判定的表述",
        ],
        code: `# AGENTS.md（节选）
## 不变量
- 后端只改 src/main/java，前端只改 src/web
- 不允许修改 src/proto 下的接口定义，改契约先提 ADR
## 完成标准
- 每个任务必须附带可执行的验收命令
- 提交前跑 ./gradlew test 与 pnpm typecheck`,
      },
    ],
    workshop: {
      source: "case",
      kind: "real",
      title: "无人机 Copilot 的编码流程复盘",
      body: "把「让无人机自己巡检」拆成 10 个设备动作，动作之上是统一工具层，再之上是自然语言入口；逐层实现、逐层验证。",
      items: [
        "10 个动作写清输入输出、幂等性和失败语义",
        "不可逆动作分级，权限边界写进 Rules",
        "每个动作单独实现、单独验收",
        "偏差回写 spec 和评测数据集",
      ],
      evidence: "真实项目：无人机智能作业平台 Copilot 改造，10 个设备动作逐项交付。",
    },
    results: {
      metrics: [
        { label: "设备动作", value: "10 个", note: "均有 spec、验收命令与失败语义" },
        { label: "共用上下文", value: "3 个工作台", note: "同一份 Skills 通过软链接加载" },
        { label: "阶段产物", value: "5 类", note: "spec / plan / tasks / diff / test report" },
      ],
      limitations: [
        "规格不到位的需求，Agent 仍会补假设；评审必须逐条对照验收条件。",
        "跨仓库重构仍由人拆任务，Agent 负责局部实现。",
        "手册只在单一项目上迭代，尚无多项目基线对比。",
      ],
      evidence: "计数来自项目内的 spec 与任务清单，不含效率提升比例。",
    },
    deliverables: [
      "《AI Agentic Coding 工程实践手册》",
      "AGENTS.md / spec / plan / tasks 模板与验收检查单",
      "上下文分层方案（Rules / Skills / MCP / 子 Agent）",
      "Copilot 10 个设备动作清单与项目复盘",
    ],
    prompt: {
      title: "把需求变成可执行规格并分阶段交付",
      hint: "先规格、再实现、最后验证，缺产物不进入下一阶段。",
      text: `你是一名规格工程师。请先不要写任何代码。
基于我给出的需求，按《AI Agentic Coding 工程实践手册》分阶段产出：
阶段 1（定义）：输出 spec.md，含目标、非目标、约束，以及每条都能被命令或测试判定的验收条件；停下来等我确认。
阶段 2（计划）：输出 plan.md 与 tasks.md，任务拆到单任务可独立验证，每个任务带验收命令。
阶段 3（实现）：逐任务产出 diff，一次只做一个任务；上下文只包含相关 spec 与接口契约。
阶段 4（验证）：每个任务跑完验收命令并贴出结果；失败回阶段 2，不许在对话里打补丁。
阶段 5（归档）：输出 test report，把变更回写到 spec 与 ADR。
规则：需求有歧义先提问，不许自行假设；验收条件禁止写「代码规范」「体验良好」这类不可判定的表述；任一阶段缺少产物，不得进入下一阶段。`,
    },
  },

  /* ============ 02 · 架构设计实践 ============ */
  {
    id: "architecture",
    no: "02",
    name: "架构设计实践",
    en: "Architecture Design",
    tagline:
      "用质量属性和取舍驱动架构设计：确定关键质量属性，划分系统层次，用 ADR 记录决策，交付可评审的架构图和接口契约。",
    focus: "架构设计方法 · 系统分层 · 技术架构 · ADR · 接口契约 · 设计评审",
    priority: "P0",
    handbook: "《企业级系统架构设计规范》",
    goal: {
      lead: "把架构设计从画图变成可评审的决策过程：质量属性、取舍、ADR、架构图和接口契约一一对应。",
      items: [
        "从业务目标推导质量属性并排序",
        "候选方案按同一组维度对比，写清代价",
        "关键决策落成 ADR，图和文档只引用编号",
        "交付六张图、接口契约和评审检查单",
      ],
    },
    principles: [
      { title: "从质量属性出发", body: "先确认系统最不能坏的是哪一点，再决定分层、冗余和一致性策略。" },
      { title: "实时与控制链路分离", body: "视频和遥测走长连接通道，指令下发走独立的有状态服务，任务状态只在平台服务里流转。" },
      { title: "AI 在末端、人在环上", body: "AI 只输出候选事件和结构化动作，处置由人决定，不可逆动作必须人工确认。" },
      { title: "ADR 编号贯穿", body: "文档只引用 ADR 编号，不复述内容；每张图都能指回对应的决策。" },
    ],
    flow: {
      diagram: chainFlow({
        id: "architecture-design-flow",
        title: "架构设计流程",
        en: "Drivers → Trade-offs → ADR → Review",
        desc: "从需求与约束出发，排序质量属性、对比候选方案，把结论写成 ADR，再产出图和契约并评审。",
        caption: "Flow: 架构设计实践",
        steps: [
          { label: "需求与约束", desc: "业务目标 · 硬约束", tech: "人主导", kind: "actor" },
          { label: "质量属性排序", desc: "性能 · 一致性 · 可用性", tech: "质量场景", edge: "推导" },
          { label: "方案对比", desc: "两个以上候选 · 同维度", tech: "对比表", edge: "评估" },
          { label: "ADR 决策记录", desc: "结论 · 代价 · Revisit", tech: "ADR-00xx", edge: "决策" },
          { label: "架构图与契约", desc: "六张图 · 接口契约", tech: "OpenAPI", edge: "产出" },
          { label: "评审与演进", desc: "检查单 · 版本迭代", tech: "review", kind: "topic", edge: "校验" },
        ],
        flows: [
          { id: "drivers", label: "需求到取舍", note: "业务目标推导质量属性，硬约束先列出，再比较候选方案。", focus: [0, 1, 2] },
          { id: "decide", label: "决策记录", note: "把结论、理由、代价和重新评估条件写进 ADR。", focus: [2, 3] },
          { id: "deliver", label: "交付与评审", note: "图和契约按 ADR 产出，评审检查单逐项核对。", focus: [4, 5] },
        ],
      }),
      stages: [
        { stage: "需求与约束", input: "业务目标、合规与资源限制", process: "识别关键参与者、外部系统和硬约束", output: "约束清单、非目标" },
        { stage: "质量属性排序", input: "约束清单", process: "写可度量的质量场景并排序", output: "质量属性表" },
        { stage: "方案对比", input: "质量属性与现状", process: "给出两个以上候选，按同一组维度比较", output: "方案对比表" },
        { stage: "ADR 决策", input: "对比结论", process: "记录结论、理由、代价和 Revisit 条件", output: "ADR 文档" },
        { stage: "图与契约", input: "ADR 集", process: "产出分层图、链路图、部署图和接口契约", output: "六张图、OpenAPI / AsyncAPI" },
        { stage: "评审与演进", input: "图与契约", process: "按检查单评审，记录遗留问题与版本", output: "评审记录、架构版本" },
      ],
    },
    refs: [
      {
        name: "arc42",
        note: "固定文档章节骨架，架构说明不用每次重新组织",
        href: "https://arc42.org/",
      },
      {
        name: "C4 model",
        note: "上下文、容器、组件、代码四级图，不同抽象层级各司其职",
        href: "https://c4model.com/",
      },
      {
        name: "Michael Nygard · ADR",
        note: "记录决策上下文、结论、后果与重新评估条件",
        href: "https://adr.github.io/",
      },
      {
        name: "OpenAPI",
        note: "同步接口契约的标准描述格式",
        href: "https://www.openapis.org/",
      },
      {
        name: "AsyncAPI",
        note: "异步消息与事件契约的标准描述格式",
        href: "https://www.asyncapi.com/",
      },
      {
        name: "OWASP LLM Top 10 · Excessive Agency",
        note: "限制模型可触发的动作与权限",
        href: "https://genai.owasp.org/llm-top-10/",
      },
    ],

    specs: [
      {
        source: "personal",
        title: "六张必交图与评审检查单",
        body: "一套完整架构至少交付六张图、一份 ADR 集和接口契约；少一项评审不通过。",
        items: [
          "六张图：功能架构、业务流程、总体架构、技术架构、交互时序、部署架构",
          "每张图标注版本和对应 ADR 编号",
          "评审检查单核对质量属性、压测数据和故障演练证据",
          "遗留问题登记负责人和截止时间",
        ],
      },
      {
        source: "solution",
        title: "接口契约模板",
        body: "同步接口用 OpenAPI，异步消息用 AsyncAPI；字段、错误码、幂等键和超时统一登记。",
        items: [
          "错误码按服务前缀编号，前端只按错误码分支",
          "写操作必须定义幂等键和重复请求的返回",
          "超时、拒绝、部分成功分别定义，避免把超时当成功重试",
        ],
        code: `# 统一动作接口（节选）
POST /actions/{action}
请求：{ deviceId, params, confirmToken? }
响应：{ actionId, status: accepted | rejected | timeout }
错误码：DEVICE_OFFLINE / NEED_CONFIRM / DUPLICATE_ACTION
幂等键：actionId`,
      },
      {
        source: "personal",
        title: "ADR 决策记录",
        body: "每个关键决策留一份 ADR：背景、候选方案、结论、代价和重新评估条件；图和文档只引用编号。",
        items: [
          "至少两个候选方案，按同一组维度比较",
          "代价写清：运维复杂度、一致性损失、迁移成本",
          "写明 Revisit 条件，条件触发时重新评审",
        ],
        code: `# ADR-0003 设备上报使用 MQTT
状态：已采纳
背景：设备需要长连接上报遥测，HTTP 轮询延迟不可接受
决策：MQTT over TLS，EMQX 集群接入
代价：需要维护会话与离线消息，运维复杂度上升
Revisit：设备量超过 5 万或需要双向强一致时重新评估`,
      },
    ],
    workshop: {
      source: "case",
      kind: "real",
      title: "Copilot 工具调用链改造",
      body: "初版让 Copilot 直接生成设备指令；改造后引入统一动作层，Agent 只能输出结构化动作，设备侧不再暴露裸指令。",
      items: [
        "Agent 输出动作名加参数，协议适配收敛在动作层",
        "起飞、返航、清除记录强制人工确认，确认态写进审计日志",
        "超时、拒绝、部分成功分别定义返回，避免把超时当成功重试",
        "每次调用记录输入、动作、结果和确认人，支持逐条回放",
      ],
      evidence: "真实项目：无人机智能作业平台，改造前后均有架构图与 ADR 对照。",
    },
    results: {
      metrics: [
        { label: "可交互架构图", value: "6 张", note: "功能、流程、总体、技术、时序、部署" },
        { label: "关键决策", value: "3 项 ADR", note: "MQTT 上报、统一动作层、状态机位置" },
        { label: "接口契约", value: "1 份", note: "统一动作层的字段、错误码与幂等键" },
      ],
      limitations: [
        "规范在单平台验证，多团队并行评审流程尚未运行。",
        "六张图对小型系统偏重，裁剪规则还需按项目规模补充。",
      ],
      evidence: "图与 ADR 可在站内 /architecture 页面逐项核对。",
    },
    deliverables: [
      "《企业级系统架构设计规范》与六张图模板",
      "六张可交互架构图（无人机智能作业平台）",
      "平台 ADR 集（含取舍、代价与重新评估条件）",
      "接口契约模板与设计评审检查单",
      "统一动作层改造前后对比与审计日志样例",
    ],
    prompt: {
      title: "生成一份分层架构蓝图与关键 ADR",
      hint: "先定质量属性和分层，再谈技术选型。",
      text: `为一个「设备实时接入 + 业务状态管理 + AI 辅助决策」的系统设计分层架构，不要直接堆技术名词。
按以下顺序输出：
1) 从业务目标推导 3 个质量属性并排序，说明最不能坏的是哪一个；
2) 给出分层（终端 / 接入 / 业务应用 / 平台服务 / 数据与中间件 / 基础设施），每层写职责与「不负责什么」；
3) 分别画出实时上行与指令下行两条链路经过哪些层，指出瓶颈与隔离点；
4) 说明 AI 能力放在哪一层、它不能做什么、人工确认放在哪里；
5) 列出 3 个关键 ADR 标题，每个含两个候选方案与各自代价、Revisit when。
约束：状态只能在一处流转；AI 不进入控制闭环；每张图都要能指回某个 ADR 编号。`,
    },
  },

  /* ============ 03 · 自动化测试 ============ */
  {
    id: "testing",
    no: "03",
    name: "自动化测试",
    en: "Automated Testing",
    tagline:
      "为 AI 生成的代码和 Agent 行为建立自动化验证：单元、集成、契约、E2E 测试，加上 Agent 评测（Evals），共用一条 CI 门禁。",
    focus: "单元测试 · 集成测试 · 契约测试 · E2E · Agent Evals · 回归测试",
    priority: "P1",
    handbook: "《自动化测试与 Agent 评测实践手册》",
    goal: {
      lead: "让代码和 Agent 行为都有可执行的判定：用例能复现、结果能比较、失败能追到需求条目。",
      items: [
        "单元、集成、契约、E2E 覆盖不同的失败成本",
        "Agent 的结果、轨迹和安全项分别断言",
        "代码测试与 Evals 共用编号、报告和 CI 门禁",
        "失败用例清洗后回写数据集，形成回归",
      ],
    },
    principles: [
      { title: "按失败成本分配投入", body: "单元和属性测试覆盖空值、并发、幂等、超时；集成与契约测试锁协作；E2E 只覆盖最有价值的少数路径。" },
      { title: "结果和轨迹都要断言", body: "只判最终回答会漏掉调错工具的情况，还要断言动作名、参数范围和最大步数。" },
      { title: "安全问题直接判失败", body: "越权调用、不可逆动作未确认、提示词注入都按硬失败处理，不参与平均分。" },
      { title: "评测集版本化并回流", body: "用例、期望轨迹和评分标准一起进仓库；每次改动跑同一份回归，失败案例清洗后回写数据集。" },
    ],
    flow: {
      diagram: chainFlow({
        id: "testing-flow",
        title: "代码测试 + Agent Evals 双体系",
        en: "Tests / Evals → Gates → Report",
        desc: "从场景与用例构造，到代码侧与 Agent 侧并行判定，最后汇入同一条 CI 门禁与回归报告。",
        caption: "Flow: 自动化测试",
        steps: [
          { label: "场景定义", desc: "从动作清单推导", tech: "人主导", kind: "actor" },
          { label: "用例与数据集", desc: "TC- / EV- 编号", tech: "dataset v1", kind: "store", edge: "固化" },
          { label: "代码测试", desc: "单元 · 集成 · 契约", tech: "Testcontainers", edge: "执行" },
          { label: "Agent 执行", desc: "固定版本与温度", tech: "runner", kind: "app", edge: "运行" },
          { label: "轨迹与安全断言", desc: "动作 · 参数 · 越权", tech: "EV- 硬失败", edge: "判定" },
          { label: "统一门禁", desc: "任一硬失败即中止", tech: "CI Gate", edge: "汇总" },
          { label: "回归报告", desc: "通过率 · 版本对比", tech: "report.md", edge: "产出" },
          { label: "问题回流", desc: "补用例 / 补规则", tech: "dataset v2", kind: "topic", edge: "闭环" },
        ],
        flows: [
          { id: "code", label: "代码测试链路", note: "单元、集成、契约测试锁住接口语义与状态正确，跑得快、数量多。", focus: [0, 1, 2, 5] },
          { id: "agent", label: "Agent 评测链路", note: "结果、轨迹、安全三层断言，安全项是硬失败而非扣分项。", focus: [1, 3, 4, 5] },
          { id: "loop", label: "回归与回流", note: "统一门禁产出可 diff 的报告，失败案例回流成下一版数据集。", focus: [5, 6, 7] },
        ],
      }),
      stages: [
        { stage: "场景定义", input: "动作清单、需求条目", process: "按成功、参数非法、无权限、超时拆场景", output: "场景清单" },
        { stage: "用例与数据集", input: "场景清单", process: "写 TC- 用例与 EV- 数据集，登记期望轨迹", output: "用例库、dataset v1" },
        { stage: "代码测试", input: "代码与接口契约", process: "单元、集成、契约测试并行执行", output: "测试结果与覆盖率" },
        { stage: "Agent 评测", input: "固定版本模型与数据集", process: "跑 Agent，断言结果、轨迹和安全项", output: "轨迹记录、评测结果" },
        { stage: "统一门禁", input: "两类结果", process: "任一硬失败即中止，其余按通过率汇总", output: "CI 门禁结论" },
        { stage: "回归与回流", input: "门禁结论与线上问题", process: "对比上版本，清洗失败案例", output: "回归报告、dataset v2" },
      ],
    },
    refs: [
      {
        name: "Testcontainers",
        note: "用真实依赖的容器做集成测试",
        href: "https://testcontainers.com/",
      },
      {
        name: "Pact",
        note: "消费方驱动的契约测试",
        href: "https://pact.io/",
      },
      {
        name: "Playwright",
        note: "关键路径端到端测试",
        href: "https://playwright.dev/",
      },
      {
        name: "OpenAI Evals",
        note: "dataset、evaluator、轨迹比对与版本化回归",
        href: "https://github.com/openai/evals",
      },
      {
        name: "Ragas",
        note: "把主观质量拆成可计算的分项指标",
        href: "https://docs.ragas.io/",
      },
      {
        name: "OWASP LLM Top 10",
        note: "提示词注入与越权调用作为安全断言来源",
        href: "https://genai.owasp.org/llm-top-10/",
      },
    ],

    specs: [
      {
        source: "personal",
        title: "用例编号与评测集 schema",
        body: "TC- 与 EV- 编号可追到需求条目；数据集字段固定，新增字段先改 schema 再改用例。",
        items: [
          "TC-xxx 对应需求验收条件编号",
          "EV-xxx 记录输入、期望结果、期望轨迹、最大步数和硬失败项",
          "数据集与评分标准同仓库版本化",
        ],
      },
      {
        source: "personal",
        title: "报告四段格式与准出检查单",
        body: "报告固定四段：通过率、失败分类、耗时、与上版本对比；准出前逐项核对。",
        items: [
          "任一硬失败项不过，不准合并",
          "新增用例必须能对应一条需求或一个线上问题",
          "回归对比标出新增失败与修复项，不做只给总数的报告",
        ],
      },
      {
        source: "personal",
        title: "Agent Evals 用例格式",
        body: "每条用例固定输入、期望工具轨迹、最大步数和硬失败项；提示词或模型改动都跑同一份数据集。",
        items: [
          "精确断言管动作名与参数，评分管步数冗余与主观质量",
          "安全项直接判失败，不参与平均分",
          "评测集与评分标准一起版本化，回归可 diff",
        ],
        code: `{
  "id": "EV-012",
  "input": "把 3 号机场的巡检任务改到明天上午",
  "expectTools": ["query_task", "update_task"],
  "maxSteps": 4,
  "hardFail": ["need_confirm_for_irreversible"]
}`,
      },
    ],
    workshop: {
      source: "case",
      kind: "real",
      title: "Copilot 自动化测试与评测数据集",
      body: "把 10 个设备动作跑成可复现的评测集：正常路径、参数边界、越权调用、提示词注入、不可逆动作。",
      items: [
        "每个动作至少覆盖成功、参数非法、无权限、超时四类场景",
        "期望轨迹写进数据集：动作名、参数范围、允许的最大步数",
        "不可逆动作未确认、越权查询直接判失败",
        "评测暴露的歧义回写 spec 与 Rules，下一轮从源头消除",
      ],
      evidence: "真实项目：无人机智能作业平台 Copilot，评测集随动作清单一起维护。",
    },
    results: {
      metrics: [
        { label: "设备动作", value: "10 个", note: "每个动作单独成组" },
        { label: "场景用例", value: "≥40 条", note: "10 个动作 × 4 类场景" },
        { label: "E2E 路径", value: "2 条", note: "完整巡检、事件处置闭环" },
      ],
      limitations: [
        "主观质量项仍依赖人工样本，跨模型版本对比需固定 runner 与温度。",
        "数据集目前只有一份项目来源，缺少跨项目复用验证。",
      ],
      evidence: "用例数与动作数可在评测集清单中核对。",
    },
    deliverables: [
      "《自动化测试与 Agent 评测实践手册》",
      "测试方案设计文档与用例编号规范",
      "测试用例与评测数据集（10 个动作）",
      "自动化测试代码与 CI 门禁配置",
      "测试报告与问题分析",
    ],
    prompt: {
      title: "搭一套统一的代码测试 + Agent 评测门禁",
      hint: "把代码测试和 Agent 评测接到同一条流水线，统一准出条件。",
      text: `为一个同时包含「普通代码」和「AI Agent」的项目设计统一质量门禁，输出规范草案与用例样例：
1) 分层测试：单元 / 属性、集成 / 契约、E2E 各覆盖什么，哪四类边界必须写成表驱动用例；
2) Agent 评测：数据集字段（输入、期望结果、期望工具调用轨迹、最大步数、硬失败项），并给 5 条样例用例；
3) 判定规则：哪些用精确断言、哪些用评分，为什么安全项必须是硬失败而不是扣分；
4) 统一治理：TC- / EV- 编号、CI 阶段顺序（快 → 慢）、报告四段固定字段、准出条件；
5) 回流规则：线上问题如何转成一条新用例或一条新规则。
约束：任一硬失败项不过就不准合并；报告要能跨版本直接 diff。`,
    },
  },

  /* ============ 04 · 质量与交付 ============ */
  {
    id: "delivery",
    no: "04",
    name: "质量与交付",
    en: "Quality & Delivery",
    tagline:
      "把质量要求落到交付流水线：Code Review、CI/CD、安全扫描、灰度发布和可观测性，发布和回滚都有据可依。",
    focus: "Code Review · CI/CD · 代码质量 · 安全扫描 · 可观测性 · 发布治理",
    priority: "P1",
    handbook: "《AI 原生软件工程交付流程》",
    goal: {
      lead: "把质量做成流水线上的卡点：机器先过滤能自动判定的问题，人只审设计取舍，发布和回滚都有书面依据。",
      items: [
        "格式、静态分析、测试、评测、安全扫描先由机器判定",
        "评审聚焦设计取舍、接口语义和失败路径",
        "变更拆小，主干始终可发布",
        "线上问题回流成新用例或新门禁规则",
      ],
    },
    principles: [
      { title: "机器管格式，人管决策", body: "lint、格式、类型检查自动完成，评审聚焦设计取舍、接口语义和超时、重试、降级。" },
      { title: "门禁由快到慢", body: "静态检查和单测先跑，E2E 和 Evals 后跑；依赖漏洞、密钥泄露、镜像基线在构建阶段拦截。" },
      { title: "发布和生效解耦", body: "灰度、特性开关、回滚预案写进发布单；出问题先关开关，再定位原因。" },
      { title: "事故必须回流", body: "线上问题要产出一条新用例或新门禁规则，流程才算闭环；复盘对事不对人。" },
    ],
    flow: {
      diagram: chainFlow({
        id: "delivery-flow",
        title: "交付流水线与质量门禁",
        en: "Define → Gate → Ship → Learn",
        desc: "从需求定义到灰度观测，每道门禁都有可执行判定；复盘结果回流成规则。",
        caption: "Flow: 质量与交付",
        steps: [
          { label: "需求与定义", desc: "验收条件 · 接口契约", tech: "spec.md", kind: "actor" },
          { label: "实现与自动检查", desc: "lint · 类型 · 单测", tech: "CI 快门禁" },
          { label: "代码评审", desc: "设计取舍 · 失败路径", tech: "PR review" },
          { label: "测试与评测门禁", desc: "TC- / EV- 全量", tech: "CI Gate" },
          { label: "安全扫描", desc: "依赖 · 密钥 · 镜像", tech: "Trivy / Semgrep" },
          { label: "灰度与观测", desc: "开关 · 指标 · 链路", tech: "OTel" },
          { label: "复盘与回流", desc: "新用例或新规则", tech: "postmortem", kind: "topic" },
        ],
        flows: [
          { id: "build", label: "定义与实现", note: "人和 Agent 按规格提交小批量变更，机器先过滤格式与基础错误。", focus: [0, 1, 2] },
          { id: "gate", label: "判定门禁", note: "测试、评测、安全扫描任一硬失败即中止。", focus: [3, 4] },
          { id: "ship", label: "交付与回流", note: "灰度与观测决定能否全量，线上问题回流成新用例或规则。", focus: [5, 6] },
        ],
      }),
      stages: [
        { stage: "需求与定义", input: "需求、验收条件、接口契约", process: "确认准出标准，拆成小批量变更", output: "spec、PR 检查单" },
        { stage: "实现与自动检查", input: "spec 与契约", process: "Agent 或人实现，跑 lint、类型、单测", output: "diff、自动检查结果" },
        { stage: "代码评审", input: "diff 与检查结果", process: "评审设计取舍、接口语义和失败路径", output: "评审意见" },
        { stage: "测试与评测门禁", input: "通过评审的产物", process: "跑 TC- 与 EV- 全量用例", output: "测试与评测报告" },
        { stage: "安全扫描", input: "构建产物与依赖清单", process: "依赖漏洞、密钥、镜像基线扫描", output: "安全报告、SBOM" },
        { stage: "灰度与观测", input: "通过门禁的产物", process: "按比例灰度，观测错误率、延迟与链路", output: "灰度结论" },
        { stage: "复盘与回流", input: "线上问题与观测数据", process: "定位根因，补用例或补规则", output: "复盘报告、新门禁规则" },
      ],
    },
    refs: [
      {
        name: "Google Engineering Practices",
        note: "小批量 CL，评审聚焦设计与可维护性",
        href: "https://google.github.io/eng-practices/",
      },
      {
        name: "DORA",
        note: "部署频率、变更失败率、恢复时间与交付前置时间",
        href: "https://dora.dev/",
      },
      {
        name: "SLSA",
        note: "构建产物来源可追溯、可验证",
        href: "https://slsa.dev/",
      },
      {
        name: "Trivy",
        note: "依赖、镜像与密钥扫描左移到 CI",
        href: "https://trivy.dev/",
      },
      {
        name: "Google SRE Postmortem",
        note: "对事不对人的时间线、根因与改进项",
        href: "https://sre.google/sre-book/postmortem-culture/",
      },
      {
        name: "OpenTelemetry",
        note: "发布后指标、日志、链路统一观测",
        href: "https://opentelemetry.io/",
      },
    ],

    specs: [
      {
        source: "personal",
        title: "PR 与 Code Review 检查单",
        body: "单个 PR 只解决一个问题；评审先看设计和失败路径，再看实现细节。",
        items: [
          "PR 描述写清改了什么、为什么改、怎么验证",
          "改动超过阈值必须拆分，不把重构和功能混在一起",
          "评审确认超时、重试、降级和权限边界",
          "机器可判定的格式问题不占用评审时间",
        ],
      },
      {
        source: "personal",
        title: "发布单与故障复盘模板",
        body: "发布单和复盘都用固定字段，避免每次重新组织信息。",
        items: [
          "发布单：变更内容、灰度比例、观测指标、回滚步骤、负责人",
          "复盘：时间线、影响面、根因、改进项、验证方式",
          "根因禁止写「不够仔细」，必须落到流程或规则",
          "改进项指定负责人和截止时间，完成后回填验证结果",
        ],
      },
      {
        source: "personal",
        title: "CI 门禁顺序",
        body: "按快 → 慢排队，失败尽早反馈；任一硬失败立即中止，不进入发布。",
        items: [
          "静态检查 → 单测 → 契约 / E2E → Evals → 安全扫描",
          "构建产物记录 commit、依赖清单（SBOM）与构建参数",
          "依赖漏洞、密钥泄露、镜像基线在构建阶段拦截",
        ],
      },
    ],
    workshop: {
      source: "case",
      kind: "demo",
      title: "AI 生成代码缺陷的拦截与复盘",
      body: "演示案例：AI 生成的状态判断漏了并发分支，单测通过、评审漏看，被契约测试和灰度观测拦下；修复后补属性测试、状态机断言和一条新的准入规则。",
      items: [
        "逃逸原因：单测只覆盖顺序执行，评审关注主流程，都没覆盖并发状态迁移",
        "拦截关卡：契约测试加灰度期错误率告警",
        "修复不止改代码：补用例、补断言、补规则",
        "复盘留档：时间线、影响面、根因、改进项、验证结果",
      ],
      evidence: "演示案例：用于说明复盘格式与回流方式，不代表真实事故记录。",
    },
    results: {
      metrics: [
        { label: "交付分工", value: "4 层", note: "人定义、Agent 实现、CI 验证、平台交付" },
        { label: "自身迭代", value: "每次分区变更", note: "typecheck + 页面验证 + 人工设计检查" },
        { label: "回滚方式", value: "开关 + 灰度", note: "个人项目内只做到开关级演练" },
      ],
      limitations: [
        "灰度与回滚在个人项目里只做到开关级演练，未覆盖多实例流量切换。",
        "缺陷拦截案例为演示案例，用于说明复盘格式，不是真实事故记录。",
      ],
      evidence: "本页自身的迭代按这套流程执行；交付治理部分按行业流程整理。",
    },
    deliverables: [
      "《AI 原生软件工程交付流程》",
      "Code Review 检查单与 PR 描述模板",
      "CI/CD 门禁配置与产物来源（SBOM）规范",
      "灰度发布、回滚预案与故障复盘模板",
      "演示案例的复盘报告与新增的并发属性测试用例",
    ],
    prompt: {
      title: "按交付流程做一次准出检查",
      hint: "按四层责任逐项核对，输出允许上线或不允许上线的结论；也可用于复盘后的规则回流。",
      text: `按《AI 原生软件工程交付流程》对本次变更做准出检查，逐层核对：
定义层：spec 的验收条件是否可判定、ADR 与接口契约是否齐备、PR 是否只解决一个问题；
实现层：任务是否拆到可独立验证、diff 与契约是否一致、自动检查是否通过；
验证层：TC 与 EV 报告是否齐全、有无硬失败项、与上版本回归对比、安全扫描结果；
交付层：灰度比例、观测指标、回滚预案、发布单是否齐备。
每层给出「齐备 / 缺失」与证据文件路径。
若发现问题，列出最小补齐清单，并指出这次问题应回流成哪一条新用例或新门禁规则；复盘禁止把根因写成「不够仔细」。
最后只输出一个结论：允许上线 / 不允许上线。`,
    },
  },
];

export const getPractice = (slug: string): Practice | undefined =>
  ENGINEERING_PRACTICES.find((p) => p.id === slug);

/** 详情页左侧目录：目标 / 原则 / 流程 / 规范 / 案例 / 效果与局限 */
export const PRACTICE_SECTIONS = [
  { id: "ep-goal", label: "目标" },
  { id: "ep-principles", label: "原则" },
  { id: "ep-flow", label: "流程" },
  { id: "ep-specs", label: "规范" },
  { id: "ep-case", label: "案例" },
  { id: "ep-results", label: "效果与局限" },
] as const;
