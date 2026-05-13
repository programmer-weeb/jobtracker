class UserMailer < ApplicationMailer
  def welcome(user)
    @user = user

    mail(to: @user.email, subject: "Welcome to Jobtracker")
  end

  def sign_in(user)
    @user = user
    @signed_in_at = Time.current

    mail(to: @user.email, subject: "New sign-in to your Jobtracker account")
  end
end
