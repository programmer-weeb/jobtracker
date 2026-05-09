require "rails_helper"

RSpec.describe "Applications", type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers_for(user) }
  let(:company) { create(:company, user: user) }

  describe "GET /applications" do
    it "lists only current user applications" do
      own_application = create(:application, user: user, company: company)
      create(:application)

      get "/applications", headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      ids = JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }
      expect(ids).to include(own_application.id)
      expect(ids.size).to eq(1)
    end
  end

  describe "POST /applications" do
    it "creates application" do
      post "/applications", params: {
        application: {
          company_id: company.id,
          title: "Rails Engineer",
          status: "applied",
          remote: true
        }
      }, headers: headers, as: :json

      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body).dig("data", "title")).to eq("Rails Engineer")
    end
  end

  describe "PATCH /applications/:id" do
    it "updates owned application" do
      application = create(:application, user: user, company: company, title: "Old")

      patch "/applications/#{application.id}", params: { application: { title: "New" } }, headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      expect(application.reload.title).to eq("New")
    end
  end

  describe "DELETE /applications/:id" do
    it "deletes owned application" do
      application = create(:application, user: user, company: company)

      delete "/applications/#{application.id}", headers: headers, as: :json

      expect(response).to have_http_status(:no_content)
      expect(Application.exists?(application.id)).to be(false)
    end
  end

  describe "PATCH /applications/:id/move" do
    it "updates status and position" do
      application = create(:application, user: user, company: company, status: :applied, position: 1)

      patch "/applications/#{application.id}/move", params: { application: { status: "interview", position: 4 } }, headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      expect(application.reload.status).to eq("interview")
      expect(application.position).to eq(4)
    end
  end
end
