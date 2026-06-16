import React, { useState, useEffect } from "react";
import {
  createCategory,
  createExpense,
  fetchCategories,
  getExpenses,
} from "../services/api";
import { Category, Expense, ExpenseFormData } from "../types";
import YearNavigation from "../components/YearNavigation";
import { MonthNavigation } from "../components/MonthNavigation";
import CategoryBreakdown from "../components/CategoryBreakdown";
import { CalendarExpenseTable } from "../components/CalendarExpenseTable";
import { ExpenseForm } from "../components/ExpenseForm";
import { Modal, Button } from "../vibes";
import { COLORS } from "../constants/colors";

interface AddCategoryFormProps {
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

function AddCategoryForm({ onSubmit, onCancel }: AddCategoryFormProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Category name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onSubmit(trimmedName);
      setName("");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to create category",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <label
          htmlFor="category-name"
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: COLORS.text.primary,
          }}
        >
          Category name
        </label>
        <input
          id="category-name"
          type="text"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setError("");
          }}
          maxLength={100}
          autoFocus
          style={{
            padding: "0.5rem 0.75rem",
            fontSize: "1rem",
            border: `1px solid ${error ? COLORS.danger : COLORS.border}`,
            borderRadius: "0.375rem",
            outline: "none",
            backgroundColor: COLORS.background.main,
            color: COLORS.text.primary,
          }}
        />
        {error && (
          <span style={{ fontSize: "0.75rem", color: COLORS.danger }}>
            {error}
          </span>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <Button type="submit" variant="primary" disabled={isSubmitting} fullWidth>
          {isSubmitting ? "Creating..." : "Create Category"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

const HistoryPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Get year and month from URL params, default to current date if not provided
  const getInitialYearMonth = () => {
    const params = new URLSearchParams(window.location.search);
    const currentDate = new Date();
    const yearParam = params.get("year");
    const monthParam = params.get("month");

    return {
      year: yearParam ? parseInt(yearParam) : currentDate.getFullYear(),
      month: monthParam ? parseInt(monthParam) : currentDate.getMonth() + 1,
    };
  };

  const initial = getInitialYearMonth();
  const [selectedYear, setSelectedYear] = useState(initial.year);
  const [selectedMonth, setSelectedMonth] = useState(initial.month);

  // Update URL when year or month changes
  const updateURL = (year: number, month: number) => {
    const params = new URLSearchParams();
    params.set("year", year.toString());
    params.set("month", month.toString());
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({}, "", newURL);
  };

  // Initialize URL params if not present
  useEffect(() => {
    updateURL(selectedYear, selectedMonth);
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [selectedYear, selectedMonth]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (!toastMessage) return;

    const timeoutId = window.setTimeout(() => {
      setToastMessage("");
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      setLoadError("");
      const data = await getExpenses(selectedYear, selectedMonth);
      setExpenses(data);
    } catch {
      setLoadError("We couldn't load your expenses yet. Please refresh in a moment.");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch {
      setLoadError("We couldn't load your categories yet. Please refresh in a moment.");
    }
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    updateURL(year, selectedMonth);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    updateURL(selectedYear, month);
  };

  const handleAddExpense = async (data: ExpenseFormData) => {
    try {
      await createExpense(data);
      setIsModalOpen(false);
      fetchExpenses();
    } catch (error) {
      throw error;
    }
  };

  const handleAddCategory = async (name: string) => {
    const category = await createCategory(name);
    setCategories((currentCategories) =>
      [...currentCategories, category].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    );
    setIsCategoryModalOpen(false);
    setToastMessage(`Category "${category.name}" added successfully.`);
  };

  // Calculate category breakdown
  const categoryData = expenses.reduce(
    (acc, expense) => {
      const category = expense.category || "Uncategorized";
      if (!acc[category]) {
        acc[category] = { category, amount: 0, count: 0 };
      }
      acc[category].amount += Number(expense.amount);
      acc[category].count += 1;
      return acc;
    },
    {} as Record<string, { category: string; amount: number; count: number }>,
  );

  const categoryBreakdownItems = Object.values(categoryData).sort(
    (a, b) => b.amount - a.amount,
  );
  const total = categoryBreakdownItems.reduce((sum, cat) => sum + cat.amount, 0);
  const totalCount = categoryBreakdownItems.reduce(
    (sum, cat) => sum + cat.count,
    0,
  );

  const pageStyle: React.CSSProperties = {
    padding: "48px 64px",
    minHeight: "100vh",
    background: COLORS.secondary.s01,
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "24px",
    justifyContent: "space-between",
  };

  const leftHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "24px",
  };

  const headerActionsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: "40px",
    fontWeight: 700,
    color: COLORS.secondary.s10,
    margin: 0,
    flexShrink: 0,
  };

  const loadingStyle: React.CSSProperties = {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "48px",
    fontSize: "18px",
    color: COLORS.secondary.s08,
  };

  const isApiUnavailable = Boolean(loadError);

  const errorStyle: React.CSSProperties = {
    padding: "16px",
    marginTop: "24px",
    border: `1px solid ${COLORS.red.re04}`,
    borderRadius: "0.5rem",
    background: COLORS.red.re02,
    color: COLORS.red.re10,
    fontWeight: 600,
  };

  const toastStyle: React.CSSProperties = {
    position: "fixed",
    top: "24px",
    right: "24px",
    zIndex: 1100,
    padding: "12px 16px",
    borderRadius: "0.5rem",
    background: COLORS.green.gr05,
    color: COLORS.background.main,
    fontWeight: 600,
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.16)",
  };

  return (
    <div style={pageStyle}>
      {toastMessage && (
        <div role="status" aria-live="polite" style={toastStyle}>
          {toastMessage}
        </div>
      )}

      <div style={headerStyle}>
        <div style={leftHeaderStyle}>
          <h1 style={titleStyle}>Expense History</h1>
          <YearNavigation
            currentYear={selectedYear}
            onYearChange={handleYearChange}
          />
        </div>
        <div style={headerActionsStyle}>
          <Button
            variant="secondary"
            onClick={() => setIsCategoryModalOpen(true)}
            disabled={isApiUnavailable}
          >
            Add Category
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsModalOpen(true)}
            disabled={isApiUnavailable}
          >
            Add Expense
          </Button>
        </div>
      </div>

      <MonthNavigation
        currentMonth={selectedMonth}
        currentYear={selectedYear}
        onMonthChange={handleMonthChange}
      />

      <div>
        {loadError ? (
          <div style={errorStyle}>{loadError}</div>
        ) : loading ? (
          <div style={loadingStyle}>Loading...</div>
        ) : (
          <>
            <CategoryBreakdown
              categories={categoryBreakdownItems}
              total={total}
              totalCount={totalCount}
            />
            <div style={{ marginTop: "32px" }}>
              <CalendarExpenseTable
                expenses={expenses}
                categories={categories}
                onExpenseUpdated={fetchExpenses}
              />
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Expense"
      >
        <ExpenseForm
          onSubmit={handleAddExpense}
          onCancel={() => setIsModalOpen(false)}
          categories={categories}
        />
      </Modal>

      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Category"
      >
        <AddCategoryForm
          onSubmit={handleAddCategory}
          onCancel={() => setIsCategoryModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default HistoryPage;
