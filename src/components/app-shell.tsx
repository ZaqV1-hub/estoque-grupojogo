"use client";

import {
  ArrowRightLeft,
  Box,
  Building2,
  ChevronDown,
  FilePlus2,
  Filter,
  LogOut,
  MapPin,
  MoreVertical,
  Plus,
  Search,
} from "lucide-react";
import {
  startTransition,
  useActionState,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  createLocalAction,
  createMovementAction,
  createProductAction,
  logoutAction,
} from "@/app/actions";
import { SubmitButton } from "@/components/submit-button";
import { INITIAL_ACTION_STATE, type ActionState } from "@/lib/action-state";
import type { DashboardView } from "@/lib/inventory/dashboard";
import type { LocalStock, Product, User } from "@/lib/types";
import { cn } from "@/lib/utils";

type AppShellProps = {
  mode: "demo" | "google_sheets";
  currentUser: User;
  localStocks: LocalStock[];
  products: Product[];
  dashboard: DashboardView;
};

type MainTab = "movements" | "stocks";
type MovementType = "entrada" | "saida";

const UNIT_OPTIONS = [
  { value: "kg", label: "Quilogramas" },
  { value: "g", label: "Gramas" },
  { value: "litro", label: "Litros" },
  { value: "ml", label: "Mililitros" },
  { value: "un", label: "Unidades" },
  { value: "caixa", label: "Caixas" },
  { value: "fardo", label: "Fardos" },
  { value: "pacote", label: "Pacotes" },
];

const UNIT_LABELS = Object.fromEntries(UNIT_OPTIONS.map((unit) => [unit.value, unit.label]));

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[var(--line)] bg-white p-5 shadow-[var(--shadow-lg)]">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-[var(--text)]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--line)] px-3 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--panel-2)]"
          >
            Fechar
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusMessage({ state }: { state: ActionState }) {
  if (!state.message) {
    return null;
  }

  return (
    <p
      className={cn(
        "text-sm font-medium",
        state.status === "error" ? "text-red-500" : "text-emerald-600",
      )}
    >
      {state.message}
    </p>
  );
}

function SearchableSelect({
  name,
  label,
  placeholder,
  value,
  onChange,
  options,
  emptyMessage,
  addLabel,
  onAdd,
}: {
  name: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ id: string; label: string; meta?: string }>;
  emptyMessage: string;
  addLabel?: string;
  onAdd?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const selectedOption = options.find((option) => option.id === value) ?? null;

  const filteredOptions = useMemo(() => {
    const term = deferredQuery.trim().toLowerCase();

    if (!term) {
      return options.slice(0, 12);
    }

    return options
      .filter((option) =>
        `${option.label} ${option.meta ?? ""}`.toLowerCase().includes(term),
      )
      .slice(0, 12);
  }, [deferredQuery, options]);

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-[var(--muted)]">{label}</label>
      <input type="hidden" name={name} value={value} />
      <div className="relative">
        <div className="field flex items-center gap-2 px-3">
          <Search size={15} className="text-[var(--muted)]" />
          <input
            value={open ? query : selectedOption?.label ?? query}
            onFocus={() => {
              setOpen(true);
              setQuery(selectedOption?.label ?? "");
            }}
            onBlur={() => window.setTimeout(() => setOpen(false), 120)}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);

              if ((selectedOption?.label ?? "") !== event.target.value) {
                onChange("");
              }
            }}
            placeholder={placeholder}
            className="h-full w-full bg-transparent text-sm outline-none"
          />
          <ChevronDown size={15} className="text-[var(--muted)]" />
        </div>

        {open ? (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-[var(--line)] bg-white p-1 shadow-[var(--shadow-lg)]">
            {filteredOptions.length ? (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onChange(option.id);
                    setQuery(option.label);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm hover:bg-blue-50",
                    value === option.id && "bg-blue-50 text-blue-700",
                  )}
                >
                  <span className="font-medium">{option.label}</span>
                  {option.meta ? (
                    <span className="text-xs text-[var(--muted)]">{option.meta}</span>
                  ) : null}
                </button>
              ))
            ) : (
              <div className="space-y-3 p-3">
                <p className="text-sm text-[var(--muted)]">{emptyMessage}</p>
                {onAdd ? (
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onAdd();
                    }}
                    className="rounded-lg bg-[var(--accent)] px-3 py-2 text-sm font-bold text-white"
                  >
                    {addLabel ?? "Adicionar"}
                  </button>
                ) : null}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MetricCard({
  icon,
  title,
  value,
  detail,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
  tone: "blue" | "green" | "orange";
}) {
  const styles = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-orange-50 text-orange-600",
  } as const;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-3.5 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-full", styles[tone])}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-semibold text-[var(--muted)]">{title}</p>
          <p className="mt-0.5 text-2xl font-bold leading-none text-[var(--text)]">{value}</p>
          <p className="mt-1 text-sm text-[var(--muted)]">{detail}</p>
        </div>
      </div>
      <p className="mt-3 text-sm font-bold text-emerald-500">
        ↑ 12% <span className="font-medium text-[var(--muted)]">vs ontem</span>
      </p>
    </div>
  );
}

function movementStatusClass(type: MovementType) {
  return type === "entrada"
    ? "bg-emerald-50 text-emerald-600"
    : "bg-red-50 text-red-500";
}

function stockStatus(quantity: number) {
  if (quantity <= 0) {
    return { label: "Zerado", className: "bg-slate-100 text-slate-500" };
  }

  if (quantity <= 5) {
    return { label: "Crítico", className: "bg-red-50 text-red-500" };
  }

  if (quantity <= 20) {
    return { label: "Baixo", className: "bg-orange-50 text-orange-500" };
  }

  return { label: "Normal", className: "bg-emerald-50 text-emerald-600" };
}

export function AppShell({
  currentUser,
  localStocks,
  products,
  dashboard,
}: AppShellProps) {
  const [tab, setTab] = useState<MainTab>("movements");
  const [movementType, setMovementType] = useState<MovementType>("saida");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("kg");
  const [selectedOriginLocalId, setSelectedOriginLocalId] = useState("");
  const [selectedDestinationLocalId, setSelectedDestinationLocalId] = useState("");
  const [selectedStockLocalId, setSelectedStockLocalId] = useState(localStocks[0]?.id ?? "");
  const [stockSearch, setStockSearch] = useState("");
  const deferredStockSearch = useDeferredValue(stockSearch);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [localModalOpen, setLocalModalOpen] = useState(false);

  const [productState, productAction] = useActionState(
    createProductAction,
    INITIAL_ACTION_STATE,
  );
  const [localState, localAction] = useActionState(createLocalAction, INITIAL_ACTION_STATE);
  const [movementState, movementAction] = useActionState(
    createMovementAction,
    INITIAL_ACTION_STATE,
  );

  const productOptions = products.map((product) => ({
    id: product.id,
    label: product.name,
    meta: product.unit,
  }));

  const filteredBalances = dashboard.balances.filter((balance) => {
    if (balance.localStockId !== selectedStockLocalId) {
      return false;
    }

    const term = deferredStockSearch.trim().toLowerCase();
    return !term || `${balance.productName} ${balance.unit}`.toLowerCase().includes(term);
  });

  const recentMovements = dashboard.recentMovements.slice(0, 8);
  const today = new Date().toISOString().slice(0, 10);
  const todayMovements = dashboard.recentMovements.filter((movement) =>
    movement.createdAt.startsWith(today),
  );
  const todayEntries = todayMovements.filter((movement) => movement.type === "entrada").length;
  const todayExits = todayMovements.filter((movement) => movement.type === "saida").length;
  const lowStockCount = dashboard.balances.filter(
    (balance) => balance.quantity > 0 && balance.quantity <= 20,
  ).length;

  function handleProductChange(productId: string) {
    setSelectedProductId(productId);

    const selectedProduct = products.find((product) => product.id === productId);
    if (selectedProduct) {
      setSelectedUnit(selectedProduct.unit);
    }
  }

  useEffect(() => {
    if (productState.status === "success") {
      queueMicrotask(() => {
        setProductModalOpen(false);

        if (productState.entityId) {
          setSelectedProductId(productState.entityId);

          const createdProduct = products.find(
            (product) => product.id === productState.entityId,
          );

          if (createdProduct) {
            setSelectedUnit(createdProduct.unit);
          }
        }
      });
    }
  }, [productState.entityId, productState.status, products]);

  useEffect(() => {
    if (localState.status === "success") {
      queueMicrotask(() => {
        setLocalModalOpen(false);

        if (localState.entityId) {
          setSelectedStockLocalId(localState.entityId);
          setSelectedDestinationLocalId(localState.entityId);
        }
      });
    }
  }, [localState.entityId, localState.status]);

  return (
    <>
      <div className="grid min-h-screen bg-[var(--background)] text-[var(--text)] lg:h-screen lg:grid-cols-[250px_1fr] lg:overflow-hidden">
        <aside className="hidden border-r border-[var(--line)] bg-white px-4 py-5 lg:flex lg:h-full lg:flex-col">
          <div className="mb-11 flex items-center gap-3 px-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Box size={19} />
            </div>
            <h1 className="text-xl font-extrabold">
              Estoque<span className="text-blue-600">Pro</span>
            </h1>
          </div>

          <nav className="grid gap-3">
            <button
              type="button"
              onClick={() => setTab("movements")}
              className={cn(
                "flex h-14 items-center gap-4 rounded-xl px-4 text-base font-bold transition",
                tab === "movements"
                  ? "bg-blue-50 text-blue-600"
                  : "text-[var(--text)] hover:bg-slate-50",
              )}
            >
              <ArrowRightLeft size={21} />
              Movimentações
            </button>
            <button
              type="button"
              onClick={() => setTab("stocks")}
              className={cn(
                "flex h-14 items-center gap-4 rounded-xl px-4 text-base font-bold transition",
                tab === "stocks"
                  ? "bg-blue-50 text-blue-600"
                  : "text-[var(--text)] hover:bg-slate-50",
              )}
            >
              <Box size={21} />
              Estoque
            </button>
          </nav>

          <div className="mt-auto space-y-6">
            <div className="rounded-xl border border-[var(--line)] bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <Building2 size={18} />
                </div>
                <div>
                  <p className="font-bold text-[var(--text)]">{currentUser.name}</p>
                  <p className="text-sm text-[var(--muted)]">Operador</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => startTransition(() => void logoutAction())}
              className="flex items-center gap-4 px-4 text-base font-bold text-[var(--text)]"
            >
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </aside>

        <main className="flex min-w-0 flex-col overflow-hidden px-7 py-4">
          <header className="mb-4 flex shrink-0 items-start justify-between gap-5">
            <div>
              <h2 className="text-[2.1rem] font-extrabold leading-none">
                {tab === "movements" ? "Movimentações" : "Estoque"}
              </h2>
              <p className="mt-2 text-base font-medium text-[var(--muted)]">
                {tab === "movements"
                  ? "Registre entradas e saídas de produtos de forma simples e rápida."
                  : "Acompanhe produtos, locais e níveis de estoque em tempo real."}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setLocalModalOpen(true)}
                className="inline-flex h-11 items-center gap-3 rounded-xl border border-[var(--line)] bg-white px-5 text-base font-bold text-blue-600 shadow-[var(--shadow-sm)]"
              >
                <MapPin size={20} />
                Novo local
              </button>
              <button
                type="button"
                onClick={() => setProductModalOpen(true)}
                className="inline-flex h-11 items-center gap-3 rounded-xl bg-blue-600 px-6 text-base font-bold text-white shadow-[0_18px_38px_rgba(37,99,235,0.28)]"
              >
                <Box size={20} />
                Novo produto
              </button>
            </div>
          </header>

          {tab === "movements" ? (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="grid shrink-0 gap-3 xl:grid-cols-4">
                <MetricCard
                  icon={<ArrowRightLeft size={24} />}
                  title="Movimentações hoje"
                  value={String(todayMovements.length)}
                  detail="Entradas e saídas"
                  tone="blue"
                />
                <MetricCard
                  icon={<FilePlus2 size={24} />}
                  title="Entradas"
                  value={String(todayEntries)}
                  detail="Total hoje"
                  tone="green"
                />
                <MetricCard
                  icon={<FilePlus2 size={24} />}
                  title="Saídas"
                  value={String(todayExits)}
                  detail="Total hoje"
                  tone="orange"
                />
                <MetricCard
                  icon={<ArrowRightLeft size={24} />}
                  title="Transferências"
                  value="0"
                  detail="Total hoje"
                  tone="blue"
                />
              </div>

              <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[480px_1fr]">
                <section className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-sm)]">
                  <h3 className="mb-4 text-xl font-extrabold">Registrar movimentação</h3>
                  <form action={movementAction} className="space-y-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--muted)]">Tipo</label>
                        <select
                          name="type"
                          value={movementType}
                          onChange={(event) => setMovementType(event.target.value as MovementType)}
                          className="field"
                        >
                          <option value="saida">Saída</option>
                          <option value="entrada">Entrada</option>
                        </select>
                      </div>

                      <SearchableSelect
                        name="productId"
                        label="Produto"
                        placeholder="Pesquisar produto"
                        value={selectedProductId}
                        onChange={handleProductChange}
                        options={productOptions}
                        emptyMessage="Produto não encontrado"
                        addLabel="Adicionar produto"
                        onAdd={() => setProductModalOpen(true)}
                      />

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--muted)]">Quantidade</label>
                        <input
                          name="quantity"
                          type="number"
                          step="0.01"
                          min="0.01"
                          defaultValue="1"
                          className="field"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-[var(--muted)]">Unidade</label>
                        <select
                          name="unit"
                          value={selectedUnit}
                          onChange={(event) => setSelectedUnit(event.target.value)}
                          className="field"
                        >
                          {UNIT_OPTIONS.map((unit) => (
                            <option key={unit.value} value={unit.value}>
                              {unit.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {movementType === "saida" ? (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-[var(--muted)]">
                              Local de saída
                            </label>
                            <select
                              name="originLocalId"
                              value={selectedOriginLocalId}
                              onChange={(event) => setSelectedOriginLocalId(event.target.value)}
                              className="field"
                            >
                              <option value="">Selecionar</option>
                              {localStocks.map((local) => (
                                <option key={local.id} value={local.id}>
                                  {local.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-[var(--muted)]">
                                Local de destino
                              </label>
                              <button
                                type="button"
                                onClick={() => setLocalModalOpen(true)}
                                className="inline-flex h-7 items-center gap-2 rounded-lg border border-[var(--line)] px-3 text-xs font-bold text-blue-600"
                              >
                                <Plus size={14} />
                                Adicionar
                              </button>
                            </div>
                            <select
                              name="destinationLocalId"
                              value={selectedDestinationLocalId}
                              onChange={(event) =>
                                setSelectedDestinationLocalId(event.target.value)
                              }
                              className="field"
                            >
                              <option value="">Selecionar</option>
                              {localStocks.map((local) => (
                                <option key={local.id} value={local.id}>
                                  {local.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      ) : (
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-[var(--muted)]">
                            Local de entrada
                          </label>
                          <select
                            name="destinationLocalId"
                            value={selectedDestinationLocalId}
                            onChange={(event) => setSelectedDestinationLocalId(event.target.value)}
                            className="field"
                          >
                            <option value="">Selecionar</option>
                            {localStocks.map((local) => (
                              <option key={local.id} value={local.id}>
                                {local.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-[var(--muted)]">Observações</label>
                      <textarea
                        name="notes"
                        rows={3}
                        className="field min-h-[74px] py-3"
                        placeholder="Opcional"
                      />
                    </div>

                    <StatusMessage state={movementState} />
                    <SubmitButton className="h-11 w-full rounded-lg bg-blue-600 text-base">
                      <FilePlus2 className="mr-2" size={18} />
                      Registrar movimentação
                    </SubmitButton>
                  </form>
                </section>

                <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-sm)]">
                  <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-5 py-3">
                    <h3 className="text-xl font-extrabold">Últimas movimentações</h3>
                    <button type="button" className="text-sm font-bold text-blue-600">
                      Ver todas
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto">
                    <table className="w-full min-w-[720px] border-collapse">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="border-b border-[var(--line)] text-left text-xs font-bold text-[var(--muted)]">
                          <th className="px-5 py-2.5">Data / Hora</th>
                          <th className="px-3 py-2.5">Produto</th>
                          <th className="px-3 py-2.5">Tipo</th>
                          <th className="px-3 py-2.5">Qtd.</th>
                          <th className="px-3 py-2.5">Origem</th>
                          <th className="px-3 py-2.5">Destino</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3 py-2.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {recentMovements.map((movement) => (
                          <tr key={movement.id} className="border-b border-[var(--line)]">
                            <td className="px-5 py-2.5 text-sm text-[var(--muted)]">
                              {new Date(movement.createdAt).toLocaleDateString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                              })}
                            </td>
                            <td className="px-3 py-2.5 text-sm font-bold">{movement.productName}</td>
                            <td className="px-3 py-2.5">
                              <span
                                className={cn(
                                  "rounded-lg px-3 py-1 text-xs font-bold",
                                  movementStatusClass(movement.type),
                                )}
                              >
                                {movement.type === "entrada" ? "Entrada" : "Saída"}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-sm text-[var(--muted)]">
                              {movement.quantity} {movement.unit}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-[var(--muted)]">{movement.originLabel}</td>
                            <td className="px-3 py-2.5 text-sm text-[var(--muted)]">{movement.destinationLabel}</td>
                            <td className="px-3 py-2.5">
                              <span className="rounded-lg bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
                                Concluído
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right">
                              <MoreVertical size={18} className="text-[var(--muted)]" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="grid shrink-0 gap-3 xl:grid-cols-4">
                <MetricCard
                  icon={<Box size={24} />}
                  title="Total de produtos"
                  value={String(products.length)}
                  detail="ativos no sistema"
                  tone="blue"
                />
                <MetricCard
                  icon={<Filter size={24} />}
                  title="Estoque baixo"
                  value={String(lowStockCount)}
                  detail="produtos precisam atenção"
                  tone="orange"
                />
                <MetricCard
                  icon={<MapPin size={24} />}
                  title="Locais ativos"
                  value={String(localStocks.length)}
                  detail="unidades em operação"
                  tone="green"
                />
                <MetricCard
                  icon={<ArrowRightLeft size={24} />}
                  title="Movimentações hoje"
                  value={String(todayMovements.length)}
                  detail="entradas e saídas"
                  tone="blue"
                />
              </div>

              <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[310px_1fr]">
                <section className="flex min-h-0 flex-col rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-sm)]">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xl font-extrabold">Locais</h3>
                    <button
                      type="button"
                      onClick={() => setLocalModalOpen(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--line)] px-4 text-sm font-bold text-blue-600"
                    >
                      <Plus size={17} />
                      Adicionar
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 space-y-3 overflow-auto pr-1">
                    {localStocks.map((local) => {
                      const localQuantity = dashboard.balances
                        .filter((balance) => balance.localStockId === local.id)
                        .reduce((total, balance) => total + Number(balance.quantity), 0);

                      return (
                        <button
                          key={local.id}
                          type="button"
                          onClick={() => setSelectedStockLocalId(local.id)}
                          className={cn(
                            "flex w-full items-center justify-between rounded-xl border px-4 py-3.5 text-left transition",
                            selectedStockLocalId === local.id
                              ? "border-blue-500 bg-blue-50 shadow-[0_12px_30px_rgba(37,99,235,0.12)]"
                              : "border-[var(--line)] bg-white hover:bg-slate-50",
                          )}
                        >
                          <div>
                            <p className="font-extrabold">{local.name}</p>
                            <p className="mt-1 text-sm font-medium text-[var(--muted)]">
                              Estoque principal
                            </p>
                          </div>
                          <span className="rounded-lg bg-blue-50 px-3 py-1 text-sm font-bold text-blue-600">
                            {localQuantity}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-sm)]">
                  <div className="grid shrink-0 gap-3 border-b border-[var(--line)] p-3 xl:grid-cols-[1fr_180px_160px_185px_44px]">
                    <div className="field flex items-center gap-3 px-4">
                      <Search size={17} className="text-[var(--muted)]" />
                      <input
                        value={stockSearch}
                        onChange={(event) => setStockSearch(event.target.value)}
                        placeholder="Buscar produto..."
                        className="h-full w-full bg-transparent text-sm outline-none"
                      />
                    </div>
                    <select className="field">
                      <option>Todas as categorias</option>
                    </select>
                    <select className="field">
                      <option>Todos os status</option>
                    </select>
                    <select className="field">
                      <option>Ordenar: Nome (A-Z)</option>
                    </select>
                    <button
                      type="button"
                      className="flex h-11 items-center justify-center rounded-lg border border-[var(--line)] bg-white text-[var(--text)]"
                    >
                      <Filter size={18} />
                    </button>
                  </div>
                  <div className="min-h-0 flex-1 overflow-auto">
                    <table className="w-full min-w-[760px] border-collapse">
                      <thead className="sticky top-0 z-10 bg-white">
                        <tr className="border-b border-[var(--line)] text-left text-sm font-bold text-[var(--muted)]">
                          <th className="px-5 py-2.5">Produto</th>
                          <th className="px-3 py-2.5">Unidade</th>
                          <th className="px-3 py-2.5">Quantidade</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3 py-2.5">Última atualização</th>
                          <th className="px-3 py-2.5" />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBalances.map((balance) => {
                          const status = stockStatus(balance.quantity);

                          return (
                            <tr key={balance.id} className="border-b border-[var(--line)]">
                              <td className="px-5 py-2.5 text-base font-extrabold">{balance.productName}</td>
                              <td className="px-3 py-2.5 text-base text-[var(--muted)]">
                                {UNIT_LABELS[balance.unit] ?? balance.unit}
                              </td>
                              <td className="px-3 py-2.5 text-base font-bold">{balance.quantity}</td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={cn(
                                    "rounded-lg px-3 py-1 text-sm font-bold",
                                    status.className,
                                  )}
                                >
                                  {status.label}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-base text-[var(--muted)]">Hoje, 08:45</td>
                              <td className="px-3 py-2.5 text-right">
                                <MoreVertical size={19} className="text-[var(--muted)]" />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              </div>
            </div>
          )}
        </main>
      </div>

      <Modal
        open={productModalOpen}
        title="Novo produto"
        onClose={() => setProductModalOpen(false)}
      >
        <form action={productAction} className="space-y-4">
          <input name="name" placeholder="Nome do produto" className="field" />
          <select name="unit" className="field" defaultValue="kg">
            {UNIT_OPTIONS.map((unit) => (
              <option key={unit.value} value={unit.value}>
                {unit.label}
              </option>
            ))}
          </select>
          <StatusMessage state={productState} />
          <SubmitButton className="h-12 w-full rounded-lg bg-blue-600">Salvar produto</SubmitButton>
        </form>
      </Modal>

      <Modal
        open={localModalOpen}
        title="Novo local"
        onClose={() => setLocalModalOpen(false)}
      >
        <form action={localAction} className="space-y-4">
          <input name="name" placeholder="Nome do local" className="field" />
          <StatusMessage state={localState} />
          <SubmitButton className="h-12 w-full rounded-lg bg-blue-600">Salvar local</SubmitButton>
        </form>
      </Modal>
    </>
  );
}
