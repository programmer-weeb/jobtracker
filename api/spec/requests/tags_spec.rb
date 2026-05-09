require "rails_helper"

RSpec.describe "Tags", type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers_for(user) }

  describe "GET /tags" do
    it "lists only current user tags" do
      own_tag = create(:tag, user: user)
      create(:tag)

      get "/tags", headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      ids = JSON.parse(response.body).fetch("data").map { |tag| tag.fetch("id") }
      expect(ids).to include(own_tag.id)
      expect(ids.size).to eq(1)
    end
  end

  describe "POST /tags" do
    it "creates tag" do
      post "/tags", params: { tag: { name: "urgent", color: "#ef4444" } }, headers: headers, as: :json

      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body).dig("data", "name")).to eq("urgent")
    end
  end

  describe "DELETE /tags/:id" do
    it "deletes owned tag" do
      tag = create(:tag, user: user)

      delete "/tags/#{tag.id}", headers: headers, as: :json

      expect(response).to have_http_status(:no_content)
      expect(Tag.exists?(tag.id)).to be(false)
    end
  end
end
