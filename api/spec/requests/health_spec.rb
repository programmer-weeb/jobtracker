require "rails_helper"

RSpec.describe "Health checks", type: :request do
  describe "GET /up" do
    it "returns healthy response" do
      get "/up"

      expect(response).to have_http_status(:ok)
    end
  end
end
