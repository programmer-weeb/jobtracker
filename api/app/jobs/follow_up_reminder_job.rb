class FollowUpReminderJob < ApplicationJob
  queue_as :default

  discard_on ActiveJob::DeserializationError

  def perform(application)
    return if application.archived? || application.rejected?

    application.events.create!(
      kind: :reminder_sent,
      payload: {
        application_id: application.id,
        message: "Follow up reminder"
      }
    )
  end
end
