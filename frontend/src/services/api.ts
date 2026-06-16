/**
 * API service for communicating with the backend
 */

import { Category, Expense, ExpenseFormData } from "../types";

const API_BASE_URL = "http://localhost:3000/api";
const NETWORK_ERROR_MESSAGE =
  "Unable to reach the backend. Please wait for Rails to finish starting and try again.";

/**
 * Fetch all expenses
 */
export async function fetchExpenses(): Promise<Expense[]> {
  const response = await fetch(`${API_BASE_URL}/expenses`);
  if (!response.ok) {
    throw new Error("Failed to fetch expenses");
  }
  return response.json();
}

/**
 * Fetch expenses for a specific year and month
 */
export async function getExpenses(
  year: number,
  month: number,
): Promise<Expense[]> {
  const response = await fetch(
    `${API_BASE_URL}/expenses?year=${year}&month=${month}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch expenses");
  }
  return response.json();
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<Category[]> {
  const response = await fetch(`${API_BASE_URL}/categories`);
  if (!response.ok) {
    throw new Error("Failed to fetch categories");
  }
  return response.json();
}

/**
 * Create a new category
 */
export async function createCategory(name: string): Promise<Category> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/categories`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ category: { name } }),
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.errors?.join(", ") || "Failed to create category";
    throw new Error(message);
  }

  return response.json();
}

/**
 * Create a new expense
 */
export async function createExpense(data: ExpenseFormData): Promise<Expense> {
  // Convert category name to category_id
  const categories = await fetchCategories();
  const category = categories.find((c) => c.name === data.category);

  const expenseData = {
    description: data.description,
    amount: data.amount,
    category_id: category?.id,
    date: data.date,
  };

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expense: expenseData }),
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error("Failed to create expense");
  }

  return response.json();
}

/**
 * Update an existing expense
 */
export async function updateExpense(
  id: number,
  data: Partial<ExpenseFormData>,
): Promise<Expense> {
  const expenseData: {
    amount?: string;
    description?: string;
    category_id?: number;
    date?: string;
  } = {
    amount: data.amount,
    description: data.description,
    date: data.date,
  };

  if (data.category) {
    const categories = await fetchCategories();
    const category = categories.find((c) => c.name === data.category);
    expenseData.category_id = category?.id;
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expense: expenseData }),
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error("Failed to update expense");
  }

  return response.json();
}

/**
 * Delete an expense
 */
export async function deleteExpense(id: number): Promise<void> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: "DELETE",
    });
  } catch {
    throw new Error(NETWORK_ERROR_MESSAGE);
  }

  if (!response.ok) {
    throw new Error("Failed to delete expense");
  }
}
