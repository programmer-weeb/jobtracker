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
      expect(JSON.parse(response.body)).to eq("error" => "Invalid email or password")
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

    it "rejects missing bearer token" do
      get "/auth/me", as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error")
    end

    it "rejects malformed bearer token" do
      get "/auth/me", headers: { "Authorization" => "Bearer not-a-jwt" }, as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error")
    end

    it "rejects expired token" do
      token, = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
      payload, header = JWT.decode(token, nil, false)
      expired_token = JWT.encode(payload.merge("exp" => 1.hour.ago.to_i), Warden::JWTAuth.config.secret, header["alg"], header)

      get "/auth/me", headers: { "Authorization" => "Bearer #{expired_token}" }, as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error")
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

    it "invalidates prior token after logout" do
      token, = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)

      delete "/auth/logout", headers: { "Authorization" => "Bearer #{token}" }, as: :json
      expect(response).to have_http_status(:no_content)

      get "/auth/me", headers: { "Authorization" => "Bearer #{token}" }, as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(JSON.parse(response.body)).to include("error")
    end
  end
end
