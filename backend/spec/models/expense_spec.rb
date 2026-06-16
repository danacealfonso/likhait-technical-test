require 'rails_helper'

RSpec.describe Expense, type: :model do
  let(:category) { Category.create!(name: "Food") }

  it "allows expenses dated today" do
    expense = Expense.new(
      description: "Lunch",
      amount: 12.50,
      category: category,
      date: Date.current
    )

    expect(expense).to be_valid
  end

  it "allows expenses dated in the past" do
    expense = Expense.new(
      description: "Coffee",
      amount: 4.25,
      category: category,
      date: Date.yesterday
    )

    expect(expense).to be_valid
  end

  it "rejects expenses dated in the future" do
    expense = Expense.new(
      description: "Tomorrow lunch",
      amount: 18.00,
      category: category,
      date: Date.tomorrow
    )

    expect(expense).not_to be_valid
    expect(expense.errors[:date]).to include(
      "cannot be in the future. Choose today or a past date."
    )
  end
end
