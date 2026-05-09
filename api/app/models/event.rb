class Event < ApplicationRecord
  belongs_to :application

  enum :kind, {
    status_changed: 0,
    note_added: 1,
    reminder_sent: 2
  }, default: :status_changed

  validates :payload, presence: true
end
