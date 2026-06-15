class AlignExpensesSchema < ActiveRecord::Migration[7.2]
  def change
    return unless table_exists?(:expenses)

    unless column_exists?(:expenses, :date)
      add_column :expenses, :date, :date, null: false, default: "2024-01-01"
      change_column_default :expenses, :date, from: "2024-01-01", to: nil
    end

    remove_column :expenses, :payer_name if column_exists?(:expenses, :payer_name)
  end
end
