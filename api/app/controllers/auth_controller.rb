class AuthController < ApplicationController
  before_action :authenticate_user!, only: %i[me logout]

  def signup
    user = User.new(signup_params)
    if user.save
      render_auth_payload(user, :created)
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_content
    end
  end

  def login
    user = User.find_for_database_authentication(email: login_params[:email])
    unless user&.valid_password?(login_params[:password])
      return render json: { error: "Invalid email or password" }, status: :unauthorized
    end

    render_auth_payload(user, :ok)
  end

  def me
    render json: { data: user_payload(current_user) }, status: :ok
  end

  def logout
    current_user.update!(jti: SecureRandom.uuid)
    head :no_content
  end

  private

  def signup_params
    params.require(:user).permit(:name, :email, :password, :password_confirmation)
  end

  def login_params
    params.require(:user).permit(:email, :password)
  end

  def render_auth_payload(user, status)
    token, = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil)
    response.set_header("Authorization", "Bearer #{token}")
    render json: { data: user_payload(user) }, status: status
  end

  def user_payload(user)
    {
      id: user.id,
      email: user.email,
      name: user.name
    }
  end
end
