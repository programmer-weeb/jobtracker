require "rails_helper"

RSpec.describe "Notes", type: :request do
  let(:user) { create(:user) }
  let(:headers) { auth_headers_for(user) }
  let(:application) { create(:application, user: user, company: create(:company, user: user)) }

  describe "POST /applications/:id/notes" do
    it "creates note" do
      post "/applications/#{application.id}/notes", params: { note: { body: "Followed up" } }, headers: headers, as: :json

      expect(response).to have_http_status(:created)
      expect(JSON.parse(response.body).dig("data", "body")).to eq("Followed up")
    end
  end

  describe "DELETE /notes/:id" do
    it "deletes note from owned application" do
      note = create(:note, application: application)

      delete "/notes/#{note.id}", headers: headers, as: :json

      expect(response).to have_http_status(:no_content)
      expect(Note.exists?(note.id)).to be(false)
    end
  end
end
