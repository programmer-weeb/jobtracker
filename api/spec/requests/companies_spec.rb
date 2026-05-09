require "rails_helper"

RSpec.describe "Companies", type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers_for(user) }

  describe "GET /companies" do
    it "lists only current user companies" do
      own_company = create(:company, user: user)
      create(:company)

      get "/companies", headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      ids = JSON.parse(response.body).fetch("data").map { |company| company.fetch("id") }
      expect(ids).to include(own_company.id)
      expect(ids.size).to eq(1)
    end
  end

  describe "POST /companies" do
    it "creates company" do
      post "/companies", params: { company: { name: "OpenAI", location: "SF" } }, headers: headers, as: :json

      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body).dig("data", "name")).to eq("OpenAI")
    end
  end

  describe "PATCH /companies/:id" do
    it "updates owned company" do
      company = create(:company, user: user, name: "Old")

      patch "/companies/#{company.id}", params: { company: { name: "New" } }, headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      expect(company.reload.name).to eq("New")
    end
  end

  describe "DELETE /companies/:id" do
    it "deletes owned company" do
      company = create(:company, user: user)

      delete "/companies/#{company.id}", headers: headers, as: :json

      expect(response).to have_http_status(:no_content)
      expect(Company.exists?(company.id)).to be(false)
    end
  end
end
