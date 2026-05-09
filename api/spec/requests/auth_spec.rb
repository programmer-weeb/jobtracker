require "rails_helper"

RSpec.describe "Auth", type: :request do
  describe "POST /auth/signup" do
    it "creates user and returns token" do
      post "/auth/signup", params: {
        user: {
          name: "Ahmed",
          email: "ahmed@example.com",
          password: "password123",
          password_confirmation: "password123"
        }
      }, as: :json

      expect(response).to have_http_status(:created)
      expect(response.headers["Authorization"]).to start_with("Bearer ")
      expect(JSON.parse(response.body).dig("data", "email")).to eq("ahmed@example.com")
    end
  end

  describe "POST /auth/login" do
    let!(:user) { create(:user, email: "login@example.com", password: "password123") }

    it "returns token for valid credentials" do
      post "/auth/login", params: {
        user: {
          email: "login@example.com",
          password: "password123"
        }
      }, as: :json

      expect(response).to have_http_status(:ok)
      expect(response.headers["Authorization"]).to start_with("Bearer ")
    end

    it "rejects invalid credentials" do
      post "/auth/login", params: {
        user: {
          email: "login@example.com",
          password: "wrong-password"
        }
      }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /auth/me" do
    let!(:user) { create(:user, email: "me@example.com", password: "password123") }

    it "returns current user with bearer token" do
      token, = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)

      get "/auth/me", headers: { "Authorization" => "Bearer #{token}" }, as: :json

      expect(response).to have_http_status(:ok)
      expect(JSON.parse(response.body).dig("data", "email")).to eq("me@example.com")
    end
  end

  describe "DELETE /auth/logout" do
    let!(:user) { create(:user, password: "password123") }

    it "rotates jti and returns no content" do
      token, = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
      original_jti = user.jti

      delete "/auth/logout", headers: { "Authorization" => "Bearer #{token}" }, as: :json

      expect(response).to have_http_status(:no_content)
      expect(user.reload.jti).not_to eq(original_jti)
    end
  end
end
