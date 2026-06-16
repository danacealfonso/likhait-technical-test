import React, { useState } from "react";
import { Button } from "../vibes";
import { COLORS } from "../constants/colors";

interface AddCategoryFormProps {
  onSubmit: (name: string) => Promise<void>;
  onCancel: () => void;
}

export function AddCategoryForm({ onSubmit, onCancel }: AddCategoryFormProps) {
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
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          fullWidth
        >
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
