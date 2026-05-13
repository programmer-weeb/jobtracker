class SignInEmailJob < ApplicationJob
  queue_as :default

  discard_on ActiveJob::DeserializationError

  def perform(user)
    UserMailer.sign_in(user).deliver_now
  end
end
