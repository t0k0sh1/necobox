"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  NUMBER_FILTER_OPERATORS,
  type ColumnFilter,
  type ColumnType,
  type NumberFilter,
  type StringFilter,
} from "@/lib/utils/csv";
import { Filter, X } from "lucide-react";
import { useCallback, useState } from "react";

interface CsvFilterDropdownProps {
  columnIndex: number;
  columnType: ColumnType;
  currentFilter: ColumnFilter | undefined;
  onFilterChange: (columnIndex: number, filter: ColumnFilter | null) => void;
  translations: {
    filterPlaceholder: string;
    filterClear: string;
    operatorEquals: string;
    operatorNotEquals: string;
    operatorGreater: string;
    operatorLess: string;
    operatorGreaterOrEquals: string;
    operatorLessOrEquals: string;
  };
}

export function CsvFilterDropdown({
  columnIndex,
  columnType,
  currentFilter,
  onFilterChange,
  translations,
}: CsvFilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const isNumeric = columnType === "number";
  const hasFilter = currentFilter !== undefined;

  // ローカル状態（入力中の値を保持）
  // 初期値は currentFilter から取得。外部からのリセットは key prop でコンポーネントをリマウントして対応
  const [localStringValue, setLocalStringValue] = useState(
    currentFilter?.type === "string" ? currentFilter.value : ""
  );
  const [localOperator, setLocalOperator] = useState<NumberFilter["operator"]>(
    currentFilter?.type === "number" ? currentFilter.operator : "="
  );
  const [localNumberInput, setLocalNumberInput] = useState(
    currentFilter?.type === "number" ? String(currentFilter.value) : ""
  );

  // 演算子のラベルを取得
  const getOperatorLabel = (op: NumberFilter["operator"]): string => {
    switch (op) {
      case "=":
        return translations.operatorEquals;
      case "!=":
        return translations.operatorNotEquals;
      case ">":
        return translations.operatorGreater;
      case "<":
        return translations.operatorLess;
      case ">=":
        return translations.operatorGreaterOrEquals;
      case "<=":
        return translations.operatorLessOrEquals;
      default:
        return op;
    }
  };

  // 文字列フィルターの変更
  const handleStringFilterChange = useCallback(
    (value: string) => {
      setLocalStringValue(value);
      if (value.trim() === "") {
        onFilterChange(columnIndex, null);
      } else {
        const filter: StringFilter = { type: "string", value };
        onFilterChange(columnIndex, filter);
      }
    },
    [columnIndex, onFilterChange]
  );

  // 数値フィルターの適用（演算子と値が両方有効な場合のみ）
  const applyNumberFilter = useCallback(
    (op: NumberFilter["operator"], inputValue: string) => {
      if (inputValue.trim() === "") {
        onFilterChange(columnIndex, null);
        return;
      }
      const numValue = parseFloat(inputValue);
      if (!isNaN(numValue)) {
        const filter: NumberFilter = { type: "number", operator: op, value: numValue };
        onFilterChange(columnIndex, filter);
      }
    },
    [columnIndex, onFilterChange]
  );

  // 数値フィルターの演算子変更
  const handleOperatorChange = useCallback(
    (op: NumberFilter["operator"]) => {
      setLocalOperator(op);
      applyNumberFilter(op, localNumberInput);
    },
    [localNumberInput, applyNumberFilter]
  );

  // 数値フィルターの値変更
  const handleNumberValueChange = useCallback(
    (value: string) => {
      setLocalNumberInput(value);
      applyNumberFilter(localOperator, value);
    },
    [localOperator, applyNumberFilter]
  );

  // フィルターをクリア
  const handleClear = useCallback(() => {
    setLocalStringValue("");
    setLocalOperator("=");
    setLocalNumberInput("");
    onFilterChange(columnIndex, null);
    setOpen(false);
  }, [columnIndex, onFilterChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ${
            hasFilter
              ? "text-blue-600 dark:text-blue-400"
              : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          }`}
          aria-label="Filter"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Filter className="w-3.5 h-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3"
        align="start"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="space-y-3">
          {isNumeric ? (
            // 数値フィルター
            <div className="space-y-2">
              <Select
                value={localOperator}
                onValueChange={(v) =>
                  handleOperatorChange(v as NumberFilter["operator"])
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NUMBER_FILTER_OPERATORS.map((op) => (
                    <SelectItem key={op.value} value={op.value}>
                      {getOperatorLabel(op.value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={localNumberInput}
                onChange={(e) => handleNumberValueChange(e.target.value)}
                placeholder={translations.filterPlaceholder}
                className="h-8 text-sm"
              />
            </div>
          ) : (
            // 文字列フィルター
            <Input
              type="text"
              value={localStringValue}
              onChange={(e) => handleStringFilterChange(e.target.value)}
              placeholder={translations.filterPlaceholder}
              className="h-8 text-sm"
              autoFocus
            />
          )}
          {hasFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              className="w-full h-7 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              {translations.filterClear}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
