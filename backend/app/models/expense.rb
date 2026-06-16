class Expense < ApplicationRecord
  belongs_to :category

  validate :date_cannot_be_in_the_future

  private

  def date_cannot_be_in_the_future
    return if date.blank? || date <= Date.current

    errors.add(:date, "cannot be in the future. Choose today or a past date.")
  end
end