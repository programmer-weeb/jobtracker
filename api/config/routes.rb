Rails.application.routes.draw do
  devise_for :users, skip: :all
  get "up" => "rails/health#show", as: :rails_health_check

  post "/auth/signup", to: "auth#signup"
  post "/auth/login", to: "auth#login"
  delete "/auth/logout", to: "auth#logout"
  get "/auth/me", to: "auth#me"

  resources :companies, except: :new
  resources :applications, except: :new do
    member do
      patch :move
    end

    resources :notes, only: :create
  end
  resources :notes, only: :destroy
  resources :tags, only: %i[index create destroy]
end
