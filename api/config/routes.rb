Rails.application.routes.draw do
  devise_for :users
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :auth do
    post :signup
    post :login
    delete :logout
    get :me
  end

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
