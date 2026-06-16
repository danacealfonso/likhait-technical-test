require 'rails_helper'

RSpec.describe "Api::Expenses", type: :request do
  let!(:food_category) { Category.create!(name: "Food") }
  let!(:transport_category) { Category.create!(name: "Transport") }

  describe "GET /api/expenses" do
    let!(:expense1) do
      Expense.create!(
        description: "Lunch",
        amount: 100.00,
        category: food_category,
        date: Date.new(2026, 6, 14),
        created_at: Time.zone.local(2026, 6, 16, 9, 0, 0)
      )
    end

    let!(:expense2) do
      Expense.create!(
        description: "Taxi",
        amount: 50.00,
        category: transport_category,
        date: Date.new(2026, 6, 17),
        created_at: Time.zone.local(2026, 6, 15, 9, 0, 0)
      )
    end

    it "returns all expenses with category information" do
      get "/api/expenses"

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)
      expect(json.length).to eq(2)
    end

    it "returns expenses in descending order by expense date" do
      get "/api/expenses"

      json = JSON.parse(response.body)
      expect(json.first["id"]).to eq(expense2.id)
      expect(json.last["id"]).to eq(expense1.id)
    end

    it "filters expenses by expense date when year and month are provided" do
      Expense.create!(
        description: "May Dinner",
        amount: 75.00,
        category: food_category,
        date: Date.new(2026, 5, 31),
        created_at: Time.zone.local(2026, 6, 1, 9, 0, 0)
      )

      get "/api/expenses", params: { year: 2026, month: 6 }

      json = JSON.parse(response.body)
      expect(json.map { |expense| expense["id"] }).to contain_exactly(expense1.id, expense2.id)
    end
  end

  describe "POST /api/expenses" do
    context "with valid parameters" do
      let(:valid_params) do
        {
          expense: {
            description: "Team Lunch",
            amount: 150.50,
            category_id: food_category.id,
            date: Date.today
          }
        }
      end

      it "creates a new expense" do
        expect {
          post "/api/expenses", params: valid_params, as: :json
        }.to change(Expense, :count).by(1)

        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json["description"]).to eq("Team Lunch")
        expect(json["amount"]).to eq(150.5)
      end
    end

    context "with invalid parameters" do
      it "with negative amounts" do
        invalid_params = {
          expense: {
            description: "Invalid expense",
            amount: -100.00,
            category_id: food_category.id,
            date: Date.today
          }
        }

        expect {
          post "/api/expenses", params: invalid_params, as: :json
        }.to change(Expense, :count).by(1)

        expect(response).to have_http_status(:created)
      end

      it "with empty descriptions" do
        invalid_params = {
          expense: {
            description: "",
            amount: 100.00,
            category_id: food_category.id,
            date: Date.today
          }
        }

        expect {
          post "/api/expenses", params: invalid_params, as: :json
        }.to change(Expense, :count).by(1)

        expect(response).to have_http_status(:created)
      end
    end
  end
end