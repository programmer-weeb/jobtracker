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

    it "filters by status" do
      keep = create(:application, user: user, company: company, status: :applied)
      create(:application, user: user, company: company, status: :interview)

      get "/applications?status=applied", headers: headers, as: :json

      ids = JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }
      expect(ids).to eq([keep.id])
    end

    it "ignores unknown status filter" do
      first = create(:application, user: user, company: company, status: :applied)
      second = create(:application, user: user, company: company, status: :interview)

      get "/applications?status=unknown", headers: headers, as: :json

      ids = JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }
      expect(ids).to include(first.id, second.id)
    end

    it "filters by company" do
      own_company = create(:company, user: user)
      keep = create(:application, user: user, company: own_company)
      create(:application, user: user, company: company)

      get "/applications?company=#{own_company.id}", headers: headers, as: :json

      ids = JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }
      expect(ids).to eq([keep.id])
    end

    it "filters by tag" do
      tag = create(:tag, user: user)
      keep = create(:application, user: user, company: company)
      keep.tags << tag
      create(:application, user: user, company: company)

      get "/applications?tag=#{tag.id}", headers: headers, as: :json

      ids = JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }
      expect(ids).to eq([keep.id])
    end

    it "filters by remote flag" do
      local = create(:application, user: user, company: company, remote: false)
      create(:application, user: user, company: company, remote: true)

      get "/applications?remote=false", headers: headers, as: :json

      ids = JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }
      expect(ids).to eq([local.id])
    end

    it "ignores invalid remote filter value" do
      first = create(:application, user: user, company: company, remote: false)
      second = create(:application, user: user, company: company, remote: true)

      get "/applications?remote=definitely", headers: headers, as: :json

      ids = JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }
      expect(ids).to include(first.id, second.id)
    end

    it "treats blank q as no search filter" do
      first = create(:application, user: user, company: company, title: "Backend Engineer")
      second = create(:application, user: user, company: company, title: "Frontend Engineer")

      get "/applications?q=   ", headers: headers, as: :json

      ids = JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }
      expect(ids).to include(first.id, second.id)
    end

    it "ignores non-numeric company and tag filters" do
      keep = create(:application, user: user, company: company)
      tag = create(:tag, user: user)
      keep.tags << tag

      get "/applications?company=abc&tag=nope", headers: headers, as: :json

      ids = JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }
      expect(ids).to include(keep.id)
    end

    it "applies combined filters as intersection for current user only" do
      keep_company = create(:company, user: user, name: "OpenAI")
      keep_tag = create(:tag, user: user, name: "Priority")
      keep = create(:application, user: user, company: keep_company, status: :applied, remote: true, title: "Rails API Engineer")
      keep.tags << keep_tag

      create(:application, user: user, company: keep_company, status: :interview, remote: true, title: "Rails API Engineer").tags << keep_tag
      create(:application, user: user, company: keep_company, status: :applied, remote: false, title: "Rails API Engineer").tags << keep_tag
      create(:application, user: user, company: keep_company, status: :applied, remote: true, title: "Different Title")

      other_user = create(:user)
      other_company = create(:company, user: other_user, name: "OpenAI")
      other_tag = create(:tag, user: other_user, name: "Priority")
      other_application = create(:application, user: other_user, company: other_company, status: :applied, remote: true, title: "Rails API Engineer")
      other_application.tags << other_tag

      get "/applications?status=applied&q=rails&company=#{keep_company.id}&tag=#{keep_tag.id}&remote=true", headers: headers, as: :json

      ids = JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }
      expect(ids).to eq([keep.id])
    end

    it "searches by q across title, source, location and company name" do
      company_match = create(:company, user: user, name: "OpenAI")
      title_match = create(:application, user: user, company: company, title: "Senior Rails Engineer")
      source_match = create(:application, user: user, company: company, source: "Indeed")
      location_match = create(:application, user: user, company: company, location: "Berlin")
      company_name_match = create(:application, user: user, company: company_match)
      create(:application, user: user, company: company, title: "Unrelated")

      get "/applications?q=rail", headers: headers, as: :json
      expect(JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }).to include(title_match.id)

      get "/applications?q=indeed", headers: headers, as: :json
      expect(JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }).to include(source_match.id)

      get "/applications?q=berlin", headers: headers, as: :json
      expect(JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }).to include(location_match.id)

      get "/applications?q=openai", headers: headers, as: :json
      expect(JSON.parse(response.body).fetch("data").map { |row| row.fetch("id") }).to include(company_name_match.id)
    end

    it "paginates results with default page=1, per_page=25" do
      create_list(:application, 30, user: user, company: company)

      get "/applications", headers: headers, as: :json

      response_body = JSON.parse(response.body)
      expect(response_body.fetch("data").size).to eq(25)
      expect(response_body.fetch("meta")).to eq({
        "page" => 1,
        "per_page" => 25,
        "total" => 30
      })
    end

    it "respects page and per_page parameters" do
      create_list(:application, 30, user: user, company: company)

      get "/applications?page=2&per_page=10", headers: headers, as: :json

      response_body = JSON.parse(response.body)
      expect(response_body.fetch("data").size).to eq(10)
      expect(response_body.fetch("meta")).to eq({
        "page" => 2,
        "per_page" => 10,
        "total" => 30
      })
    end

    it "caps per_page at 100" do
      create_list(:application, 30, user: user, company: company)

      get "/applications?per_page=200", headers: headers, as: :json

      response_body = JSON.parse(response.body)
      expect(response_body.fetch("meta").fetch("per_page")).to eq(100)
    end

    it "clamps page to minimum 1" do
      create_list(:application, 30, user: user, company: company)

      get "/applications?page=0", headers: headers, as: :json

      response_body = JSON.parse(response.body)
      expect(response_body.fetch("meta").fetch("page")).to eq(1)
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
      
      application = Application.find(JSON.parse(response.body).dig("data", "id"))
      event = application.events.first
      expect(event.kind).to eq("status_changed")
      expect(event.payload).to include("from" => nil, "to" => "applied")
    end

    it "rejects another user's company" do
      other_company = create(:company)

      post "/applications", params: {
        application: {
          company_id: other_company.id,
          title: "Rails Engineer",
          status: "applied"
        }
      }, headers: headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body).fetch("errors")).to include("Company must belong to current user")
    end

    it "rejects another user's tag ids" do
      own_tag = create(:tag, user: user)
      other_tag = create(:tag)

      post "/applications", params: {
        application: {
          company_id: company.id,
          title: "Rails Engineer",
          status: "applied",
          tag_ids: [own_tag.id, other_tag.id]
        }
      }, headers: headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body).fetch("errors").first).to include("Tags must belong to current user")
    end

    it "allows own tag ids" do
      own_tag = create(:tag, user: user)

      post "/applications", params: {
        application: {
          company_id: company.id,
          title: "Rails Engineer",
          status: "applied",
          tag_ids: [own_tag.id]
        }
      }, headers: headers, as: :json

      expect(response).to have_http_status(:created)
      payload = JSON.parse(response.body).fetch("data")
      expect(payload.fetch("tags").map { |tag| tag.fetch("id") }).to eq([own_tag.id])
    end
  end

  describe "PATCH /applications/:id" do
    it "updates owned application" do
      application = create(:application, user: user, company: company, title: "Old")

      patch "/applications/#{application.id}", params: { application: { title: "New" } }, headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      expect(application.reload.title).to eq("New")
    end


    it "rejects updating to another user's company" do
      application = create(:application, user: user, company: company)
      other_company = create(:company)

      patch "/applications/#{application.id}", params: {
        application: { company_id: other_company.id }
      }, headers: headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body).fetch("errors")).to include("Company must belong to current user")
      expect(application.reload.company_id).to eq(company.id)
    end

    it "rejects another user's tag on update" do
      application = create(:application, user: user, company: company)
      own_tag = create(:tag, user: user)
      other_tag = create(:tag)

      patch "/applications/#{application.id}", params: {
        application: { tag_ids: [own_tag.id, other_tag.id] }
      }, headers: headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body).fetch("errors").first).to include("Tags must belong to current user")
      expect(application.reload.tags).to be_empty
    end

    it "allows own company and tags on update" do
      application = create(:application, user: user, company: company)
      own_company = create(:company, user: user)
      own_tag = create(:tag, user: user)

      patch "/applications/#{application.id}", params: {
        application: { company_id: own_company.id, tag_ids: [own_tag.id] }
      }, headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      application.reload
      expect(application.company_id).to eq(own_company.id)
      expect(application.tags.map(&:id)).to eq([own_tag.id])
    end

    it "ignores status and position in update params" do
      application = create(:application, user: user, company: company, status: :wishlist, position: 100)

      patch "/applications/#{application.id}", params: {
        application: { title: "Updated", status: "applied", position: 500 }
      }, headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      application.reload
      expect(application.title).to eq("Updated")
      expect(application.status).to eq("wishlist")
      expect(application.position).to eq(100)
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
    it "moves across status and inserts by list index" do
      first = create(:application, user: user, company: company, status: :interview, position: 0)
      second = create(:application, user: user, company: company, status: :interview, position: 1024)
      application = create(:application, user: user, company: company, status: :applied, position: 1024)

      patch "/applications/#{application.id}/move", params: { application: { status: "interview", position: 1 } }, headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      expect(application.reload.status).to eq("interview")
      expect(application.position).to be > first.position
      expect(application.position).to be < second.position
      expect(application.events.order(:created_at).last.payload).to include("from" => "applied", "to" => "interview")
    end

    it "denies moving another user's application" do
      other_application = create(:application)

      patch "/applications/#{other_application.id}/move", params: { application: { status: "interview", position: 0 } }, headers: headers, as: :json

      expect(response).to have_http_status(:not_found)
    end

    it "returns validation error for invalid status value" do
      application = create(:application, user: user, company: company, status: :applied, position: 0)

      patch "/applications/#{application.id}/move", params: { application: { status: "not-real", position: 0 } }, headers: headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)).to eq("errors" => [ "Status is invalid" ])
    end

    it "returns validation errors when status or position is missing" do
      application = create(:application, user: user, company: company, status: :applied, position: 0)

      patch "/applications/#{application.id}/move", params: { application: { position: 0 } }, headers: headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)).to eq("errors" => [ "Status is required" ])

      patch "/applications/#{application.id}/move", params: { application: { status: "interview" } }, headers: headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)).to eq("errors" => [ "Position is required" ])
    end

    it "returns validation error when application payload is missing" do
      application = create(:application, user: user, company: company, status: :applied, position: 0)

      patch "/applications/#{application.id}/move", params: {}, headers: headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)).to eq("errors" => [ "Application payload is required" ])
    end

    it "returns validation error for negative position" do
      application = create(:application, user: user, company: company, status: :applied, position: 0)

      patch "/applications/#{application.id}/move", params: { application: { status: "interview", position: -1 } }, headers: headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)).to eq("errors" => [ "Position must be a non-negative integer" ])
    end

    it "returns validation error for non-numeric position" do
      application = create(:application, user: user, company: company, status: :applied, position: 0)

      patch "/applications/#{application.id}/move", params: { application: { status: "interview", position: "abc" } }, headers: headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      expect(JSON.parse(response.body)).to eq("errors" => [ "Position must be a non-negative integer" ])
    end

    it "moves to end when position is very large" do
      first = create(:application, user: user, company: company, status: :interview, position: 0)
      second = create(:application, user: user, company: company, status: :interview, position: 1024)
      application = create(:application, user: user, company: company, status: :applied, position: 0)

      patch "/applications/#{application.id}/move", params: { application: { status: "interview", position: 999_999 } }, headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      expect(application.reload.status).to eq("interview")
      expect(application.position).to be > second.position
      expect(application.position).to be > first.position
    end

    it "repositions within same status column" do
      first = create(:application, user: user, company: company, status: :interview, position: 0)
      second = create(:application, user: user, company: company, status: :interview, position: 1024)
      third = create(:application, user: user, company: company, status: :interview, position: 2048)

      patch "/applications/#{third.id}/move", params: { application: { status: "interview", position: 1 } }, headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      expect(third.reload.position).to be > first.position
      expect(third.position).to be < second.position
    end
  end

  describe "GET /applications/:id" do
    it "returns application detail with notes" do
      application = create(:application, user: user, company: company)
      note = create(:note, application: application, body: "Followed up")
      create(:event, application: application, kind: :status_changed, payload: { from: "wishlist", to: "applied" })

      get "/applications/#{application.id}", headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      payload = JSON.parse(response.body).fetch("data")
      expect(payload.fetch("id")).to eq(application.id)
      expect(payload.fetch("notes").map { |entry| entry.fetch("id") }).to include(note.id)
      expect(payload.fetch("events").map { |entry| entry.fetch("kind") }).to include("status_changed")
    end
  end

  describe "authorization boundaries" do
    it "does not show another user's application" do
      other_application = create(:application)

      get "/applications/#{other_application.id}", headers: headers, as: :json

      expect(response).to have_http_status(:not_found)
    end

    it "does not update another user's application" do
      other_application = create(:application, title: "Original")

      patch "/applications/#{other_application.id}", params: { application: { title: "Hacked" } }, headers: headers, as: :json

      expect(response).to have_http_status(:not_found)
      expect(other_application.reload.title).to eq("Original")
    end
  end
end
