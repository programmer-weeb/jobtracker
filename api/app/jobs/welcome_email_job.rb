class WelcomeEmailJob < ApplicationJob
  queue_as :default

  discard_on ActiveJob::DeserializationError

  def perform(user)
    UserMailer.welcome(user).deliver_now
  end
end
