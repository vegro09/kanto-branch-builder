import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ----------------------------------------------------------------------------
 * Kanto Tree — infinite nested micro-stepping task & prompt architecture tool
 * Kanto Empire Master Brand Constitution — Archetype A: Dynamic Flat UI
 * -------------------------------------------------------------------------- */

export type TaskStatus = "todo" | "in_progress" | "done";

export interface KantoTask {
  id: string;
  title: string;
  notes: string;
  parentId: string | null;
  status: TaskStatus;
  isExpanded?: boolean;
  createdAt: number;
}

type Lang = "en" | "ar";

const STORAGE_KEY = "kanto_tree_data";

/* ----------------------------- Design tokens ----------------------------- */

const C = {
  cream: "#F5F5DC",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#E5E5D8",
  dark: "#333333",
  muted: "#777777",
  done: "#10B981",
  progress: "#EAB308",
  danger: "#EF4444",
} as const;

const RADIUS = 8;

const STATUS_COLOR: Record<TaskStatus, string> = {
  todo: C.muted,
  in_progress: C.progress,
  done: C.done,
};

/* ------------------------------ Translations ----------------------------- */

const STRINGS = {
  en: {
    tagline: "Infinite micro-stepping architecture",
    expandAll: "Expand All",
    collapseAll: "Collapse All",
    export: "Export JSON",
    import: "Import JSON",
    langToggle: "عربي",
    search: "Search tasks…",
    newRoot: "New Root Node",
    empty: "No nodes yet. Create your first root node.",
    noMatch: "No tasks match your search.",
    inspector: "Inspector",
    noSelection: "Select a node to inspect its details.",
    root: "Root Node",
    sub: "Sub-node",
    level: "Level",
    title: "Title",
    titlePh: "Node title",
    status: "Status",
    todo: "Todo",
    in_progress: "In Progress",
    done: "Done",
    progress: "Subtask completion",
    directives: "Deep Directives & Prompts",
    directivesPh:
      "AI prompts, execution plans, architectural notes…",
    addSubtask: "Add Subtask",
    deleteNode: "Delete Node",
    confirmDelete: "Delete this node and all descendants?",
    confirm: "Confirm Delete",
    cancel: "Cancel",
    shortcuts: "ENTER = sibling · TAB = subtask · ESC = deselect",
    nodes: "NODES",
    completed: "DONE",
    untitled: "Untitled node",
  },
  ar: {
    tagline: "بنية تفصيلية لا نهائية للمهام",
    expandAll: "توسيع الكل",
    collapseAll: "طي الكل",
    export: "تصدير JSON",
    import: "استيراد JSON",
    langToggle: "English",
    search: "ابحث في المهام…",
    newRoot: "عقدة جذر جديدة",
    empty: "لا توجد عقد بعد. أنشئ أول عقدة جذر.",
    noMatch: "لا توجد مهام مطابقة للبحث.",
    inspector: "لوحة التفاصيل",
    noSelection: "اختر عقدة لعرض تفاصيلها.",
    root: "عقدة جذر",
    sub: "عقدة فرعية",
    level: "المستوى",
    title: "العنوان",
    titlePh: "عنوان العقدة",
    status: "الحالة",
    todo: "قيد الانتظار",
    in_progress: "قيد التنفيذ",
    done: "مكتملة",
    progress: "نسبة إنجاز المهام الفرعية",
    directives: "التوجيهات العميقة والأوامر",
    directivesPh: "أوامر الذكاء الاصطناعي، خطط التنفيذ، ملاحظات معمارية…",
    addSubtask: "إضافة مهمة فرعية",
    deleteNode: "حذف العقدة",
    confirmDelete: "حذف هذه العقدة وكل ما يتفرع عنها؟",
    confirm: "تأكيد الحذف",
    cancel: "إلغاء",
    shortcuts: "ENTER = عقدة شقيقة · TAB = عقدة فرعية · ESC = إلغاء التحديد",
    nodes: "العقد",
    completed: "المكتملة",
    untitled: "عقدة بلا عنوان",
  },
} as const;

/* -------------------------------- Helpers -------------------------------- */

const uid = (): string =>
  `k_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

function makeTask(parentId: string | null, title = ""): KantoTask {
  return {
    id: uid(),
    title,
    notes: "",
    parentId,
    status: "todo",
    isExpanded: true,
    createdAt: Date.now(),
  };
}

function isKantoTask(v: unknown): v is KantoTask {
  if (typeof v !== "object" || v === null) return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t["id"] === "string" &&
    typeof t["title"] === "string" &&
    (t["parentId"] === null || typeof t["parentId"] === "string") &&
    (t["status"] === "todo" ||
      t["status"] === "in_progress" ||
      t["status"] === "done")
  );
}

function normalize(raw: unknown): KantoTask[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isKantoTask).map((t) => ({
    id: t.id,
    title: t.title,
    notes: typeof t.notes === "string" ? t.notes : "",
    parentId: t.parentId ?? null,
    status: t.status,
    isExpanded: t.isExpanded !== false,
    createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
  }));
}

function childrenOf(tasks: KantoTask[], id: string | null): KantoTask[] {
  return tasks
    .filter((t) => t.parentId === id)
    .sort((a, b) => a.createdAt - b.createdAt);
}

function descendantIds(tasks: KantoTask[], id: string): string[] {
  const out: string[] = [];
  const walk = (pid: string) => {
    for (const c of tasks) {
      if (c.parentId === pid) {
        out.push(c.id);
        walk(c.id);
      }
    }
  };
  walk(id);
  return out;
}

function depthOf(tasks: KantoTask[], id: string): number {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  let d = 0;
  let cur = byId.get(id);
  while (cur && cur.parentId) {
    d += 1;
    cur = byId.get(cur.parentId);
  }
  return d;
}

/** Percentage of direct + nested leaf completion for a node. */
function progressOf(tasks: KantoTask[], id: string): number | null {
  const kids = descendantIds(tasks, id);
  if (kids.length === 0) return null;
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const leaves = kids.filter((k) => !tasks.some((t) => t.parentId === k));
  const pool = leaves.length > 0 ? leaves : kids;
  const done = pool.filter((k) => byId.get(k)?.status === "done").length;
  return Math.round((done / pool.length) * 100);
}

function matchIds(tasks: KantoTask[], query: string): Set<string> | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const keep = new Set<string>();
  for (const t of tasks) {
    if (
      t.title.toLowerCase().includes(q) ||
      t.notes.toLowerCase().includes(q)
    ) {
      keep.add(t.id);
      let cur = byId.get(t.id);
      while (cur && cur.parentId) {
        keep.add(cur.parentId);
        cur = byId.get(cur.parentId);
      }
    }
  }
  return keep;
}

/* --------------------------------- Icons --------------------------------- */

const Chevron: React.FC<{ open: boolean; rtl: boolean }> = ({ open, rtl }) => (
  <svg
    viewBox="0 0 24 24"
    width={13}
    height={13}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="square"
    style={{
      transform: open
        ? "rotate(90deg)"
        : rtl
          ? "rotate(180deg)"
          : "rotate(0deg)",
      transition: "transform 120ms linear",
    }}
    aria-hidden="true"
  >
    <path d="M9 5l7 7-7 7" />
  </svg>
);

const IconPlus: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width={13}
    height={13}
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="square"
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const IconTrash: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    width={13}
    height={13}
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="square"
    aria-hidden="true"
  >
    <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" />
  </svg>
);

/* ------------------------------ Atom widgets ----------------------------- */

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <span
    className="inline-block h-[8px] w-[8px] shrink-0 rounded-full"
    style={{ backgroundColor: color }}
  />
);

const BarButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  solid?: boolean;
  danger?: boolean;
  title?: string;
}> = ({ onClick, children, solid, danger, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className="rounded-[8px] border px-[13px] py-[5px] text-[12px] font-medium shadow-none transition-colors"
    style={{
      borderColor: danger ? C.danger : C.black,
      backgroundColor: danger ? C.danger : solid ? C.black : C.white,
      color: danger || solid ? C.white : C.black,
    }}
  >
    {children}
  </button>
);

/* ------------------------------- Tree node ------------------------------- */

interface NodeProps {
  task: KantoTask;
  tasks: KantoTask[];
  depth: number;
  rtl: boolean;
  lang: Lang;
  visible: Set<string> | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onSibling: (id: string) => void;
  onChild: (id: string) => void;
  onCycleStatus: (id: string) => void;
  focusId: string | null;
  onFocused: () => void;
}

const TreeNode: React.FC<NodeProps> = (p) => {
  const {
    task,
    tasks,
    depth,
    rtl,
    lang,
    visible,
    selectedId,
    onSelect,
    onToggle,
    onRename,
    onSibling,
    onChild,
    onCycleStatus,
    focusId,
    onFocused,
  } = p;

  const t = STRINGS[lang];
  const inputRef = useRef<HTMLInputElement>(null);
  const kids = childrenOf(tasks, task.id).filter(
    (c) => !visible || visible.has(c.id),
  );
  const hasKids = childrenOf(tasks, task.id).length > 0;
  const open = task.isExpanded !== false;
  const selected = selectedId === task.id;
  const pct = progressOf(tasks, task.id);

  useEffect(() => {
    if (focusId === task.id && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
      onFocused();
    }
  }, [focusId, task.id, onFocused]);

  const startSide = rtl ? "right" : "left";

  return (
    <div className="relative">
      {/* Node row */}
      <div
        role="treeitem"
        aria-selected={selected}
        aria-expanded={hasKids ? open : undefined}
        tabIndex={-1}
        onMouseDown={() => onSelect(task.id)}
        className="flex items-center gap-[8px] rounded-[8px] border px-[13px] py-[8px] shadow-none transition-colors"
        style={{
          borderColor: selected ? C.black : C.gray,
          backgroundColor: selected ? C.black : C.white,
          color: selected ? C.white : C.black,
        }}
      >
        <button
          type="button"
          aria-label="toggle"
          onClick={(e) => {
            e.stopPropagation();
            if (hasKids) onToggle(task.id);
          }}
          className="flex h-[13px] w-[13px] items-center justify-center shadow-none"
          style={{ opacity: hasKids ? 1 : 0.2, color: "inherit" }}
        >
          <Chevron open={open} rtl={rtl} />
        </button>

        <button
          type="button"
          aria-label="status"
          onClick={(e) => {
            e.stopPropagation();
            onCycleStatus(task.id);
          }}
          className="shadow-none"
        >
          <Dot color={STATUS_COLOR[task.status]} />
        </button>

        <input
          ref={inputRef}
          value={task.title}
          placeholder={t.titlePh}
          onChange={(e) => onRename(task.id, e.target.value)}
          onFocus={() => onSelect(task.id)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSibling(task.id);
            } else if (e.key === "Tab" && !e.shiftKey) {
              e.preventDefault();
              onChild(task.id);
            }
          }}
          className="min-w-0 flex-1 bg-transparent text-[14px] outline-none shadow-none"
          style={{
            color: "inherit",
            fontWeight: task.parentId === null ? 700 : 500,
            textDecoration: task.status === "done" ? "line-through" : "none",
          }}
        />

        {pct !== null && (
          <span
            className="rounded-[8px] border px-[5px] py-[3px] font-mono text-[10px]"
            style={{
              borderColor: selected ? C.dark : C.gray,
              color: selected ? C.white : C.muted,
            }}
          >
            {pct}%
          </span>
        )}

        <button
          type="button"
          aria-label="add subtask"
          onClick={(e) => {
            e.stopPropagation();
            onChild(task.id);
          }}
          className="rounded-[8px] border p-[3px] shadow-none"
          style={{
            borderColor: selected ? C.dark : C.gray,
            color: "inherit",
          }}
        >
          <IconPlus />
        </button>
      </div>

      {/* Children with orthogonal blueprint lines */}
      {hasKids && open && kids.length > 0 && (
        <div
          className="relative"
          style={{ [startSide]: 0, paddingInlineStart: 21 } as React.CSSProperties}
        >
          {/* vertical stem */}
          <div
            className="absolute"
            style={{
              [startSide]: 10,
              top: 0,
              bottom: 0,
              width: 1,
              backgroundColor: C.black,
            } as React.CSSProperties}
          />
          {kids.map((child) => (
            <div key={child.id} className="relative pt-[8px]">
              {/* horizontal branch */}
              <div
                className="absolute"
                style={{
                  [startSide]: -11,
                  top: 8 + 18,
                  width: 11,
                  height: 1,
                  backgroundColor: C.black,
                } as React.CSSProperties}
              />
              <TreeNode {...p} task={child} depth={depth + 1} />
            </div>
          ))}
          {/* mask the stem below last child's branch */}
          <div
            className="absolute"
            style={{
              [startSide]: 10,
              bottom: 0,
              width: 1,
              height: `calc(100% - ${8 + 18 + 1}px)`,
              backgroundColor: C.cream,
            } as React.CSSProperties}
          />
        </div>
      )}
    </div>
  );
};

/* ------------------------------ Main component ---------------------------- */

const KantoTree: React.FC = () => {
  const [tasks, setTasks] = useState<KantoTask[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<Lang>("en");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const t = STRINGS[lang];
  const rtl = lang === "ar";

  /* persistence */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setTasks(normalize(JSON.parse(raw)));
    } catch {
      /* ignore corrupt payloads */
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      /* storage unavailable */
    }
  }, [tasks, loaded]);

  const visible = useMemo(() => matchIds(tasks, query), [tasks, query]);
  const roots = useMemo(
    () => childrenOf(tasks, null).filter((r) => !visible || visible.has(r.id)),
    [tasks, visible],
  );
  const selected = useMemo(
    () => tasks.find((x) => x.id === selectedId) ?? null,
    [tasks, selectedId],
  );

  /* mutations */
  const addRoot = useCallback(() => {
    const n = makeTask(null);
    setTasks((prev) => [...prev, n]);
    setSelectedId(n.id);
    setFocusId(n.id);
  }, []);

  const addChild = useCallback((parentId: string) => {
    const n = makeTask(parentId);
    setTasks((prev) =>
      [...prev, n].map((x) =>
        x.id === parentId ? { ...x, isExpanded: true } : x,
      ),
    );
    setSelectedId(n.id);
    setFocusId(n.id);
  }, []);

  const addSibling = useCallback(
    (id: string) => {
      const cur = tasks.find((x) => x.id === id);
      const n = makeTask(cur ? cur.parentId : null);
      setTasks((prev) => [...prev, n]);
      setSelectedId(n.id);
      setFocusId(n.id);
    },
    [tasks],
  );

  const rename = useCallback((id: string, title: string) => {
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, title } : x)));
  }, []);

  const setNotes = useCallback((id: string, notes: string) => {
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, notes } : x)));
  }, []);

  const setStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
  }, []);

  const cycleStatus = useCallback((id: string) => {
    const order: TaskStatus[] = ["todo", "in_progress", "done"];
    setTasks((prev) =>
      prev.map((x) =>
        x.id === id
          ? { ...x, status: order[(order.indexOf(x.status) + 1) % 3]! }
          : x,
      ),
    );
  }, []);

  const toggle = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((x) =>
        x.id === id ? { ...x, isExpanded: x.isExpanded === false } : x,
      ),
    );
  }, []);

  const setAllExpanded = useCallback((isExpanded: boolean) => {
    setTasks((prev) => prev.map((x) => ({ ...x, isExpanded })));
  }, []);

  const removeNode = useCallback((id: string) => {
    setTasks((prev) => {
      const doomed = new Set<string>([id, ...descendantIds(prev, id)]);
      return prev.filter((x) => !doomed.has(x.id));
    });
    setSelectedId(null);
    setConfirming(false);
  }, []);

  /* import / export */
  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "kanto_tree_data.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [tasks]);

  const importJson = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = normalize(JSON.parse(String(reader.result)));
        if (parsed.length > 0) {
          setTasks(parsed);
          setSelectedId(null);
        }
      } catch {
        /* invalid file ignored */
      }
    };
    reader.readAsText(file);
  }, []);

  /* global escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedId(null);
        setConfirming(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const doneCount = tasks.filter((x) => x.status === "done").length;
  const selPct = selected ? progressOf(tasks, selected.id) : null;

  const fontBody = rtl
    ? "'Tajawal','AS_FUTURE',sans-serif"
    : "'Inter',sans-serif";

  return (
    <div
      dir={rtl ? "rtl" : "ltr"}
      className="flex h-screen w-full flex-col overflow-hidden shadow-none"
      style={{ backgroundColor: C.cream, color: C.black, fontFamily: fontBody }}
    >
      {/* ------------------------------ Top bar ----------------------------- */}
      <header
        className="flex flex-wrap items-center justify-between gap-[13px] border-b px-[21px] py-[13px]"
        style={{ borderColor: C.gray, backgroundColor: C.white }}
      >
        <div className="flex items-baseline gap-[8px]">
          <h1 className="text-[21px] leading-none">
            <span
              style={{
                fontFamily: "'Playfair Display',Georgia,serif",
                fontStyle: "italic",
                fontWeight: 700,
              }}
            >
              Kanto
            </span>
            <span style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600 }}>
              {" "}
              Tree
            </span>
          </h1>
          <span className="font-mono text-[11px]" style={{ color: C.muted }}>
            {t.tagline}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-[8px]">
          <BarButton onClick={() => setAllExpanded(true)}>
            {t.expandAll}
          </BarButton>
          <BarButton onClick={() => setAllExpanded(false)}>
            {t.collapseAll}
          </BarButton>
          <BarButton onClick={exportJson}>{t.export}</BarButton>
          <BarButton onClick={() => fileRef.current?.click()}>
            {t.import}
          </BarButton>
          <BarButton solid onClick={() => setLang(rtl ? "en" : "ar")}>
            {t.langToggle}
          </BarButton>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = "";
            }}
          />
        </div>
      </header>

      {/* ------------------------------ Body -------------------------------- */}
      <div className="flex min-h-0 flex-1">
        {/* 62% canvas */}
        <main
          className="flex min-w-0 flex-col"
          style={{
            width: "62%",
            borderInlineEnd: `1px solid ${C.gray}`,
          }}
        >
          <div className="flex items-center gap-[8px] px-[21px] py-[13px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
              className="min-w-0 flex-1 rounded-[8px] border px-[13px] py-[8px] text-[13px] outline-none shadow-none"
              style={{
                borderColor: C.gray,
                backgroundColor: C.white,
                color: C.black,
              }}
            />
            <button
              type="button"
              onClick={addRoot}
              className="flex items-center gap-[5px] rounded-[8px] px-[13px] py-[8px] text-[13px] font-semibold shadow-none"
              style={{ backgroundColor: C.black, color: C.white }}
            >
              <IconPlus />
              {t.newRoot}
            </button>
          </div>

          <div
            role="tree"
            className="min-h-0 flex-1 overflow-auto px-[21px] pb-[21px]"
          >
            {roots.length === 0 ? (
              <p className="py-[34px] text-center text-[13px]" style={{ color: C.muted }}>
                {tasks.length === 0 ? t.empty : t.noMatch}
              </p>
            ) : (
              <div className="flex flex-col gap-[8px]">
                {roots.map((r) => (
                  <TreeNode
                    key={r.id}
                    task={r}
                    tasks={tasks}
                    depth={0}
                    rtl={rtl}
                    lang={lang}
                    visible={visible}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onToggle={toggle}
                    onRename={rename}
                    onSibling={addSibling}
                    onChild={addChild}
                    onCycleStatus={cycleStatus}
                    focusId={focusId}
                    onFocused={() => setFocusId(null)}
                  />
                ))}
              </div>
            )}
          </div>

          <div
            className="flex items-center justify-between border-t px-[21px] py-[8px] font-mono text-[11px]"
            style={{ borderColor: C.gray, color: C.muted, backgroundColor: C.white }}
          >
            <span>{t.shortcuts}</span>
            <span>
              {t.nodes}: {tasks.length} · {t.completed}: {doneCount}
            </span>
          </div>
        </main>

        {/* 38% inspector */}
        <aside
          className="min-w-0 overflow-auto"
          style={{ width: "38%", backgroundColor: C.white }}
        >
          {!selected ? (
            <div className="p-[21px]">
              <h2 className="text-[13px] font-semibold uppercase tracking-wide">
                {t.inspector}
              </h2>
              <p className="mt-[13px] text-[13px]" style={{ color: C.muted }}>
                {t.noSelection}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-[21px] p-[21px]">
              <div className="flex items-center justify-between">
                <span
                  className="rounded-[8px] border px-[8px] py-[3px] font-mono text-[10px] uppercase"
                  style={{ borderColor: C.gray, color: C.dark }}
                >
                  {selected.parentId === null ? t.root : t.sub} · {t.level}{" "}
                  {depthOf(tasks, selected.id)}
                </span>
                <span className="font-mono text-[10px]" style={{ color: C.muted }}>
                  {selected.id}
                </span>
              </div>

              <div className="flex flex-col gap-[5px]">
                <label
                  className="font-mono text-[10px] uppercase"
                  style={{ color: C.muted }}
                >
                  {t.title}
                </label>
                <input
                  value={selected.title}
                  placeholder={t.titlePh}
                  onChange={(e) => rename(selected.id, e.target.value)}
                  className="rounded-[8px] border px-[13px] py-[8px] text-[14px] font-semibold outline-none shadow-none"
                  style={{ borderColor: C.gray, color: C.black }}
                />
              </div>

              <div className="flex flex-col gap-[8px]">
                <label
                  className="font-mono text-[10px] uppercase"
                  style={{ color: C.muted }}
                >
                  {t.status}
                </label>
                <div className="flex flex-wrap gap-[8px]">
                  {(["todo", "in_progress", "done"] as TaskStatus[]).map((s) => {
                    const active = selected.status === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(selected.id, s)}
                        className="flex items-center gap-[5px] rounded-[8px] border px-[13px] py-[5px] text-[12px] font-medium shadow-none"
                        style={{
                          borderColor: active ? C.black : C.gray,
                          backgroundColor: active ? C.black : C.white,
                          color: active ? C.white : C.black,
                        }}
                      >
                        <Dot color={STATUS_COLOR[s]} />
                        {t[s]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {selPct !== null && (
                <div className="flex flex-col gap-[5px]">
                  <div className="flex items-center justify-between font-mono text-[10px]">
                    <span style={{ color: C.muted }}>{t.progress}</span>
                    <span>{selPct}%</span>
                  </div>
                  <div
                    className="h-[4px] w-full"
                    style={{ backgroundColor: C.gray }}
                  >
                    <div
                      className="h-[4px]"
                      style={{
                        width: `${selPct}%`,
                        backgroundColor: selPct === 100 ? C.done : C.black,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-[5px]">
                <label
                  className="font-mono text-[10px] uppercase"
                  style={{ color: C.muted }}
                >
                  {t.directives}
                </label>
                <textarea
                  value={selected.notes}
                  placeholder={t.directivesPh}
                  onChange={(e) => setNotes(selected.id, e.target.value)}
                  rows={13}
                  className="resize-none rounded-[8px] border p-[13px] font-mono text-[12px] leading-[21px] outline-none shadow-none"
                  style={{ borderColor: C.gray, color: C.black }}
                />
              </div>

              <div className="flex flex-wrap items-center gap-[8px]">
                <button
                  type="button"
                  onClick={() => addChild(selected.id)}
                  className="flex items-center gap-[5px] rounded-[8px] px-[13px] py-[8px] text-[13px] font-semibold shadow-none"
                  style={{ backgroundColor: C.black, color: C.white }}
                >
                  <IconPlus />
                  {t.addSubtask}
                </button>

                {!confirming ? (
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="flex items-center gap-[5px] rounded-[8px] border px-[13px] py-[8px] text-[13px] font-semibold shadow-none"
                    style={{ borderColor: C.danger, color: C.danger }}
                  >
                    <IconTrash />
                    {t.deleteNode}
                  </button>
                ) : (
                  <div
                    className="flex flex-wrap items-center gap-[8px] rounded-[8px] border p-[8px]"
                    style={{ borderColor: C.danger }}
                  >
                    <span className="text-[12px]" style={{ color: C.danger }}>
                      {t.confirmDelete}
                    </span>
                    <BarButton danger onClick={() => removeNode(selected.id)}>
                      {t.confirm}
                    </BarButton>
                    <BarButton onClick={() => setConfirming(false)}>
                      {t.cancel}
                    </BarButton>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default KantoTree;
