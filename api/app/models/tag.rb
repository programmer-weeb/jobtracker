class Tag < ApplicationRecord
  belongs_to :user

  has_many :application_tags, dependent: :destroy
  has_many :applications, through: :application_tags

  validates :name, presence: true, uniqueness: { scope: :user_id }
  validates :color, presence: true
end
