"use client";

import { Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface EditableItem {
  key: string;
  name: string;
  unitPrice: number;
  quantity: number;
  memberIds: string[];
}

interface Props {
  items: EditableItem[];
  members: { id: string; display_name: string }[];
  onChange: (items: EditableItem[]) => void;
}

export function ItemAssignmentGrid({ items, members, onChange }: Props) {
  function updateItem(key: string, patch: Partial<EditableItem>) {
    onChange(items.map((it) => (it.key === key ? { ...it, ...patch } : it)));
  }
  function toggleMember(key: string, memberId: string) {
    const item = items.find((it) => it.key === key);
    if (!item) return;
    const memberIds = item.memberIds.includes(memberId)
      ? item.memberIds.filter((id) => id !== memberId)
      : [...item.memberIds, memberId];
    updateItem(key, { memberIds });
  }
  function removeItem(key: string) {
    onChange(items.filter((it) => it.key !== key));
  }
  function addItem() {
    onChange([...items, { key: crypto.randomUUID(), name: "", unitPrice: 0, quantity: 1, memberIds: [] }]);
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-[13px] font-medium text-stone-600">
          Items <span className="font-normal text-stone-400">— check off who shared each one</span>
        </p>

        {/* Desktop/tablet: full table. Below sm, a table with a name + price + qty +
            one column per member doesn't fit a phone screen without constant
            sideways scrolling, so mobile gets a stacked card layout instead. */}
        <div className="hidden overflow-x-auto rounded-xl ring-1 ring-stone-100 sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-left text-stone-500">
                <th className="rounded-tl-xl py-2 pr-2 pl-3 font-medium">Item</th>
                <th className="w-24 py-2 pr-2 font-medium">Price</th>
                <th className="w-16 py-2 pr-2 font-medium">Qty</th>
                {members.map((m) => (
                  <th key={m.id} className="px-1 py-2 text-center font-medium" title={m.display_name}>
                    {m.display_name.slice(0, 3)}
                  </th>
                ))}
                <th className="w-14 rounded-tr-xl"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.key} className={idx > 0 ? "border-t border-stone-100" : ""}>
                  <td className="py-2 pr-2 pl-3">
                    <Input
                      value={item.name}
                      onChange={(e) => updateItem(item.key, { name: e.target.value })}
                      placeholder="Item name"
                      className="bg-white ring-stone-200"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(item.key, { unitPrice: Number(e.target.value) })}
                      className="bg-white ring-stone-200"
                    />
                  </td>
                  <td className="py-2 pr-2">
                    <Input
                      type="number"
                      step="1"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) })}
                      className="bg-white ring-stone-200"
                    />
                  </td>
                  {members.map((m) => (
                    <td key={m.id} className="px-1 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={item.memberIds.includes(m.id)}
                        onChange={() => toggleMember(item.key, m.id)}
                        className="h-4 w-4 cursor-pointer accent-brand-600"
                      />
                    </td>
                  ))}
                  <td className="py-2 pr-3 pl-2">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        onClick={() => updateItem(item.key, { memberIds: members.map((m) => m.id) })}
                        className="text-xs font-medium text-stone-400 hover:text-brand-600"
                        title="Everyone shared this"
                      >
                        all
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.key)}
                        className="text-stone-300 hover:text-red-500"
                        title="Remove item"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 sm:hidden">
          {items.map((item) => (
            <div key={item.key} className="rounded-xl bg-stone-50 p-3 ring-1 ring-stone-100">
              <div className="mb-2 flex items-center gap-2">
                <Input
                  value={item.name}
                  onChange={(e) => updateItem(item.key, { name: e.target.value })}
                  placeholder="Item name"
                  className="bg-white ring-stone-200"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  className="shrink-0 p-2 text-stone-300 hover:text-red-500"
                  title="Remove item"
                  aria-label="Remove item"
                >
                  ✕
                </button>
              </div>
              <div className="mb-3 grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor={`price-${item.key}`}>Price</Label>
                  <Input
                    id={`price-${item.key}`}
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(item.key, { unitPrice: Number(e.target.value) })}
                    className="bg-white ring-stone-200"
                  />
                </div>
                <div>
                  <Label htmlFor={`qty-${item.key}`}>Qty</Label>
                  <Input
                    id={`qty-${item.key}`}
                    type="number"
                    step="1"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.key, { quantity: Number(e.target.value) })}
                    className="bg-white ring-stone-200"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {members.map((m) => {
                  const checked = item.memberIds.includes(m.id);
                  return (
                    <button
                      type="button"
                      key={m.id}
                      onClick={() => toggleMember(item.key, m.id)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium ring-1 ring-inset transition-colors ${
                        checked
                          ? "bg-brand-600 text-white ring-brand-600"
                          : "bg-white text-stone-600 ring-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {m.display_name}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => updateItem(item.key, { memberIds: members.map((m) => m.id) })}
                  className="rounded-full px-3 py-1.5 text-xs font-medium text-stone-400 ring-1 ring-inset ring-stone-200 hover:text-brand-600"
                >
                  all
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={addItem}>
        + Add item
      </Button>
    </div>
  );
}
